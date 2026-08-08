---
name: commit
description: Commit the currently staged changes with a clear message, then push to the remote. Use whenever asked to commit staged changes, "commit what's staged", or "make a commit". Only commits what is already staged — it does not stage other new files unless the user asks. Push to master triggers GitHub Pages deploy via CI.
---

# Commit staged changes, then push

Create a single commit from the changes that are **already staged**, then push the
branch to its remote. Do not stage other files unless the user explicitly asks —
the point of this skill is to commit the user's chosen staged set, not everything
in the working tree.

This is a Vite + React web app deployed to **GitHub Pages** (`.github/workflows/deploy.yml`).
A push to **`master`** runs `npm ci`, `npm run build`, and publishes `dist`. There is
no local build step after commit — CI handles deploy.

## Steps

1. **Inspect what is staged.** Run these together to understand the change:

   ```
   git status
   git diff --staged
   ```

   - If **nothing is staged**, stop and tell the user — do not run `git add`
     on your own. Ask whether they want to stage everything or a subset.
   - Note any unstaged changes so you can mention them in the report (they will
     be left out of the commit).

2. **Review recent history** for message style so the new commit matches:

   ```
   git log --oneline -10
   git log -3 --format="%s%n%b---"
   ```

   Read a few recent messages to keep the voice consistent, then use the
   template below.

3. **Write the message.** Match this repo's existing style:

   - **Subject:** one short imperative sentence describing the main change
     (e.g. `Add card engine with stay/exit and results flow.`). A trailing
     period is fine — recent commits use one.
   - **Body (optional):** one or two sentences with extra context if the subject
     alone isn't enough. No bullet lists unless the change is genuinely a list
     of unrelated items.

   End the message with the required trailer:

   ```
   Co-authored-by: Cursor <cursoragent@cursor.com>
   ```

   Do **not** prefix the subject with a version (`v0.0.x – …`) unless the user
   explicitly asks for a versioned release commit.

4. **Commit.** Write the message to a **UTF-8 (no BOM) file**, then pass it
   with `git commit -F`.

   **Do not** pipe a PowerShell here-string into `git commit -F -` or rely on
   the console's default encoding for non-ASCII characters. **Do not** use
   `git commit -m "..."` with special Unicode punctuation on Windows.

   On this Windows / PowerShell machine:

   ```
   $commitMsgPath = Join-Path $env:TEMP "otherdoor-commit-msg.txt"
   $commitMsg = @"
   <subject line>

   <optional body paragraph>

   Co-authored-by: Cursor <cursoragent@cursor.com>
   "@
   $utf8NoBom = New-Object System.Text.UTF8Encoding $false
   [System.IO.File]::WriteAllText($commitMsgPath, $commitMsg, $utf8NoBom)
   git commit -F $commitMsgPath
   Remove-Item $commitMsgPath -ErrorAction SilentlyContinue
   ```

   On bash (Linux/macOS), a UTF-8 HEREDOC is fine:

   ```
   git commit -m "$(cat <<'EOF'
   <subject line>

   <optional body paragraph>

   Co-authored-by: Cursor <cursoragent@cursor.com>
   EOF
   )"
   ```

5. **Confirm the commit.** Run `git status` and note the new commit's hash and
   subject. If a pre-commit hook modified files or the commit failed, surface
   that plainly and do not retry blindly — and do not push a failed/incomplete
   commit.

6. **Push.** Sync the commit to its remote:

   ```
   git push
   ```

   If the branch has no upstream yet, use `git push -u origin <branch>`. If the
   push is rejected (e.g. non-fast-forward), stop and tell the user rather than
   force-pushing.

   If the push was to **`master`**, note that GitHub Actions will build and
   deploy to GitHub Pages automatically (no local `npm run build` needed).

7. **Report.** Give the commit hash, subject, confirm the push succeeded (or
   explain why it didn't), and mention any unstaged changes still in the working
   tree. If pushed to `master`, mention that Pages deploy is running in CI.

## Do not

- ❌ Don't `git add` unstaged or untracked files unless the user asks.
- ❌ Don't bump `package.json` version unless the user asks — version is not
  shown in the app today; use the [`bump-version`](../bump-version/SKILL.md)
  skill only when explicitly requested.
- ❌ Don't force-push, or push if the commit step failed.
- ❌ Don't amend an existing commit; create a new one unless the user asks to amend.
- ❌ Don't pass `--no-verify` or otherwise skip hooks. If a hook fails, fix the
  underlying issue or report it.
- ❌ Don't run a local build after push — CI deploys on push to `master`.
