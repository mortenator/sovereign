import os, json, urllib.request, sys

pr_title = os.environ.get("PR_TITLE", "")
pr_body  = open("/tmp/pr_body.txt").read().strip()
pr_files = open("/tmp/pr_files.txt").read().strip()
pr_diff  = open("/tmp/pr_diff.txt").read().strip()

prompt = "\n".join([
    "You are a senior engineer doing a thorough pre-merge code review.",
    "Be direct. Flag real issues only - skip sections with nothing to flag.",
    "",
    f"PR TITLE: {pr_title}",
    f"PR DESCRIPTION:\n{pr_body}",
    f"CHANGED FILES: {pr_files}",
    f"FULL DIFF:\n{pr_diff}",
    "",
    "## Bugs & Logic Errors",
    "Runtime breaks, wrong logic, unhandled edge cases.",
    "",
    "## Security",
    "Exposed secrets, XSS, SQL injection, unvalidated inputs.",
    "",
    "## Breaking Changes",
    "Breaks existing API, DB schema, or contracts?",
    "",
    "## Architecture",
    "Fits existing patterns? Shortcuts that will hurt later?",
    "",
    "## Code Quality",
    "Duplication, missing error handling, any-types, hardcoded values.",
    "",
    "## Verdict",
    "One of: LGTM / LGTM with minor notes / Needs changes before merge",
    "",
    "Bullet points. Only flag real concerns.",
])

payload = json.dumps({
    "model": "claude-opus-4-5",
    "max_tokens": 2048,
    "messages": [{"role": "user", "content": prompt}]
}).encode()

req = urllib.request.Request(
    "https://api.anthropic.com/v1/messages",
    data=payload,
    headers={
        "x-api-key": os.environ["ANTHROPIC_API_KEY"],
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())

review = data["content"][0]["text"]
open("/tmp/review.txt", "w").write(review)
print("Review generated.")
