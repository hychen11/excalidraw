import { createStore, get, set } from "idb-keyval";

import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { BinaryFiles } from "@excalidraw/excalidraw/types";

const snapshotsStore = createStore("excalidraw-snapshots", "snapshots");
const SNAPSHOTS_KEY = "canvas-snapshots-v1";

export type CanvasSnapshot = {
  id: string;
  name: string;
  createdAt: number;
  elements: readonly ExcalidrawElement[];
  files: BinaryFiles;
  viewBackgroundColor: string;
};

export const loadCanvasSnapshots = async (): Promise<CanvasSnapshot[]> => {
  const stored = await get<unknown>(SNAPSHOTS_KEY, snapshotsStore);
  if (stored == null) {
    return [];
  }
  if (
    !Array.isArray(stored) ||
    !stored.every(
      (snapshot) =>
        snapshot &&
        typeof snapshot.id === "string" &&
        typeof snapshot.name === "string" &&
        typeof snapshot.createdAt === "number" &&
        Array.isArray(snapshot.elements) &&
        snapshot.files &&
        typeof snapshot.files === "object" &&
        typeof snapshot.viewBackgroundColor === "string",
    )
  ) {
    throw new Error("Saved canvas snapshots are damaged.");
  }
  return stored as CanvasSnapshot[];
};

export const saveCanvasSnapshot = async (snapshot: CanvasSnapshot) => {
  const snapshots = await loadCanvasSnapshots();
  if (snapshots.some((saved) => saved.name === snapshot.name)) {
    throw new Error("A snapshot with this name already exists.");
  }
  const nextSnapshots = [...snapshots, snapshot];
  await set(SNAPSHOTS_KEY, nextSnapshots, snapshotsStore);
  return nextSnapshots;
};
