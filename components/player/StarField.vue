<template>
  <canvas
    ref="canvas"
    class="starfield"
    :class="{ 'starfield--on': active }"
    aria-hidden="true"
  />
</template>

<script>
// The moon button's background: streaks drifting right to left over a dark
// fill. Stills to a single frame for reduced motion.
const COUNT = 40;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export default {
  props: { active: { type: Boolean, default: false } },
  data() {
    return { frame: null, particles: [] };
  },
  watch: {
    active(on) {
      on ? this.start() : this.stop();
    },
  },
  mounted() {
    window.addEventListener("resize", this.resize);
    this.resize();
    if (this.active) {
      this.start();
    }
  },
  beforeUnmount() {
    this.stop();
    window.removeEventListener("resize", this.resize);
  },
  methods: {
    resize() {
      const canvas = this.$refs.canvas;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      this.particles = Array.from({ length: COUNT }, () => ({
        radius: rand(0.5, 2),
        opacity: rand(0.1, 0.7),
        velocity: Math.round(rand(1, 5)),
        x: rand(0, canvas.width),
        y: rand(0, canvas.height),
      }));
      this.paint(1);
    },
    paint(fill) {
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = `rgba(20,20,20,${fill})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const p of this.particles) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.lineWidth = p.radius * 2;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.radius * 4, p.y);
        ctx.stroke();
      }
    },
    start() {
      this.stop();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        this.paint(1);
        return;
      }
      const tick = () => {
        const width = this.$refs.canvas.width;
        for (const p of this.particles) {
          p.x -= p.velocity;
          if (p.x <= -p.radius) {
            p.x = width + p.radius;
          }
        }
        this.paint(0.6);
        this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    },
    stop() {
      if (this.frame) {
        cancelAnimationFrame(this.frame);
        this.frame = null;
      }
    },
  },
};
</script>

<style scoped>
.starfield {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
}
.starfield--on {
  opacity: 1;
}
</style>
