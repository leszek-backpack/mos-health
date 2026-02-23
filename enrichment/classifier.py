"""Phase 2: Classify personalization signals via OpenRouter LLM (Gemini 2.5 Flash)."""

import asyncio
import json
import logging
import re

from openai import AsyncOpenAI

from config import (
    CLASSIFY_BACKOFF_BASE,
    CLASSIFY_MAX_RETRIES,
    CLASSIFY_MAX_TOKENS,
    CLASSIFY_TEMPERATURE,
    FALLBACK_MODEL,
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    PRIMARY_MODEL,
)

log = logging.getLogger(__name__)

SIGNAL_CATEGORIES = [
    "athletic_fitness", "wellness_health", "culture_values", "parenting_family",
    "career_transition", "personal_achievement", "hobby_passion",
    "community_volunteering", "education", "content_creation",
]

CAREER_TIMINGS = [
    "new_role_0_3mo", "new_role_3_6mo", "new_role_6_12mo",
    "established", "unknown",
]

INSTRUCTIONS = """You are a personalization signal analyst for B2B sales outreach. Your client sells premium workplace health supplements (think: daily vitamin packs, focus/energy formulas, recovery blends) as an office benefit for tech companies.

SIGNAL CATEGORIES (in priority order for conversion):

A+ ATHLETIC/FITNESS: Marathons, triathlons, cycling, CrossFit, yoga, gym, hiking, team sports, fitness challenges, Strava mentions, race results, workout posts
A+ WELLNESS/HEALTH: Biohacking, meditation, nutrition, sleep optimization, supplements, mental health advocacy, burnout recovery, mindfulness
A  CULTURE/VALUES: Posts about employee wellbeing, company culture, benefits programs, remote work wellness, team building, "people-first" leadership
A- PARENTING/FAMILY: Work-life balance posts, parenting content, burnout empathy, "juggling work and kids"
A- CAREER TRANSITION: Recently started new role (check experience dates), new company = evaluating vendors = buying window
B+ PERSONAL ACHIEVEMENT: Awards, speaking engagements, promotions, book publishing, conference talks (warm opener: "congrats!")
B  HOBBY/PASSION: Cooking, travel, pets, photography, music, gardening — shows you see them as a person
B  COMMUNITY/VOLUNTEERING: Charity runs (fitness + giving!), board memberships, mentoring, nonprofit work
B- EDUCATION: College sports teams (athlete identity persists), health/nutrition degrees, MBA programs
B- CONTENT CREATION: Posting frequency itself is a signal — frequent posters are more responsive to personalized outreach

COMBINATION SCORING:
- tier1: Fitness/Wellness + Culture Advocate + New Role = near-certain meeting
- tier1: Wellness Advocate + Active Content Creator with culture posts
- tier1: Fitness + Recently Hired at Growing Company
- tier2: Any single A+ or A category with high confidence
- tier2: Two B+ signals together
- tier3: Only B or B- signals, or low confidence findings

GUIDELINES:
- Be SPECIFIC — reference exact posts, races, achievements, companies by name
- Primary hook should be the highest-converting signal you found
- Backup hook should be a DIFFERENT category (diversify angles)
- Genuine > clever. "Hey, saw you ran the SF Half Marathon" beats "As a fellow health enthusiast..."
- NEVER reference: health struggles, weight loss journeys, political opinions, religious beliefs, grief/loss, anything that could only be inferred (not explicitly stated)
- If career timing shows new role < 6 months, factor that into quality tier
- Content activity: high = 3+ posts/month, medium = 1-2/month, low = sporadic, none = no posts found

Return a JSON object with these exact fields:
{
  "primary_hook": "A specific, genuine 1-2 sentence opener referencing something concrete",
  "primary_hook_category": "one of the 10 categories",
  "primary_hook_confidence": "high|medium|low",
  "backup_hook": "A different angle/category for the second touch or fallback",
  "backup_hook_category": "one of the 10 categories",
  "career_timing": "new_role_0_3mo|new_role_3_6mo|new_role_6_12mo|established|unknown",
  "culture_advocate_score": 0-5,
  "prospect_quality": "tier1|tier2|tier3",
  "signals_found": [{"category": "...", "detail": "...", "confidence": "high|medium|low"}],
  "avoid_topics": ["topic1", "topic2"],
  "content_activity": "high|medium|low|none"
}"""


def _build_user_message(
    profile: dict,
    experience: list,
    education: list,
    posts: list,
) -> str:
    """Build the user message with prospect data."""
    post_lines = []
    for i, p in enumerate(posts[:30]):
        likes = 0
        activity = p.get("activity")
        if isinstance(activity, dict):
            likes = activity.get("num_likes", 0)
        title = (p.get("title") or "")[:500]
        post_lines.append(f"[{i+1}] ({p.get('created_at', '?')}) [{likes} likes] {title}")

    return f"""PROSPECT DATA:
Name: {profile.get('full_name', '?')}
Headline: {profile.get('headline', '')}
Location: {json.dumps(profile.get('location', {}))}
Open to Work: {profile.get('is_open_to_work', False)}
Currently Hiring: {profile.get('is_hiring', False)}
{('About: ' + profile['about']) if profile.get('about') else ''}

EXPERIENCE (most recent first):
{json.dumps(experience[:5], indent=2)}

EDUCATION:
{json.dumps(education[:3], indent=2)}

RECENT POSTS ({len(posts)} total):
{chr(10).join(post_lines) if post_lines else '(no posts found)'}"""


