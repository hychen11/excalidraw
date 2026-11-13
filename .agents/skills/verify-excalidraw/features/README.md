# Excalidraw verification map

This map covers the browser whiteboard's named canvas snapshots. Start from a disposable Playwright browser context and a dedicated Vite instance. Preserve evidence under `artifacts/verification/excalidraw/` after cleanup.

## Baseline preconditions

- The development app is ready at `EXCALIDRAW_VERIFY_URL`, normally `http://127.0.0.1:5174/`.
- The browser can use the toolbar and main menu; no sign-in is needed for local snapshots.
- The browser context is fresh so it has no previous IndexedDB snapshots.

## Driving conventions

- Use the visible toolbar and menu. Draw with pointer actions on the interactive canvas.
- Use accessible names for dialog fields and buttons.
- After mutation, capture the browser screenshot and corroborate the scene through the browser's saved scene data.
- Treat every command and URL in this map as a concrete local development example; adjust the port through `EXCALIDRAW_VERIFY_URL` if needed.

## Proof and skip reporting

- Record each action, expectation, actual result, and evidence path.
- Do not claim a skipped or blocked browser step passed based on unit tests.
- For persistence, refresh the page and reopen the snapshots dialog.
- For editability, actually drag a restored element and compare its position.

## Feature entry contract

Feature files use `Sub-features`, `How to get to it (user POV)`, `Driving it with Playwright`, and `Gotchas` in that order.

## Features

- [Named canvas snapshots](./named-canvas-snapshots.md): draw, save two versions, refresh, restore both, and edit the restored scene.
