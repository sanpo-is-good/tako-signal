import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the Takokuri game home", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>たこくり ゲーム/);
  assert.match(html, /クッキングたこやき/);
  assert.match(html, /たこやきテトリス/);
  assert.match(html, /takokuri\/kansei\.png/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("renders the 4 by 5 Tetris player", async () => {
  const response = await render("/tetris");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /TAKOYAKI TETRIS/);
  assert.match(html, /4 × 5 · 20 CELLS/);
  assert.match(html, /HARD DROP/);
  assert.match(html, /LIVE · 1 PLATE/);
});

test("keeps cooking and Tetris projection geometry explicit", async () => {
  const [takoSource, tetrisSource, projectorSource] = await Promise.all([
    readFile(new URL("../app/lib/takoyaki.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/tetris.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/tetris-projector/TetrisProjectorPage.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(takoSource, /HOLES:[\s\S]*id: 20/);
  assert.match(takoSource, /x: 20, y: 10/);
  assert.match(takoSource, /x: 80, y: 90/);
  assert.match(tetrisSource, /TETRIS_COLS = 4/);
  assert.match(tetrisSource, /TETRIS_ROWS = 5/);
  assert.match(tetrisSource, /TETRIS_PLATE_ROWS = TETRIS_ROWS/);
  assert.match(projectorSource, /<PlateOutput cells=/);
  assert.doesNotMatch(projectorSource, /plateB|PlateOutput id="B"/);
  assert.match(takoSource, /TRACE_ACTIONS:[\s\S]*"octopus"[\s\S]*"greenOnion"[\s\S]*"tenkasu"/);
});
