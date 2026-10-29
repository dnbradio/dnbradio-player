// Same Butterchurn engine and preset versions used by Webamp's MilkDrop bundle.
// Keep them in a lazy chunk, away from the ordinary player's startup path.
import butterchurn from "butterchurn";
import presets from "butterchurn-presets/dist/minimal.js";
import { createMilkDropInput } from "./milkdrop-test-signal.js";

export function createMilkDrop(context, canvas, node, width, height) {
  const visualizer = butterchurn.createVisualizer(context, canvas, {
    width,
    height,
    pixelRatio: 1,
    textureRatio: 1,
  });
  const input = createMilkDropInput(context, visualizer, node);
  const pack = presets.default || presets;
  const preset =
    pack["Flexi, martin + geiss - dedicated to the sherwin maxawow"];
  return Promise.resolve(visualizer.loadPreset(preset, 0)).then(
    () => {
      visualizer.setTestSignal = input.setTestSignal;
      visualizer.dispose = () => {
        input.dispose();
        visualizer.loseGLContext();
      };
      return visualizer;
    },
    (error) => {
      input.dispose();
      visualizer.loseGLContext();
      throw error;
    },
  );
}
