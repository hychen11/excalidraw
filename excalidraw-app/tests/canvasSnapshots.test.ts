import "fake-indexeddb/auto";

import {
  loadCanvasSnapshots,
  saveCanvasSnapshot,
} from "../data/canvasSnapshots";

import type { CanvasSnapshot } from "../data/canvasSnapshots";

describe("canvas snapshots", () => {
  it("persists separate named versions and rejects duplicate names", async () => {
    const unique = `${Date.now()}-${Math.random()}`;
    const first = {
      id: `${unique}-first`,
      name: `${unique}-basic`,
      createdAt: 1,
      elements: [
        { id: "rectangle", type: "rectangle" },
      ] as unknown as CanvasSnapshot["elements"],
      files: {},
      viewBackgroundColor: "#ffffff",
    };
    const second = {
      ...first,
      id: `${unique}-second`,
      name: `${unique}-complete`,
      createdAt: 2,
      elements: [
        ...first.elements,
        { id: "arrow", type: "arrow" },
      ] as unknown as CanvasSnapshot["elements"],
    };

    await saveCanvasSnapshot(first);
    await saveCanvasSnapshot(second);

    const saved = await loadCanvasSnapshots();
    expect(saved.find((snapshot) => snapshot.id === first.id)).toEqual(first);
    expect(saved.find((snapshot) => snapshot.id === second.id)).toEqual(second);
    expect(
      saved.find((snapshot) => snapshot.id === first.id)?.elements,
    ).toHaveLength(1);
    expect(
      saved.find((snapshot) => snapshot.id === second.id)?.elements,
    ).toHaveLength(2);
    await expect(saveCanvasSnapshot(first)).rejects.toThrow(
      "A snapshot with this name already exists.",
    );
  });
});
