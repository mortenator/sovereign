"""
Nator Fix Agent - reads the latest Nator review comment and applies fixes via Claude API.
Called by nator-fix.yml after a "Needs changes before merge" review is posted.
"""
import os, json, urllib.request, subprocess, sys

def call_claude(prompt, max_tokens=4096):
    payload = json.dumps({
        "model": "claude-opus-4-5",
        "max_tokens": max_tokens,
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
        return json.loads(resp.read())["content"][0]["text"]

def run(cmd, **kwargs):
    return subprocess.check_output(cmd, shell=True, text=True, **kwargs).strip()

review_comment = open("/tmp/nator_review.txt").read()
pr_diff = open("/tmp/pr_diff.txt").read()
pr_title = os.environ.get("PR_TITLE", "")
changed_files = open("/tmp/pr_files.txt").read().strip().split(", ")

# Read current content of all changed files
file_contents = {}
for f in changed_files:
    f = f.strip()
    if f and os.path.exists(f):
        try:
            file_contents[f] = open(f).read()
        except Exception:
            pass

files_block = "\n\n".join(
    f"### {path}\n```\n{content}\n```"
    for path, content in file_contents.items()
)

prompt = f"""You are a senior engineer fixing issues identified in a code review.

PR TITLE: {pr_title}

NATOR REVIEW (issues to fix):
{review_comment}

CURRENT FILE CONTENTS:
{files_block}

PR DIFF (for context):
{pr_diff}

Your job: fix ALL issues flagged as [BLOCKING] or [Bug] in the review. Also fix [Minor] issues if straightforward.
Do NOT change anything not related to the review findings.
Do NOT add new features.

Output a JSON array of file changes. Each item must have:
- "file": relative path to the file
- "content": the complete new content of the file (not a diff, the full file)
- "reason": one line explaining what you fixed

Only include files that actually need changes.

Respond with ONLY valid JSON. No explanation outside the JSON. Example:
[
  {{"file": "src/foo.ts", "content": "..full file content..", "reason": "Added null check on line 42"}}
]

If there is nothing fixable automatically (e.g. issues require human decisions or missing context), output an empty array: []
"""

print("Calling Claude to generate fixes...")
result = call_claude(prompt)

# Extract JSON from response
try:
    # Handle case where Claude wraps in markdown code block
    if "```json" in result:
        result = result.split("```json")[1].split("```")[0].strip()
    elif "```" in result:
        result = result.split("```")[1].split("```")[0].strip()
    fixes = json.loads(result)
except Exception as e:
    print(f"Failed to parse Claude response as JSON: {e}")
    print(f"Response was: {result[:500]}")
    sys.exit(1)

if not fixes:
    print("No fixable issues identified by Claude. Exiting.")
    open("/tmp/fix_summary.txt", "w").write("No automated fixes were possible for the remaining issues — they require human judgment.")
    sys.exit(0)

print(f"Applying {len(fixes)} file fix(es)...")
summary_lines = []
for fix in fixes:
    path = fix["file"]
    content = fix["content"]
    reason = fix.get("reason", "")
    os.makedirs(os.path.dirname(path), exist_ok=True) if os.path.dirname(path) else None
    open(path, "w").write(content)
    print(f"  ✓ {path}: {reason}")
    summary_lines.append(f"- `{path}`: {reason}")

open("/tmp/fix_summary.txt", "w").write("\n".join(summary_lines))
print("Done.")
