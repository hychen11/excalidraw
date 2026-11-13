#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.EXCALIDRAW_VERIFY_URL || "http://127.0.0.1:5174/";
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const evidenceDir = path.resolve("artifacts/verification/excalidraw", runId);
await fs.mkdir(evidenceDir, { recursive: true });

const steps = [];
let browser;
let page;

async function scene() {
  return page.evaluate(() => JSON.parse(localStorage.getItem("excalidraw") || "[]"));
}

async function waitForTypes(types) {
  await page.waitForFunction(
    (expected) => {
      const elements = JSON.parse(localStorage.getItem("excalidraw") || "[]");
      return (
        elements.length === expected.length &&
        expected.every((type, index) => elements[index]?.type === type)
      );
    },
    types,
    { timeout: 10000 },
  );
}

async function record(label, expected, actual) {
  const file = `${String(steps.length + 1).padStart(2, "0")}-${label}.png`;
  await page.screenshot({ path: path.join(evidenceDir, file), fullPage: true });
  steps.push({ label, expected, actual, screenshot: file, status: "passed" });
}

async function openSnapshots() {
  await page.getByTestId("main-menu-trigger").click();
  await page.getByRole("menuitem", { name: "Canvas snapshots" }).click();
  return page.getByRole("dialog", { name: "Canvas snapshots" });
}

async function saveSnapshot(name) {
  const dialog = await openSnapshots();
  await dialog.getByLabel("Snapshot name").fill(name);
  await dialog.getByRole("button", { name: "Save snapshot" }).click();
  await dialog.getByRole("button", { name: `Restore ${name}` }).waitFor();
  await record(`saved-${name}`, `${name} listed`, await dialog.innerText());
  await dialog.getByRole("button", { name: "Close snapshots" }).click();
}

try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  page = await context.newPage();
  const response = await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);
  assert.equal(await page.title(), "Excalidraw Whiteboard");
  await page.getByTestId("toolbar-rectangle").waitFor();
  await page.getByTestId("toolbar-arrow").waitFor();
  await page.getByTestId("main-menu-trigger").waitFor();
  await record("doctor", "whiteboard tools ready", "title and toolbar ready");

  await page.getByTestId("toolbar-rectangle").click();
  await page.mouse.move(350, 300);
  await page.mouse.down();
  await page.mouse.move(550, 430, { steps: 12 });
  await page.mouse.up();
  await waitForTypes(["rectangle"]);
  await record("rectangle", "one rectangle", (await scene()).map((e) => e.type));
  await saveSnapshot("基础框架");

  await page.getByTestId("toolbar-arrow").click();
  await page.mouse.move(650, 340);
  await page.mouse.down();
  await page.mouse.move(810, 440, { steps: 12 });
  await page.mouse.up();
  await waitForTypes(["rectangle", "arrow"]);
  await record("arrow", "rectangle plus arrow", (await scene()).map((e) => e.type));
  await saveSnapshot("完整流程");

  await page.reload({ waitUntil: "networkidle" });
  let dialog = await openSnapshots();
  await dialog.getByRole("button", { name: "Restore 基础框架" }).waitFor();
  await dialog.getByRole("button", { name: "Restore 完整流程" }).waitFor();
  await record("after-refresh", "both names persist after refresh", await dialog.innerText());

  await dialog.getByRole("button", { name: "Restore 基础框架" }).click();
  await waitForTypes(["rectangle"]);
  await record("restored-base", "arrow gone, rectangle remains", (await scene()).map((e) => e.type));

  dialog = await openSnapshots();
  await dialog.getByRole("button", { name: "Restore 完整流程" }).click();
  await waitForTypes(["rectangle", "arrow"]);
  await record("restored-full", "rectangle and arrow return", (await scene()).map((e) => e.type));

  const before = (await scene()).find((e) => e.type === "rectangle");
  assert.ok(before);
  await page.getByTestId("toolbar-selection").click();
  // Select all through the user keyboard shortcut, then drag the restored scene.
  await page.keyboard.press("ControlOrMeta+A");
  await page.getByText("Selected shape actions").waitFor();
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + 60, before.y + before.height / 2 + 40, { steps: 12 });
  await page.mouse.up();
  await page.waitForFunction(
    (x) => JSON.parse(localStorage.getItem("excalidraw") || "[]").some((e) => e.type === "rectangle" && e.x !== x),
    before.x,
    { timeout: 10000 },
  );
  const after = (await scene()).find((e) => e.type === "rectangle");
  await record("drag-restored", "restored rectangle moved", { before: { x: before.x, y: before.y }, after: { x: after.x, y: after.y } });

  await fs.writeFile(path.join(evidenceDir, "result.json"), JSON.stringify({ status: "passed", baseUrl, steps }, null, 2));
  console.log(JSON.stringify({ status: "passed", evidenceDir, steps: steps.length }));
} catch (error) {
  if (page) {
    await page.screenshot({ path: path.join(evidenceDir, "failure.png"), fullPage: true }).catch(() => {});
  }
  await fs.writeFile(path.join(evidenceDir, "result.json"), JSON.stringify({ status: "failed", baseUrl, steps, error: String(error) }, null, 2));
  console.error(JSON.stringify({ status: "failed", evidenceDir, error: String(error) }));
  process.exitCode = 1;
} finally {
  await browser?.close();
}
