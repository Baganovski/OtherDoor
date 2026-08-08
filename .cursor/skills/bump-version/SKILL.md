---
name: bump-version
description: Bump the OtherDoor app version in package.json. Use only when the user explicitly asks to bump/increment/raise the version, cut a new version, or set a specific version — not as part of a normal commit. Default bump is +0.0.1 (patch) unless the user states otherwise.
---

# Bump app version

The version lives in `package.json` (`"version"` field). It is **not** displayed
in the app UI today — bump only when the user asks (e.g. before tagging a release
or once version is shown in the UI).

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
   As of now this should only match `package.json` — if the app later reads or
   displays version (e.g. via `import.meta.env`), update those places too.
4. **Edit** `package.json` to the new version.
5. **Report** the old → new version and the list of files changed. Remind the user
   to stage and commit separately (or ask to commit) — this skill does not commit.

## Do not

- ❌ Don't run `npm install`, `npm run build`, or other commands unless the user asks; a version bump is a text change.
- ❌ Don't edit dependency versions in `package-lock.json` — only the root app version in `package.json`.
- ❌ Don't auto-run as part of a normal commit; the user must ask for a bump.
