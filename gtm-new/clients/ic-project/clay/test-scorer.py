#!/usr/bin/env python3
"""
IC Project — Simplified Qualification Test (v5)

Tests: qualified/not + tier + personalization hook + poke question.
Also assembles a sample Message 1 using the copy templates.

Usage:
    python3 clay/test-scorer.py                                  # All 20, default model
    python3 clay/test-scorer.py --count 5                        # First 5
    python3 clay/test-scorer.py --company "SaMASZ"               # One company
    python3 clay/test-scorer.py --show-messages                  # Print assembled M1
    python3 clay/test-scorer.py --model gemini                   # gemini-3.1-pro-preview
    python3 clay/test-scorer.py --model sonnet                   # claude-sonnet-4-6
    python3 clay/test-scorer.py --model flash                    # gemini-2.5-flash (cheap)
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path

# Load .env — try multiple locations
workspace_root = Path(__file__).resolve().parent.parent.parent.parent.parent
for env_candidate in [
    workspace_root / "APP" / ".env",
    workspace_root / ".env",
    Path(__file__).parent / ".env",
]:
    if env_candidate.exists():
        for line in env_candidate.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and value and key not in os.environ:
                    os.environ[key] = value
        break

try:
    from openai import OpenAI
except ImportError:
    print("Error: pip install openai")
    sys.exit(1)

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    print("Error: OPENROUTER_API_KEY not found")
    sys.exit(1)

client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENROUTER_API_KEY)

MODEL_ALIASES = {
    "gemini": "google/gemini-3.1-pro-preview",
    "sonnet": "anthropic/claude-sonnet-4-6",
    "flash": "google/gemini-2.5-flash",
    "pro": "google/gemini-2.5-pro",
}

# Cost per 1M tokens (input, output) for display
MODEL_COSTS = {
    "google/gemini-3.1-pro-preview": (2.0, 12.0),
    "anthropic/claude-sonnet-4-6": (3.0, 15.0),
    "google/gemini-2.5-flash": (0.15, 0.60),
    "google/gemini-2.5-pro": (1.25, 10.0),
}

SCHEMA_PATH = Path(__file__).parent / "optimized-qualification-schema.json"
with open(SCHEMA_PATH) as f:
    schema = json.load(f)
PROMPT_TEMPLATE = schema["prompt"]

# Load copy schema for message assembly
COPY_SCHEMA_PATH = Path(__file__).parent / "optimized-copy-schema.json"
with open(COPY_SCHEMA_PATH) as f:
    copy_schema = json.load(f)


def load_test_data() -> list[dict]:
    data_path = Path(__file__).parent / "test-data" / "sample-companies.json"
    with open(data_path) as f:
        return json.load(f)


def signal_type_to_bucket(signal_type: str) -> str:
    """Map scorer's signal_type to template bucket."""
    return {"event": "A", "hiring": "B", "generic": "D"}.get(signal_type, "D")


def assemble_message_1(result: dict, company: dict) -> str:
    """Assemble M1 from templates + scorer output."""
    segment = result.get("segment", "Produkcja Projektowa i Ciężka")
    hook = result.get("personalization_hook", "")
    poke = result.get("poke_question", "")

    # Use scorer's signal_type for routing (more accurate than regex)
    bucket = signal_type_to_bucket(result.get("signal_type", "generic"))

    templates = copy_schema.get("message_1", {}).get("templates", {})
    bucket_key = {
        "A": "A_event_or_expansion",
        "B": "B_hiring",
        "D": "D_generic",
    }.get(bucket, "D_generic")

    template = templates.get(bucket_key, {}).get(segment, "")
    if not template:
        template = next(iter(templates.get(bucket_key, {}).values()), "")

    msg = template
    msg = msg.replace("{{personalization_hook}}", hook)
    msg = msg.replace("{{poke_question}}", poke)

    return msg


def extract_json(text: str) -> dict:
    """Extract JSON from model response, handling code fences and extra text."""
    import re
    # Try direct parse first
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try extracting from code fence
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if match:
        return json.loads(match.group(1).strip())
    # Try finding first { ... last }
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        return json.loads(text[start:end + 1])
    raise json.JSONDecodeError("No JSON found", text, 0)


def score_company(company: dict, model: str) -> dict | None:
    prompt = PROMPT_TEMPLATE
    prompt = prompt.replace("{{company_name}}", company.get("company_name", ""))
    prompt = prompt.replace("{{industry}}", company.get("industry", ""))
    prompt = prompt.replace("{{employee_count}}", company.get("employee_count", ""))
    prompt = prompt.replace("{{company_bio}}", company.get("company_bio", ""))
    prompt = prompt.replace("{{signals}}", company.get("company_signals", ""))
    prompt = prompt.replace("{{job_offers}}", company.get("job_signals", ""))

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or ""
        if not content.strip():
            print(f"  Empty response. Finish reason: {response.choices[0].finish_reason}")
            return None
        try:
            result = extract_json(content)
        except Exception:
            print(f"  Response length: {len(content)} chars. Finish: {response.choices[0].finish_reason}")
            print(f"  First 500 chars: {repr(content[:500])}")
            print(f"  Last 200 chars: {repr(content[-200:])}")
            raise
        usage = response.usage
        result["_tokens"] = (usage.prompt_tokens + usage.completion_tokens) if usage else 0
        result["_prompt_tokens"] = usage.prompt_tokens if usage else 0
        result["_completion_tokens"] = usage.completion_tokens if usage else 0
        return result
    except Exception as e:
        print(f"  Error: {e}")
        return None


def estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Estimate cost in USD based on model pricing."""
    costs = MODEL_COSTS.get(model, (1.0, 5.0))
    return (prompt_tokens * costs[0] + completion_tokens * costs[1]) / 1_000_000


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=0)
    parser.add_argument("--company", type=str)
    parser.add_argument("--show-messages", action="store_true", help="Print assembled M1 for each company")
    parser.add_argument("--model", type=str, default="gemini",
                        help="Model alias: gemini (3.1-pro), sonnet (4.6), flash (2.5), pro (2.5-pro)")
    args = parser.parse_args()

    model = MODEL_ALIASES.get(args.model, args.model)

    companies = load_test_data()
    if args.company:
        companies = [c for c in companies if args.company.lower() in c["company_name"].lower()]
    elif args.count:
        companies = companies[:args.count]

    print(f"Testing {len(companies)} companies with {model}")
    print("=" * 80)

    results = []
    total_prompt_tokens = 0
    total_completion_tokens = 0
    tier_matches = 0
    seg_matches = 0

    for i, company in enumerate(companies, 1):
        print(f"\n[{i}/{len(companies)}] {company['company_name']}")
        result = score_company(company, model)
        results.append(result)

        if result:
            total_prompt_tokens += result.get("_prompt_tokens", 0)
            total_completion_tokens += result.get("_completion_tokens", 0)
            tier_ok = company["priority"] == result.get("tier", "")
            seg_ok = company["segment"] == result.get("segment", "")
            if tier_ok:
                tier_matches += 1
            if seg_ok:
                seg_matches += 1

            status = "OK" if (tier_ok and seg_ok) else ""
            if not tier_ok:
                status += f"TIER: {company['priority']}→{result.get('tier')} "
            if not seg_ok:
                status += f"SEG: {company['segment'][:15]}→{result.get('segment', '?')[:15]} "

            sig = result.get("signal_type", "?")
            print(f"  {result.get('tier')} {'(expected '+company['priority']+')' if not tier_ok else ''} | {sig} | {result.get('segment', '?')[:30]} | {status or 'OK'}")
            print(f"  Hook: {result.get('personalization_hook', '-')}")
            print(f"  Poke: {result.get('poke_question', '-')}")

            if args.show_messages:
                msg = assemble_message_1(result, company)
                word_count = len(msg.split())
                print(f"\n  --- Assembled M1 ({word_count} words) ---")
                for line in msg.split("\n"):
                    print(f"  | {line}")
                print(f"  --- End M1 ---")
        else:
            print("  FAILED")

        if i < len(companies):
            time.sleep(0.5)

    n = len([r for r in results if r])
    total_cost = estimate_cost(model, total_prompt_tokens, total_completion_tokens)
    print(f"\n{'=' * 80}")
    print(f"RESULTS: {n} companies scored with {model}")
    if n:
        print(f"  Tier match:       {tier_matches}/{n} ({tier_matches/n*100:.0f}%)")
        print(f"  Segment match:    {seg_matches}/{n} ({seg_matches/n*100:.0f}%)")
        print(f"  Prompt tokens:    {total_prompt_tokens}")
        print(f"  Completion tokens:{total_completion_tokens}")
        print(f"  Total cost:       ${total_cost:.4f} (for {n} companies)")
        print(f"  Cost per company: ${total_cost/n:.6f}")
        print(f"  Est. cost/325:    ${total_cost/n*325:.4f}")

    output_path = Path(__file__).parent / "test-data" / "scorer-results.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "model": model,
            "schema_version": "v5",
            "tier_match": f"{tier_matches}/{n}" if n else "N/A",
            "segment_match": f"{seg_matches}/{n}" if n else "N/A",
            "total_prompt_tokens": total_prompt_tokens,
            "total_completion_tokens": total_completion_tokens,
            "total_cost": f"${total_cost:.4f}",
            "cost_per_company": f"${total_cost/n:.6f}" if n else "N/A",
            "results": [
                {"company": c["company_name"], "expected_tier": c["priority"],
                 "expected_segment": c["segment"],
                 "result": r,
                 "assembled_m1": assemble_message_1(r, c) if r else None}
                for c, r in zip(companies, results)
            ]
        }, f, indent=2, ensure_ascii=False)
    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    main()
