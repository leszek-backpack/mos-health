"""LinkedIn Signal Enrichment Pipeline — CLI entry point.

Enriches a CSV of LinkedIn URLs/usernames with personalization signals.
Phase 1: Fetch profile + posts via Trigger.dev api-proxy queue (RapidAPI).
Phase 2: Classify signals via Gemini on OpenRouter.

Usage (run from mos-health/ root):
  python3 enrichment/main.py --input enrichment/input/prospects.csv
  python3 enrichment/main.py --input enrichment/input/prospects.csv --test-count 1
  python3 enrichment/main.py --stats
  python3 enrichment/main.py --reset
  python3 enrichment/main.py --input enrichment/input/prospects.csv --phase fetch
  python3 enrichment/main.py --input enrichment/input/prospects.csv --retry-failed
"""

import argparse
import asyncio
import csv
import json
import logging
import signal
import sys
import traceback
from datetime import datetime
from pathlib import Path
from time import time

import httpx

from config import (
    OUTPUT_DIR,
    PROGRESS_FILE,
    USERNAME_COLUMN,
    setup_logging,
)
from classifier import classify_prospect
from fetcher import fetch_all

log = logging.getLogger(__name__)

OUTPUT_COLUMNS = [
    "identifier", "full_name", "headline",
    "primary_hook", "primary_hook_category", "primary_hook_confidence",
    "backup_hook", "backup_hook_category",
    "career_timing", "culture_advocate_score", "prospect_quality",
    "signals_found", "avoid_topics",
    "posts_analyzed", "content_activity", "fetch_status",
    "model_used", "error",
]


# ── Checkpoint (progress.json) ──────────────────────────────────────────────


def load_progress() -> dict:
    """Load checkpoint from progress.json."""
    if PROGRESS_FILE.exists():
        try:
            return json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as e:
            log.error(f"Failed to load progress.json: {e}, starting fresh")
    return {
        "processed": {},
        "last_updated": datetime.now().isoformat(),
        "stats": {
            "ok": 0, "error": 0, "no_data": 0,
            "signals_found": {},
        },
    }


def save_progress(progress: dict) -> None:
    """Save checkpoint to progress.json (atomic write)."""
    try:
        progress["last_updated"] = datetime.now().isoformat()
        tmp = PROGRESS_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(progress, indent=2), encoding="utf-8")
        tmp.replace(PROGRESS_FILE)
    except OSError as e:
        log.error(f"Failed to save progress: {e}")


def reset_progress() -> None:
    """Delete progress.json to start fresh."""
    if PROGRESS_FILE.exists():
        PROGRESS_FILE.unlink()
        print("Progress reset.")
    else:
        print("No progress file found.")


# ── CSV I/O ──────────────────────────────────────────────────────────────────


def read_input_csv(path: str) -> list[str]:
    """Read identifiers from input CSV (LinkedIn URLs or usernames)."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Input file not found: {path}")

    identifiers = []
    with open(p, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            # No header row — treat each line as a bare identifier
            f.seek(0)
            for line in f:
                val = line.strip()
                if val:
                    identifiers.append(val)
            log.info(f"Read {len(identifiers)} identifiers from {path} (no header)")
            return identifiers

        # Normalize column names
        col_map = {c.strip().lower().replace(" ", "_"): c for c in (reader.fieldnames or [])}
        # Find the identifier column
        target_col = None
        for candidate in [USERNAME_COLUMN, "public_identifier", "linkedin_url", "url", "username"]:
            if candidate in col_map:
                target_col = col_map[candidate]
                break

        if target_col is None:
            # Fallback: if single-column CSV, use that column
            if len(reader.fieldnames) == 1:
                target_col = reader.fieldnames[0]
            else:
                raise ValueError(
                    f'Column "{USERNAME_COLUMN}" not found. '
                    f"Available: {', '.join(reader.fieldnames)}"
                )

        for row in reader:
            val = (row.get(target_col) or "").strip()
            if val:
                identifiers.append(val)

    log.info(f"Read {len(identifiers)} identifiers from {path} (column: {target_col})")
    return identifiers


def init_output_csv(path: Path) -> None:
    """Create output CSV with headers if it doesn't exist."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        with open(path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS)
            writer.writeheader()


