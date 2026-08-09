---
name: commit
description: Bump the app version, then commit the currently staged changes with a clear message, then push to the remote. Use whenever asked to commit staged changes, "commit what's staged", or "make a commit". Only commits what is already staged (plus the version bump) — it does not stage other new files unless the user asks. Push to master triggers GitHub Pages deploy via CI.
---

# Commit staged changes (with a version bump), then push

Bump the app version and then create a single commit from the changes that are
**already staged**, then push the branch to its remote. Do not stage other files
unless the user explicitly asks — the point of this skill is to commit the
user's chosen staged set (plus the version bump this skill makes), not
everything in the working tree.

This is a Vite + React web app deployed to **GitHub Pages** (`.github/workflows/deploy.yml`).
A push to **`master`** runs `npm ci`, `npm run build`, and publishes `dist`. There is
no local build step after commit — CI handles deploy.

## ⚠️ Never run this proactively

The user commits manually and does **not** want the agent creating commits (or
pushing) on its own initiative. Only run this skill when the user's **current**
message explicitly asks for a commit/push (e.g. "commit this", "commit what's
staged", "push this up", `/commit`). Never chain into it automatically:

- Finishing a feature, fix, or edit is **not** a reason to commit — stop and
  hand control back to the user instead.
- Other skills (`bump-version`, etc.) finishing is **not** a reason to commit,
  even if changes happen to be staged.
- A prior turn in the same conversation asking to commit does **not** carry
  forward — a new commit needs a new, explicit ask.

If you're unsure whether the user is asking for a commit right now, ask them
rather than assuming.

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

2. **Bump the version.** Run the [`bump-version`](../bump-version/SKILL.md) skill
   to increment the version in `package.json` (default `+0.0.1` unless the user
   asked for a specific version). Then **stage the files that bump changed** so
   they land in this commit:

   ```
   git add package.json
   ```

   (Stage exactly the files `bump-version` reported as changed — no others.) This
   is the one intentional exception to the "only commit what's staged" rule: the
   version bump belongs with the commit it ships.

3. **Review recent history** for message style so the new commit matches:

   ```
   git log --oneline -10
   ```

   Read a few recent messages to keep the voice consistent, then use the
   template below.

4. **Write the message.** Use this template:

   - **Subject:** `v<version> - <short imperative summary>` where `<version>` is
     the new version from the bump (e.g. `v0.0.2`). Use a plain ASCII hyphen
     (`-`, U+002D) between the version and summary — **not** an en-dash (`–`);
     Windows shells often mangle Unicode dashes into `?` in commit subjects.
     Keep the summary concise (imperative mood, no trailing period), describing
     the theme of the change.
   - **Body:** a bullet list of what changed. Lead with the version-bump bullet,
     then one bullet per meaningful change:

     ```
     - Bump version to <version>
     - <change 1>
     - <change 2>
     ```

   End the message with the required trailer:

   ```
   Co-authored-by: Cursor <cursoragent@cursor.com>
   ```

5. **Commit.** Write the message to a **UTF-8 (no BOM) file**, then pass it
   with `git commit -F`.

   **Do not** pipe a PowerShell here-string into `git commit -F -` or rely on
   the console's default encoding for non-ASCII characters. **Do not** use
   `git commit -m "..."` with special Unicode punctuation on Windows.

   On this Windows / PowerShell machine:

   ```
   $commitMsgPath = Join-Path $env:TEMP "the-untitled-selection-game-commit-msg.txt"
   $commitMsg = @"
   v<version> - <short imperative summary>

   - Bump version to <version>
   - <change 1>
   - <change 2>

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
   v<version> - <short imperative summary>

   - Bump version to <version>
   - <change 1>
   - <change 2>

   Co-authored-by: Cursor <cursoragent@cursor.com>
   EOF
   )"
   ```

6. **Confirm the commit.** Run `git status` and note the new commit's hash,
   subject, and the old → new version. If a pre-commit hook modified files or
   the commit failed, surface that plainly and do not retry blindly — and do
   not push a failed/incomplete commit.

7. **Push.** Sync the commit to its remote:

   ```
   git push
   ```

   If the branch has no upstream yet, use `git push -u origin <branch>`. If the
   push is rejected (e.g. non-fast-forward), stop and tell the user rather than
   force-pushing.

   If the push was to **`master`**, note that GitHub Actions will build and
   deploy to GitHub Pages automatically (no local `npm run build` needed).

8. **Report.** Give the commit hash, subject, old → new version, confirm the
   push succeeded (or explain why it didn't), and mention any unstaged changes
   still in the working tree. If pushed to `master`, mention that Pages deploy
   is running in CI.

## Do not

- ❌ Don't `git add` unstaged or untracked files unless the user asks — commit
  only what is already staged, plus the version-bump files from step 2.
- ❌ Don't force-push, or push if the commit step failed.
- ❌ Don't amend an existing commit; create a new one unless the user asks to amend.
- ❌ Don't pass `--no-verify` or otherwise skip hooks. If a hook fails, fix the
  underlying issue or report it.
- ❌ Don't run a local build after push — CI deploys on push to `master`.
