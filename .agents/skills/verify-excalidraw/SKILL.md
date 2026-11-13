---
name: verify-excalidraw
description: Verify Excalidraw's browser whiteboard and named canvas snapshots through real toolbar and menu actions, including refresh, restore, editing, and retained screenshots.
---

# Verify Excalidraw

Read [the feature map](features/README.md) and the matching feature recipe before driving the app. Use a disposable browser context so the user's drawings and snapshots remain untouched.

## Launch

From the repository root, install the lockfile dependencies if needed with Yarn 1.22.22 (`npx --yes yarn@1.22.22 install --frozen-lockfile` if `yarn` is not on `PATH`). Start a dedicated development instance from `excalidraw-app/` with `../node_modules/.bin/vite --host 127.0.0.1 --port 5174 --strictPort`. Wait until Vite reports ready and `curl -fsS http://127.0.0.1:5174/` succeeds. Keep the returned process/session handle for Cleanup. Port 5174 is a verification default; use another free port and pass `EXCALIDRAW_VERIFY_URL` if occupied. Do not drive or stop an instance owned by somebody else.

## Doctor

Run `curl -fsS -o /dev/null -w '%{http_code}\n' "$EXCALIDRAW_VERIFY_URL"` and require `200`. Confirm the page title is `Excalidraw Whiteboard`, the `toolbar-rectangle` and `toolbar-arrow` buttons and `main-menu-trigger` exist, and the menu exposes `Canvas snapshots`. The drive script performs these browser checks before mutation. If any fail, stop and report the missing precondition.

## Drive

The repository has Playwright and the host has Chrome. From the repository root, run `EXCALIDRAW_VERIFY_URL=http://127.0.0.1:5174/ node .agents/skills/verify-excalidraw/scripts/verify-snapshots.mjs`. It uses toolbar buttons, canvas pointer drags, menu and dialog controls. It does not call application internals to create or restore elements. Read-only browser storage inspection corroborates the visible scene. If Chrome is unavailable, use another currently authorized browser/Computer Use path and record the substitution; do not claim the script passed.

## Evidence

The drive writes `artifacts/verification/excalidraw/<run-id>/` with screenshots of the actual browser after each key action and `result.json` containing steps, expectations, observed scene types, coordinates, and pass/fail. A successful run must show both named versions after refresh, rectangle only after restoring `基础框架`, rectangle plus arrow after restoring `完整流程`, and the rectangle position changed after a user drag. Keep screenshots and result data after Cleanup. Do not use localStorage alone as proof; compare it with the screenshots of the browser state.

## Cleanup

The drive closes only the browser context it created. Stop only the Vite process/session started for this run, using its saved handle, and confirm port 5174 is no longer served by that process. Leave `artifacts/verification/excalidraw/<run-id>/` intact. Do not clear the user's browser storage or delete evidence.

## Helpers

- `scripts/verify-snapshots.mjs` is the executable journey; invoke it with `EXCALIDRAW_VERIFY_URL=... node ...` as shown in Drive. It requires the installed repository Playwright package and a locally installed Chrome channel.
