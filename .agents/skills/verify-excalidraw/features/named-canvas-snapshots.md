# Named canvas snapshots

Save several named versions of the same drawing locally, return after a refresh, restore an earlier or later version, and continue editing.

## Sub-features

- `snapshot-save`: create a named copy of the current canvas.
- `snapshot-persist`: find both names after refreshing the page.
- `snapshot-restore`: switch between versions with different elements.
- `snapshot-edit`: drag a restored element to a new position.

## How to get to it (user POV)

- Draw with the `Rectangle` and `Arrow` toolbar buttons.
- Open the top-left main menu, choose `Canvas snapshots`, enter `Snapshot name`, and choose `Save snapshot`.
- In `Saved versions`, choose `Restore` beside a snapshot name.

## Driving it with Playwright

Preconditions:

- The app is ready at `EXCALIDRAW_VERIFY_URL` in a fresh disposable browser context.
- The main menu exposes `Canvas snapshots` and the toolbar exposes `Rectangle` and `Arrow`.

- **Draw base.** Choose `Rectangle` and drag on the canvas. The scene visibly contains one rectangle.
- **Save base.** Open `Canvas snapshots`, fill `Snapshot name` with `基础框架`, choose `Save snapshot`, and confirm the name appears.
- **Extend drawing.** Close the dialog, choose `Arrow`, and drag a separate arrow. The scene visibly contains a rectangle and arrow.
- **Save full.** Save as `完整流程` in the same dialog; both names appear.
- **Refresh.** Reload the page, reopen `Canvas snapshots`, and confirm both names still appear.
- **Restore base.** Choose `Restore 基础框架`; the dialog closes and the arrow is gone while the rectangle remains.
- **Restore full.** Reopen the dialog and choose `Restore 完整流程`; rectangle and arrow appear.
- **Edit.** Choose `Selection` and drag the rectangle to a new location; its visible position and stored x/y coordinates change.
- **Proof.** Run `EXCALIDRAW_VERIFY_URL=http://127.0.0.1:5174/ node .agents/skills/verify-excalidraw/scripts/verify-snapshots.mjs`. Inspect `result.json` and screenshots in its reported evidence directory.

## Gotchas

- Snapshots live in this browser's IndexedDB. Use one browser context across refresh; a different fresh context will have no versions.
- The current scene auto-save is separate from named snapshots. Wait for the scene state to settle before comparing it.
- `Save snapshot` with an existing name reports an error; use distinct names for this journey.
- The script reads localStorage only for corroboration after user actions; it never writes scene data through storage or internal APIs.