def append_row(path: Path, row: dict) -> None:
    """Append a single row to the output CSV."""
    with open(path, "a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS, extrasaction="ignore")
        writer.writerow(row)


# ── Stats ────────────────────────────────────────────────────────────────────


def show_stats() -> None:
    """Show progress breakdown from checkpoint."""
    progress = load_progress()
    processed = progress.get("processed", {})
    stats = progress.get("stats", {})

    total = len(processed)
    ok = stats.get("ok", 0)
    errors = stats.get("error", 0)
    no_data = stats.get("no_data", 0)
    signals = stats.get("signals_found", {})

    print(f"\n{'='*50}")
    print(f"ENRICHMENT PROGRESS: {total} people processed")
    print(f"  OK:        {ok}")
    print(f"  No data:   {no_data}")
    print(f"  Errors:    {errors}")

    if signals:
        print(f"\nSignal Categories Found:")
        for cat, count in sorted(signals.items(), key=lambda x: -x[1]):
            print(f"  {cat:25s}: {count}")

    # Quality tier breakdown
    by_quality = {}
    by_category = {}
    for v in processed.values():
        if isinstance(v, dict) and v.get("status") == "ok":
            q = v.get("prospect_quality", "")
            if q:
                by_quality[q] = by_quality.get(q, 0) + 1
            cat = v.get("primary_hook_category", "")
            if cat:
                by_category[cat] = by_category.get(cat, 0) + 1

    if by_quality:
        print(f"\nProspect Quality:")
        for q, count in sorted(by_quality.items()):
            print(f"  {q:10s}: {count}")

    if by_category:
        print(f"\nPrimary Hook Categories:")
        for cat, count in sorted(by_category.items(), key=lambda x: -x[1]):
            print(f"  {cat:25s}: {count}")

    print(f"\nLast updated: {progress.get('last_updated', '?')}")
    print(f"{'='*50}\n")


# ── Progress Reporter ────────────────────────────────────────────────────────


class ProgressReporter:
    def __init__(self, total: int):
        self.total = total
        self.done = 0
        self.start_time = time()

    def tick(self, identifier: str, status: str) -> None:
        self.done += 1
        elapsed = time() - self.start_time
        avg = elapsed / self.done
        remaining = (self.total - self.done) * avg
        pct = (self.done / self.total) * 100
        eta_min = remaining / 60
        # Truncate identifier for display
        display_id = identifier[:40] + "..." if len(identifier) > 43 else identifier
        log.info(
            f"[{self.done}/{self.total}] ({pct:.1f}%) {display_id} -> {status} | ETA: {eta_min:.1f}m"
        )


# ── Pipeline ─────────────────────────────────────────────────────────────────


async def process_one(
    client: httpx.AsyncClient,
    identifier: str,
    output_path: Path,
    progress: dict,
    reporter: ProgressReporter,
    phase: str | None,
) -> None:
    """Process a single person: fetch + classify + write."""
    log.info(f"\n--- Processing: {identifier} ---")

    # Phase 1: Fetch
    fetched = progress.get("fetched", {}).get(identifier)
    if fetched and phase != "fetch":
        log.info("  Using cached fetch data from checkpoint")
    else:
        fetched = await fetch_all(client, identifier)
        # Save fetch data in checkpoint
        progress.setdefault("fetched", {})[identifier] = fetched
        save_progress(progress)

    if fetched.get("fetch_status") == "no_data":
        row = {
            "identifier": identifier,
            "fetch_status": "no_data",
            "error": fetched.get("error", "profile_not_found"),
            "posts_analyzed": "0",
        }
        append_row(output_path, row)
        progress.setdefault("processed", {})[identifier] = {"status": "no_data"}
        progress["stats"]["no_data"] = progress["stats"].get("no_data", 0) + 1
        save_progress(progress)
        reporter.tick(identifier, "no_data")
        return

    if fetched.get("fetch_status") == "error":
        row = {
            "identifier": identifier,
            "fetch_status": "error",
            "error": fetched.get("error", "fetch_error"),
            "posts_analyzed": "0",
        }
        append_row(output_path, row)
        progress.setdefault("processed", {})[identifier] = {"status": "error"}
        progress["stats"]["error"] = progress["stats"].get("error", 0) + 1
        save_progress(progress)
        reporter.tick(identifier, "error")
        return

    if phase == "fetch":
        reporter.tick(identifier, "fetched")
        return

    # Phase 2: Classify
    profile = fetched["profile"]
    experience = fetched.get("experience", [])
    education = fetched.get("education", [])
    posts = fetched.get("posts", [])

    log.info("  Analyzing signals...")
    signals = await classify_prospect(profile, experience, education, posts)

    quality = signals.get("prospect_quality", "?")
    hook_cat = signals.get("primary_hook_category", "?")
    confidence = signals.get("primary_hook_confidence", "?")
    log.info(f"  Quality: {quality} | Primary: {hook_cat} ({confidence})")

    # Write output row
    row = {
        "identifier": identifier,
        "full_name": profile.get("full_name", ""),
        "headline": profile.get("headline", ""),
        "posts_analyzed": str(len(posts)),
        "fetch_status": "ok",
        **signals,
    }
    append_row(output_path, row)

    # Update checkpoint
    signal_categories = []
    signals_raw = signals.get("signals_found", "")
    if signals_raw:
        for part in signals_raw.split("; "):
            cat = part.split(":")[0].strip()
            if cat:
                signal_categories.append(cat)

    progress.setdefault("processed", {})[identifier] = {
        "status": "ok",
        "prospect_quality": quality,
        "primary_hook_category": hook_cat,
    }
    progress["stats"]["ok"] = progress["stats"].get("ok", 0) + 1
    for cat in signal_categories:
        progress["stats"].setdefault("signals_found", {})[cat] = (
            progress["stats"].get("signals_found", {}).get(cat, 0) + 1
        )
    save_progress(progress)

    reporter.tick(identifier, f"ok ({quality})")


async def pipeline(args) -> None:
    """Run the enrichment pipeline."""
    if not args.input:
        log.error("--input is required (unless using --stats or --reset)")
        return

    # Read input
    identifiers = read_input_csv(args.input)

    # Apply test limits
    if args.test_count:
        identifiers = identifiers[: args.test_count]
        log.info(f"Test mode: processing first {args.test_count} people")
    elif args.test:
        identifiers = identifiers[:10]
        log.info("Test mode: processing first 10 people")

    # Load checkpoint
    progress = load_progress()
    already_done = set(progress.get("processed", {}).keys())

    # Retry-failed: clear errored entries
    if args.retry_failed:
        processed = progress.get("processed", {})
        failed = [k for k, v in processed.items() if isinstance(v, dict) and v.get("status") == "error"]
        if failed:
            for k in failed:
                del processed[k]
            progress["stats"]["error"] = max(0, progress["stats"].get("error", 0) - len(failed))
            save_progress(progress)
            already_done -= set(failed)
            log.info(f"Cleared {len(failed)} failed entries for retry")
        else:
            log.info("No failed entries to retry")

    # Filter to remaining
    remaining = [i for i in identifiers if i not in already_done]

    print(f"\n=== LinkedIn Signal Enrichment Pipeline ===\n")
    print(f"  Input:      {args.input}")
    print(f"  Total:      {len(identifiers)} identifiers")
    print(f"  Done:       {len(already_done)}")
    print(f"  Remaining:  {len(remaining)}")
    if args.phase:
        print(f"  Phase:      {args.phase} only")
    print()

    if not remaining:
        print("Nothing to process — all identifiers already in checkpoint.")
        return

    # Create timestamped output CSV
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    stem = Path(args.input).stem
    output_path = OUTPUT_DIR / f"{stem}_enriched_{ts}.csv"
    init_output_csv(output_path)
    log.info(f"Output: {output_path}")

    reporter = ProgressReporter(len(remaining))

    # Process sequentially (api-proxy queue is serial anyway)
    async with httpx.AsyncClient(timeout=httpx.Timeout(90.0)) as client:
        for identifier in remaining:
            try:
                await process_one(client, identifier, output_path, progress, reporter, args.phase)
            except KeyboardInterrupt:
                raise
            except Exception as e:
                log.error(f"  UNEXPECTED ERROR: {e}")
                log.error(traceback.format_exc())
                row = {
                    "identifier": identifier,
                    "fetch_status": "error",
                    "error": str(e)[:200],
                    "posts_analyzed": "0",
                }
                append_row(output_path, row)
                progress.setdefault("processed", {})[identifier] = {"status": "error"}
                progress["stats"]["error"] = progress["stats"].get("error", 0) + 1
                save_progress(progress)
                reporter.tick(identifier, "error")

    # Summary
    print(f"\n{'='*60}")
    print("=== COMPLETE ===\n")
    print(f"Output: {output_path}")
    show_stats()


def main():
    parser = argparse.ArgumentParser(
        description="LinkedIn Signal Enrichment Pipeline"
    )
    parser.add_argument("--input", "-i", help="Path to input CSV")
    parser.add_argument("--test", action="store_true", help="Test mode: process first 10 people")
    parser.add_argument("--test-count", type=int, help="Test mode: process first N people")
    parser.add_argument(
        "--phase", choices=["fetch", "classify"],
        help="Run only one phase (fetch or classify)",
    )
    parser.add_argument("--stats", action="store_true", help="Show progress breakdown")
    parser.add_argument("--reset", action="store_true", help="Clear checkpoint and start fresh")
    parser.add_argument("--retry-failed", action="store_true", help="Retry failed entries")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable debug logging")

    args = parser.parse_args()
    setup_logging(verbose=args.verbose)

    # Quick commands
    if args.stats:
        show_stats()
        return
    if args.reset:
        reset_progress()
        return

    # SIGTERM handler
    def handle_sigterm(signum, frame):
        log.warning("SIGTERM received — checkpoint already saved")
        sys.exit(0)

    signal.signal(signal.SIGTERM, handle_sigterm)

    # Run pipeline
    try:
        asyncio.run(pipeline(args))
    except KeyboardInterrupt:
        log.warning("Interrupted — checkpoint already saved")
    except Exception as e:
        log.error(f"Pipeline crashed: {e}")
        log.error(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()
