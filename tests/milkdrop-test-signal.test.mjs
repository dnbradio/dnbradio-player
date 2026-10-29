import test from "node:test";
import assert from "node:assert/strict";
import { createMilkDropInput } from "../lib/milkdrop-test-signal.js";

test("silent MilkDrop test audio is isolated from speakers and cleaned up on every input switch", () => {
  const destination = {};
  const makeNode = () => ({
    outputs: new Set(),
    connect(target) {
      assert.notEqual(target, destination);
      this.outputs.add(target);
    },
    disconnect(target) {
      if (target) this.outputs.delete(target);
      else this.outputs.clear();
    },
    start() {
      this.started = true;
    },
    stop() {
      this.stopped = true;
    },
  });
  const sources = [];
  let buffers = 0;
  const context = {
    sampleRate: 8000,
    destination,
    createBuffer(channels, length, rate) {
      buffers++;
      assert.equal(channels, 1);
      assert.equal(rate, 8000);
      const samples = new Float32Array(length);
      return { getChannelData: () => samples };
    },
    createBufferSource() {
      const node = makeNode();
      sources.push(node);
      return node;
    },
  };
  const live = makeNode(),
    analyser = makeNode();
  const input = createMilkDropInput(
    context,
    {
      connectAudio: (node) => node.connect(analyser),
      disconnectAudio: (node) => node.disconnect(analyser),
    },
    live,
  );
  assert.ok(live.outputs.has(analyser));
  input.setTestSignal(true);
  const first = sources[0];
  assert.equal(first.started, true);
  assert.equal(first.loop, true);
  assert.equal(live.outputs.size, 0);
  assert.deepEqual([...first.outputs], [analyser]);
  const samples = first.buffer.getChannelData(0);
  assert.ok(samples.some((value) => Math.abs(value) > 0.2));
  assert.ok(
    samples.every((value) => Number.isFinite(value) && Math.abs(value) <= 1),
  );
  // Quarter-second energy stays nearly constant, and the loop has no click.
  const energy = [];
  for (let start = 0; start < samples.length; start += 2000) {
    let sum = 0;
    for (let i = start; i < Math.min(start + 2000, samples.length); i++)
      sum += samples[i] ** 2;
    energy.push(Math.sqrt(sum / Math.min(2000, samples.length - start)));
  }
  assert.ok(Math.max(...energy) / Math.min(...energy) < 1.12);
  let largestStep = Math.abs(samples[0] - samples.at(-1));
  for (let i = 1; i < samples.length; i++)
    largestStep = Math.max(largestStep, Math.abs(samples[i] - samples[i - 1]));
  assert.ok(largestStep < 0.05);
  input.setTestSignal(true);
  assert.equal(sources.length, 1);
  input.setTestSignal(false);
  assert.equal(first.stopped, true);
  assert.equal(first.outputs.size, 0);
  assert.ok(live.outputs.has(analyser));
  input.setTestSignal(true);
  assert.equal(buffers, 1);
  input.dispose();
  input.dispose();
  assert.equal(sources[1].stopped, true);
  assert.equal(sources[1].outputs.size, 0);
  assert.equal(live.outputs.size, 0);
  input.setTestSignal(true);
  assert.equal(sources.length, 2);
});

test("MilkDrop disposal tolerates an already disconnected player graph only", () => {
  let connected = false;
  let failure = "InvalidAccessError";
  const live = {
    disconnect() {
      connected = false;
    },
  };
  const visualizer = {
    connectAudio() {
      connected = true;
    },
    disconnectAudio() {
      if (!connected) throw new DOMException("No connection", failure);
      connected = false;
    },
  };
  const input = createMilkDropInput({}, visualizer, live);
  live.disconnect();
  assert.doesNotThrow(() => input.dispose());
  const second = createMilkDropInput({}, visualizer, live);
  live.disconnect();
  failure = "InvalidStateError";
  assert.throws(() => second.dispose(), { name: "InvalidStateError" });
});
