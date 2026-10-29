import test from "node:test";
import assert from "node:assert/strict";
import { createPresetRotation } from "../lib/milkdrop-rotation.js";

function setup(random = () => 0) {
  const loads = [],
    changes = [];
  const rotation = createPresetRotation(["a", "b", "c"], {
    random,
    loadPreset: async (name, blend) => {
      loads.push({ name, blend });
    },
    onChange: (name) => changes.push(name),
  });
  return { rotation, loads, changes };
}

test("preset start is randomized and shuffled passes have no immediate repeats", async () => {
  const first = setup(() => 0),
    second = setup(() => 0.999);
  await first.rotation.next(0);
  await second.rotation.next(0);
  assert.notEqual(first.changes[0], second.changes[0]);
  for (let i = 0; i < 11; i++) await first.rotation.next();
  for (let i = 0; i < first.changes.length; i += 3)
    assert.equal(new Set(first.changes.slice(i, i + 3)).size, 3);
  for (let i = 1; i < first.changes.length; i++)
    assert.notEqual(first.changes[i], first.changes[i - 1]);
});

test("preset rotation waits 15 seconds and blends for three seconds", async () => {
  const { rotation, loads } = setup();
  await rotation.next(0);
  rotation.advance(14.9);
  rotation.advance(NaN);
  rotation.advance(-1);
  assert.equal(loads.length, 1);
  await rotation.advance(0.1);
  assert.deepEqual(
    loads.map(({ blend }) => blend),
    [0, 3],
  );
  rotation.advance(14);
  assert.equal(loads.length, 2);
  await rotation.advance(1);
  assert.equal(loads.length, 3);
});

test("manual advance resets the countdown and can disable blending for reduced motion", async () => {
  const { rotation, loads } = setup();
  await rotation.next(0);
  rotation.advance(14);
  await rotation.next(0);
  rotation.advance(1);
  assert.equal(loads.length, 2);
  assert.equal(loads[1].blend, 0);
});

test("pending loads are coalesced and disposal waits without publishing a stale preset", async () => {
  let finish;
  const changes = [];
  let loads = 0;
  const rotation = createPresetRotation(["a", "b"], {
    loadPreset: () => {
      loads++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    onChange: (name) => changes.push(name),
  });
  const pending = rotation.next(0);
  await Promise.resolve();
  assert.equal(rotation.next(), pending);
  rotation.advance(30);
  const disposed = rotation.dispose();
  finish();
  await disposed;
  await rotation.next();
  rotation.advance(30);
  assert.equal(loads, 1);
  assert.deepEqual(changes, []);
});

test("a failed preset does not prevent subsequent rotation", async () => {
  const changes = [];
  let loads = 0;
  const rotation = createPresetRotation(["a", "b", "c"], {
    loadPreset: async () => {
      if (++loads === 2) throw new Error("Compilation failed");
    },
    onChange: (name) => changes.push(name),
  });
  await rotation.next(0);
  await assert.rejects(rotation.next(), /Compilation failed/);
  await rotation.advance(15);
  assert.equal(changes.length, 2);
  assert.equal(loads, 3);
});
