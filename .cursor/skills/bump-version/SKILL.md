---
name: bump-version
description: Bump the TheUntitledSelectionGame app version in package.json. Use whenever asked to bump/increment/raise the version, cut a new version, or set a specific version. Also run as a step inside the commit skill. Default bump is +0.0.1 (patch) unless the user states otherwise.
---

# Bump app version

The version lives in `package.json` (`"version"` field). Vite injects it as
`__APP_VERSION__` (see `vite.config.ts`), and the UI shows it as `v{version}` via
`src/components/AppVersion.tsx`.

## Version format

Semver three-part string, e.g. `0.0.1`:

- **Major** — breaking changes (`1.0.0` → `2.0.0`)
- **Minor** — new features, backward compatible (`0.1.0` → `0.2.0`)
- **Patch** — fixes and small updates (`0.0.1` → `0.0.2`)

## Default bump

Unless the user specifies a different target, bump the **patch** segment by 1:

- `0.0.1` → `0.0.2`
- `0.0.9` → `0.0.10` (each segment is an independent integer — `9` goes to `10`)

If the user names an explicit version (e.g. "bump to 0.2.0", "make it 1.0.0"), use exactly that.

## Steps

1. **Read the current version** from `package.json` (`"version"` field).
2. **Compute the target** — apply the default patch bump, or the user's explicit value.
3. **Grep** for other live copies of the version, in case one has been added since this skill was last updated:
   ```
   rg -n '"version"' --glob 'package.json' --glob '*.md' --glob '*.html' --glob 'src/**'
   ```
   The source of truth is `package.json`. The footer reads `__APP_VERSION__` from
   the Vite build, so editing `package.json` is usually enough — no hard-coded
   copy in `src/` to update unless someone added one.
4. **Edit** `package.json` to the new version.
5. **Report** the old → new version and the list of files changed. This skill
   does not commit on its own. When run standalone, remind the user to stage and
   commit (or ask to commit). When run as a step inside the [`commit`](../commit/SKILL.md)
   skill, the commit skill stages `package.json` and includes the bump in that
   commit. After a rebuild/refresh, the bottom-right footer should show `v{new}`.

## Do not

- ❌ Don't run `npm install`, `npm run build`, or other commands unless the user asks; a version bump is a text change.
- ❌ Don't edit dependency versions in `package-lock.json` — only the root app version in `package.json`.
- ❌ Don't `git add`, `git commit`, or `git push` the bump on your own — this
  skill only edits version text. Committing is a separate, explicit ask (see
  the [`commit`](../commit/SKILL.md) skill), except when this skill is being
  run *as a step inside* the `commit` skill itself.
