"""
Nator Review + Fix Loop
Runs in a single GitHub Actions job:
  1. Review the PR
  2. If "Needs changes" → apply fixes → commit → go back to 1
  3. Stop when LGTM or after MAX_ITERATIONS
"""
import os, json, urllib.request, subprocess, sys

MAX_ITERATIONS = 4

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

def run(cmd, capture=True, **kwargs):
    if capture:
        return subprocess.check_output(cmd, shell=True, text=True, **kwargs).strip()
    else:
        subprocess.check_call(cmd, shell=True, **kwargs)

def get_pr_context(pr, repo):
    body = run(f'gh pr view {pr} --repo {repo} --json body -q .body')
    files = run(f'gh pr view {pr} --repo {repo} --json files -q \'[.files[].path] | join(", ")\'')
    diff = run(f'gh pr diff {pr} --repo {repo} 2>/dev/null | head -800')
    return body, files, diff

def post_comment(pr, repo, body):
    # Write to temp file to avoid shell escaping issues
    with open("/tmp/_comment.txt", "w") as f:
        f.write(body)
    run(f'gh pr comment {pr} --repo {repo} --body-file /tmp/_comment.txt')

def do_review(pr_title, pr_body, pr_files, pr_diff, iteration):
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
    return call_claude(prompt)

def do_fix(pr_title, review, pr_files, pr_diff, iteration):
    changed_files = [f.strip() for f in pr_files.split(",") if f.strip()]
    file_contents = {}
    for f in changed_files:
        if os.path.exists(f):
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
{review}

CURRENT FILE CONTENTS:
{files_block}

PR DIFF (for context):
{pr_diff}

Fix ALL [BLOCKING] and [Bug] issues. Fix [Minor] issues if straightforward.
Do NOT change anything unrelated to the review. Do NOT add features.

Output a JSON array. Each item:
- "file": relative path
- "content": complete new file content (not a diff - the FULL file)
- "reason": one line explaining the fix

Only include files that need changes.
If nothing is fixable automatically, output: []

Respond with ONLY valid JSON, no explanation outside it."""

    result = call_claude(prompt, max_tokens=8192)

    # Extract JSON
    if "```json" in result:
        result = result.split("```json")[1].split("```")[0].strip()
    elif "```" in result:
        result = result.split("```")[1].split("```")[0].strip()

    fixes = json.loads(result)
    return fixes

def commit_fixes(fixes, iteration):
    reasons = []
    for fix in fixes:
        path = fix["file"]
        content = fix["content"]
        reason = fix.get("reason", "")
        dirpath = os.path.dirname(path)
        if dirpath:
            os.makedirs(dirpath, exist_ok=True)
        open(path, "w").write(content)
        reasons.append(f"- `{path}`: {reason}")
        print(f"  ✓ Fixed {path}: {reason}")

    run("git config user.name 'Nator'")
    run("git config user.email 'nator@users.noreply.github.com'")
    run("git add -A")
    summary = "\n".join(reasons)
    msg = f"fix: Nator auto-fix (round {iteration})\n\n{summary}"
    with open("/tmp/_commitmsg.txt", "w") as f:
        f.write(msg)
    run("git commit -F /tmp/_commitmsg.txt")
    run("git push")
    print(f"  ✓ Committed and pushed round {iteration} fixes")
    return summary

# Main loop
pr = os.environ["PR_NUMBER"]
repo = os.environ["REPO"]
pr_title = os.environ.get("PR_TITLE", f"PR #{pr}")
pr_action = os.environ.get("PR_ACTION", "")
pr_sha = os.environ.get("PR_SHA", "")[:7]

print(f"\n🔁 Nator Loop starting — PR #{pr} in {repo}")
print(f"   Max iterations: {MAX_ITERATIONS}\n")

for iteration in range(1, MAX_ITERATIONS + 1):
    print(f"\n--- Round {iteration}/{MAX_ITERATIONS} ---")

    # 1. Get fresh PR context
    pr_body, pr_files, pr_diff = get_pr_context(pr, repo)

    # 2. Review
    print("📋 Running Nator review...")
    review = do_review(pr_title, pr_body, pr_files, pr_diff, iteration)

    # 3. Determine verdict
    needs_changes = "Needs changes before merge" in review
    is_lgtm = "LGTM" in review and not needs_changes

    if iteration == 1:
        trigger = "First review on PR open." if pr_action == "opened" else f"Review triggered by new commits ({pr_sha})." if pr_sha else "Manual trigger."
    else:
        trigger = f"Re-review after round {iteration-1} auto-fixes."

    comment = f"## ⚡ Nator Review (Round {iteration})\n\n{review}\n\n---\n*{trigger}*"
    post_comment(pr, repo, comment)
    print(f"   ✅ Review posted (round {iteration})")

    if is_lgtm or not needs_changes:
        print(f"\n✅ LGTM after {iteration} round(s). Loop complete.")
        break

    if iteration == MAX_ITERATIONS:
        print(f"\n⚠️ Reached max iterations ({MAX_ITERATIONS}). Stopping — human review needed.")
        post_comment(pr, repo, f"## ⚡ Nator — Max iterations reached\n\nAfter {MAX_ITERATIONS} fix rounds, some issues still remain. Human review needed before merge.")
        break

    # 4. Fix
    print("🔧 Running Nator fix agent...")
    try:
        fixes = do_fix(pr_title, review, pr_files, pr_diff, iteration)
    except Exception as e:
        print(f"   Fix agent failed: {e}")
        post_comment(pr, repo, f"## ⚡ Nator — Fix agent error\n\nCould not automatically fix issues in round {iteration}: `{e}`\n\nManual fixes needed.")
        break

    if not fixes:
        print("   No fixable issues found — stopping loop.")
        post_comment(pr, repo, f"## ⚡ Nator — Cannot auto-fix\n\nThe remaining issues require human judgment. Please review and fix manually.")
        break

    # 5. Commit
    print(f"   Applying {len(fixes)} fix(es)...")
    try:
        commit_fixes(fixes, iteration)
    except subprocess.CalledProcessError as e:
        print(f"   Commit failed: {e}")
        break

print("\nNator loop done.")
