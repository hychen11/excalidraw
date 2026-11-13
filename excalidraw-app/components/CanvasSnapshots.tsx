import { useEffect, useState } from "react";

import { CaptureUpdateAction, useExcalidrawAPI } from "@excalidraw/excalidraw";
import { restoreElements } from "@excalidraw/excalidraw/data/restore";

import {
  loadCanvasSnapshots,
  saveCanvasSnapshot,
} from "../data/canvasSnapshots";

import type { CanvasSnapshot } from "../data/canvasSnapshots";

export const CanvasSnapshots = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const api = useExcalidrawAPI();
  const [snapshots, setSnapshots] = useState<CanvasSnapshot[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setError("");
    loadCanvasSnapshots()
      .then(setSnapshots)
      .catch((cause) => {
        setError(
          cause instanceof Error ? cause.message : "Unable to load snapshots.",
        );
      });
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const save = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a snapshot name.");
      return;
    }
    if (!api) {
      return;
    }
    setIsBusy(true);
    setError("");
    try {
      const snapshot: CanvasSnapshot = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: trimmedName,
        createdAt: Date.now(),
        elements: api.getSceneElements(),
        files: api.getFiles(),
        viewBackgroundColor: api.getAppState().viewBackgroundColor,
      };
      setSnapshots(await saveCanvasSnapshot(snapshot));
      setName("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save snapshot.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const restore = (snapshot: CanvasSnapshot) => {
    if (!api) {
      return;
    }
    try {
      api.addFiles(Object.values(snapshot.files));
      api.history.clear();
      api.updateScene({
        elements: restoreElements(snapshot.elements, null, {
          repairBindings: true,
        }),
        appState: { viewBackgroundColor: snapshot.viewBackgroundColor },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      setError("");
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to restore snapshot.",
      );
    }
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0, 0, 0, 0.45)",
        display: "grid",
        placeItems: "center",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Canvas snapshots"
        style={{
          width: "min(28rem, calc(100vw - 2rem))",
          maxHeight: "80vh",
          overflow: "auto",
          borderRadius: "0.75rem",
          padding: "1.25rem",
          background: "var(--color-surface-lowest, white)",
          color: "var(--color-on-surface, #222)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Canvas snapshots</h2>
          <button type="button" aria-label="Close snapshots" onClick={onClose}>
            ×
          </button>
        </div>
        <p>
          Save named versions in this browser and restore one to keep editing.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <label htmlFor="snapshot-name">Snapshot name</label>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
            <input
              id="snapshot-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              style={{ flex: 1, minWidth: 0 }}
              autoFocus
            />
            <button type="submit" disabled={isBusy || !api}>
              Save snapshot
            </button>
          </div>
        </form>
        {error && <p role="alert">{error}</p>}
        <h3>Saved versions</h3>
        {snapshots.length === 0 ? (
          <p>No snapshots yet.</p>
        ) : (
          <ul style={{ paddingLeft: "1.25rem" }}>
            {snapshots.map((snapshot) => (
              <li key={snapshot.id} style={{ marginBottom: "0.75rem" }}>
                <span>{snapshot.name}</span>{" "}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => restore(snapshot)}
                  aria-label={`Restore ${snapshot.name}`}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