def _parse_json_response(content: str) -> dict | None:
    """Extract JSON from LLM response, handling markdown fences."""
    clean = re.sub(r"^```(?:json)?\s*", "", content.strip())
    clean = re.sub(r"\s*```$", "", clean)
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        pass
    # Fallback: find first { ... } block
    start = content.find("{")
    end = content.rfind("}")
    if start >= 0 and end > start:
        try:
            return json.loads(content[start : end + 1])
        except json.JSONDecodeError:
            pass
    return None


def _normalize_result(parsed: dict, model: str) -> dict:
    """Normalize parsed JSON into the expected output schema."""

    def _list_to_str(val) -> str:
        if isinstance(val, list):
            return "; ".join(
                f"{s.get('category', '')}: {s.get('detail', '')} ({s.get('confidence', '')})"
                if isinstance(s, dict)
                else str(s)
                for s in val
            )
        return str(val) if val else ""

    signals = parsed.get("signals_found", [])
    avoid = parsed.get("avoid_topics", [])

    return {
        "primary_hook": parsed.get("primary_hook", ""),
        "primary_hook_category": parsed.get("primary_hook_category", ""),
        "primary_hook_confidence": parsed.get("primary_hook_confidence", ""),
        "backup_hook": parsed.get("backup_hook", ""),
        "backup_hook_category": parsed.get("backup_hook_category", ""),
        "career_timing": parsed.get("career_timing", "unknown"),
        "culture_advocate_score": str(parsed.get("culture_advocate_score", 0)),
        "prospect_quality": parsed.get("prospect_quality", "tier3"),
        "signals_found": _list_to_str(signals),
        "avoid_topics": "; ".join(avoid) if isinstance(avoid, list) else str(avoid),
        "content_activity": parsed.get("content_activity", "none"),
        "model_used": model,
        "error": "",
    }


def _error_result(model: str, error: str) -> dict:
    """Return a safe error result dict."""
    return {
        "primary_hook": "",
        "primary_hook_category": "",
        "primary_hook_confidence": "",
        "backup_hook": "",
        "backup_hook_category": "",
        "career_timing": "unknown",
        "culture_advocate_score": "0",
        "prospect_quality": "tier3",
        "signals_found": "",
        "avoid_topics": "",
        "content_activity": "none",
        "model_used": model,
        "error": error[:200],
    }


async def classify_one(
    client: AsyncOpenAI,
    profile: dict,
    experience: list,
    education: list,
    posts: list,
    model: str,
) -> dict:
    """Classify signals for one prospect via LLM."""
    messages = [
        {"role": "system", "content": INSTRUCTIONS},
        {"role": "user", "content": _build_user_message(profile, experience, education, posts)},
    ]

    for attempt in range(CLASSIFY_MAX_RETRIES):
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=CLASSIFY_TEMPERATURE,
                max_tokens=CLASSIFY_MAX_TOKENS,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content.strip()
            parsed = _parse_json_response(content)

            if not parsed:
                log.warning(f"  JSON parse error (attempt {attempt+1}), raw: {content[:200]}")
                return _error_result(model, "json_parse_error")

            # Validate required fields
            required = ("primary_hook", "prospect_quality")
            missing = [f for f in required if not parsed.get(f)]
            if missing:
                log.warning(f"  Missing fields {missing} (attempt {attempt+1})")
                if attempt < CLASSIFY_MAX_RETRIES - 1:
                    await asyncio.sleep(CLASSIFY_BACKOFF_BASE)
                    continue

            return _normalize_result(parsed, model)

        except json.JSONDecodeError:
            log.warning(f"  JSON decode error (attempt {attempt+1})")
            return _error_result(model, "json_parse_error")

        except Exception as e:
            error_str = str(e)
            is_rate_limit = "429" in error_str or "rate" in error_str.lower()

            if is_rate_limit:
                wait = CLASSIFY_BACKOFF_BASE * (2**attempt)
                log.warning(f"  Rate limited (attempt {attempt+1}), waiting {wait}s...")
                await asyncio.sleep(wait)
                continue

            log.error(f"  LLM error: {e}")
            if attempt == CLASSIFY_MAX_RETRIES - 1:
                return _error_result(model, error_str)
            await asyncio.sleep(CLASSIFY_BACKOFF_BASE)

    return _error_result(model, "max_retries_exceeded")


async def classify_prospect(
    profile: dict,
    experience: list,
    education: list,
    posts: list,
) -> dict:
    """Classify one prospect with primary model + fallback.

    Returns dict with all signal fields, model_used, and error.
    """
    if not OPENROUTER_API_KEY:
        log.error("OPENROUTER_API_KEY not set. Cannot classify.")
        return _error_result("none", "missing_api_key")

    client = AsyncOpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url=OPENROUTER_BASE_URL,
        max_retries=0,  # We handle retries ourselves
    )

    # Try primary model
    result = await classify_one(client, profile, experience, education, posts, PRIMARY_MODEL)

    # Fallback if primary failed with a non-parse error
    if result.get("error") and result["error"] != "json_parse_error":
        log.info(f"  Falling back to {FALLBACK_MODEL}")
        result = await classify_one(client, profile, experience, education, posts, FALLBACK_MODEL)

    return result
