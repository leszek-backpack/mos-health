"""Phase 1: Fetch LinkedIn data via RapidAPI through Trigger.dev api-proxy queue.

The api-proxy task (concurrency: 1, 3.5s delay, 3x retry) ensures one RapidAPI
key is shared safely across all projects without 429 conflicts.

Trigger.dev REST API:
  POST /api/v1/tasks/api-proxy/trigger  → start a run
  GET  /api/v3/runs/{run_id}            → poll for result
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx

from config import (
    LOOKBACK_DAYS,
    MAX_POST_PAGES,
    MAX_POSTS_PER_PERSON,
    RAPIDAPI_HOST,
    RAPIDAPI_KEY,
    TRIGGER_API_URL,
    TRIGGER_POLL_INTERVAL,
    TRIGGER_POLL_TIMEOUT,
    TRIGGER_SECRET_KEY,
)

log = logging.getLogger(__name__)


# ── RapidAPI URL/Header helpers ──────────────────────────────────────────────


def _build_headers() -> dict[str, str]:
    if not RAPIDAPI_KEY:
        raise RuntimeError("Missing RAPIDAPI_KEY env var")
    return {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
    }


def _build_url(path: str, params: dict | None = None) -> str:
    qs = ""
    if params:
        filtered = {k: str(v) for k, v in params.items() if v is not None and v != ""}
        if filtered:
            qs = "?" + urlencode(filtered)
    return f"https://{RAPIDAPI_HOST}{path}{qs}"


def _extract_username(identifier: str) -> str:
    """Extract LinkedIn username/slug from a URL or return as-is if already a username."""
    if identifier.startswith("http"):
        # https://www.linkedin.com/in/username or /in/ACwAABzX3qs.../
        from urllib.parse import urlparse
        path = urlparse(identifier).path.rstrip("/")
        # /in/username → username
        parts = path.split("/")
        if "in" in parts:
            idx = parts.index("in")
            if idx + 1 < len(parts):
                return parts[idx + 1]
        # Fallback: last non-empty segment
        return parts[-1] if parts else identifier
    return identifier


def _identifier_param(identifier: str) -> dict[str, str]:
    """Build the query param for RapidAPI. Always uses `username`."""
    username = _extract_username(identifier)
    return {"username": username}


# ── Trigger.dev REST API ─────────────────────────────────────────────────────


def _trigger_headers() -> dict[str, str]:
    if not TRIGGER_SECRET_KEY:
        raise RuntimeError("Missing TRIGGER_SECRET_KEY_PROD or TRIGGER_SECRET_KEY_DEV")
    return {
        "Authorization": f"Bearer {TRIGGER_SECRET_KEY}",
        "Content-Type": "application/json",
    }


async def _trigger_api_proxy(client: httpx.AsyncClient, url: str, headers: dict) -> str:
    """Trigger the api-proxy task. Returns run ID."""
    resp = await client.post(
        f"{TRIGGER_API_URL}/api/v1/tasks/api-proxy/trigger",
        headers=_trigger_headers(),
        json={"payload": {"url": url, "headers": headers}},
    )
    resp.raise_for_status()
    data = resp.json()
    run_id = data.get("id")
    if not run_id:
        raise RuntimeError(f"No run ID in trigger response: {data}")
    log.debug(f"  Triggered run {run_id}")
    return run_id


async def _poll_run(client: httpx.AsyncClient, run_id: str) -> dict:
    """Poll a Trigger.dev run until complete. Returns the run output."""
    deadline = asyncio.get_event_loop().time() + TRIGGER_POLL_TIMEOUT
    terminal_statuses = {"COMPLETED", "FAILED", "CANCELED", "CRASHED", "SYSTEM_FAILURE", "INTERRUPTED", "EXPIRED"}

    while True:
        resp = await client.get(
            f"{TRIGGER_API_URL}/api/v3/runs/{run_id}",
            headers=_trigger_headers(),
        )
        resp.raise_for_status()
        run_data = resp.json()
        status = run_data.get("status", "")

        if status in terminal_statuses:
            if status != "COMPLETED":
                error = run_data.get("error", status)
                raise RuntimeError(f"api-proxy run {run_id} ended with {status}: {error}")
            output = run_data.get("output")
            if output is None:
                raise RuntimeError(f"api-proxy run {run_id} completed but no output")
            return output

        if asyncio.get_event_loop().time() > deadline:
            raise TimeoutError(f"api-proxy run {run_id} timed out after {TRIGGER_POLL_TIMEOUT}s (status={status})")

        await asyncio.sleep(TRIGGER_POLL_INTERVAL)


async def call_api_proxy(client: httpx.AsyncClient, url: str, headers: dict) -> dict:
    """Trigger api-proxy task + poll until complete. Returns {status, data, truncated}."""
    run_id = await _trigger_api_proxy(client, url, headers)
    return await _poll_run(client, run_id)


# ── LinkedIn Data Fetchers ───────────────────────────────────────────────────


async def fetch_profile(client: httpx.AsyncClient, identifier: str) -> dict:
    """Fetch profile + experience + education. Returns combined dict."""
    headers = _build_headers()
    id_param = _identifier_param(identifier)

    # Profile
    profile_url = _build_url("/api/v1/user/profile", id_param)
    profile_result = await call_api_proxy(client, profile_url, headers)

    if profile_result.get("status") != 200:
        log.warning(f"  [profile] HTTP {profile_result.get('status')} for {identifier}")
        return {"profile": None, "experience": [], "education": []}

    profile_resp = profile_result.get("data", {})
    if not isinstance(profile_resp, dict) or not profile_resp.get("success") or not profile_resp.get("data"):
        log.warning(f"  [profile] No data for {identifier}")
        return {"profile": None, "experience": [], "education": []}

    profile_data = profile_resp["data"]

    # For subsequent calls, prefer the resolved username (cheaper)
    resolved_param = id_param
    pub_id = profile_data.get("public_identifier")
    if pub_id:
        resolved_param = {"username": pub_id}

    # Experience
    exp_url = _build_url("/api/v1/user/experiences", resolved_param)
    exp_result = await call_api_proxy(client, exp_url, headers)
    exp_resp = exp_result.get("data", {})
    experience = []
    if isinstance(exp_resp, dict) and exp_resp.get("success"):
        experience = exp_resp.get("data", []) or []

    # Education
    edu_url = _build_url("/api/v1/user/educations", resolved_param)
    edu_result = await call_api_proxy(client, edu_url, headers)
    edu_resp = edu_result.get("data", {})
    education = []
    if isinstance(edu_resp, dict) and edu_resp.get("success"):
        education = edu_resp.get("data", []) or []

    return {
        "profile": profile_data,
        "experience": experience,
        "education": education,
    }


async def fetch_posts_paginated(client: httpx.AsyncClient, identifier: str) -> list[dict]:
    """Fetch posts with pagination and date cutoff."""
    headers = _build_headers()
    id_param = _identifier_param(identifier)
    cutoff = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)

    all_posts: list[dict] = []

    for page in range(1, MAX_POST_PAGES + 1):
        url = _build_url("/api/v1/user/posts", {**id_param, "page": page})
        result = await call_api_proxy(client, url, headers)

        if result.get("status") != 200:
            log.warning(f"  [posts] HTTP {result.get('status')} on page {page}")
            break

        resp = result.get("data", {})
        if not isinstance(resp, dict) or not resp.get("success"):
            break
        posts = resp.get("data", [])
        if not posts:
            break

        for post in posts:
            created_at = post.get("created_at", "")
            if created_at:
                try:
                    post_date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    if post_date < cutoff:
                        return all_posts
                except (ValueError, TypeError):
                    pass  # Can't parse date, include the post anyway

            all_posts.append(post)
            if len(all_posts) >= MAX_POSTS_PER_PERSON:
                return all_posts

        if not resp.get("has_more"):
            break

    return all_posts


async def fetch_all(client: httpx.AsyncClient, identifier: str) -> dict:
    """Fetch everything for one person: profile, experience, education, posts.

    Returns:
        {profile, experience, education, posts, fetch_status, error}
    """
    try:
        # Profile + experience + education (3 sequential API calls)
        log.info("  Fetching profile, experience, education...")
        profile_data = await fetch_profile(client, identifier)

        if not profile_data.get("profile"):
            return {
                **profile_data,
                "posts": [],
                "fetch_status": "no_data",
                "error": "profile_not_found",
            }

        profile = profile_data["profile"]
        log.info(
            f"  Profile: {profile.get('full_name', '?')} — {profile.get('headline', '')[:60]}"
        )
        log.info(
            f"  Experience: {len(profile_data['experience'])} entries, "
            f"Education: {len(profile_data['education'])} entries"
        )

        # Posts (paginated, 1-6 pages)
        log.info("  Fetching posts...")
        posts = await fetch_posts_paginated(client, identifier)
        log.info(f"  Posts: {len(posts)} within {LOOKBACK_DAYS}-day window")

        return {
            "profile": profile,
            "experience": profile_data["experience"],
            "education": profile_data["education"],
            "posts": posts,
            "fetch_status": "ok",
            "error": "",
        }

    except Exception as e:
        log.error(f"  Fetch error for {identifier}: {e}")
        return {
            "profile": None,
            "experience": [],
            "education": [],
            "posts": [],
            "fetch_status": "error",
            "error": str(e)[:200],
        }
