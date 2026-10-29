<template>
  <div
    class="gen-window window dnb-gen-window"
    :class="{ selected }"
    :style="{
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
      zIndex: z,
    }"
    @mousedown="$emit('focus')"
  >
    <div class="gen-top draggable" @mousedown="startDrag">
      <div class="gen-top-left draggable" />
      <div class="gen-top-left-fill draggable" />
      <div class="gen-top-left-end draggable" />
      <div class="gen-top-title draggable">
        <div
          v-for="(letter, i) in letters"
          :key="i"
          :class="`draggable gen-text-letter gen-text-${letter}`"
        />
      </div>
      <div class="gen-top-right-end draggable" />
      <div class="gen-top-right-fill draggable" />
      <div class="gen-top-right draggable">
        <div
          class="gen-close selected"
          :class="{ 'winamp-active': closing }"
          role="button"
          :aria-label="`Close ${title}`"
          @mousedown.stop="closing = true"
          @mouseleave="closing = false"
          @click="$emit('close')"
        />
      </div>
    </div>
    <div class="gen-middle">
      <div class="gen-middle-left draggable" @mousedown="startDrag">
        <div class="gen-middle-left-bottom draggable" />
      </div>
      <div
        class="gen-middle-center"
        :style="{ width: `${width - 19}px`, height: `${height - 34}px` }"
      >
        <slot />
      </div>
      <div class="gen-middle-right draggable" @mousedown="startDrag">
        <div class="gen-middle-right-bottom draggable" />
      </div>
    </div>
    <div class="gen-bottom draggable" @mousedown="startDrag">
      <div class="gen-bottom-left draggable" />
      <div class="gen-bottom-right draggable" />
    </div>
  </div>
</template>

<script>
export default {
  props: ["title", "x", "y", "width", "height", "z", "selected", "bounds"],
  data() {
    return { closing: false, drag: null };
  },
  computed: {
    letters() {
      return this.title
        .toLowerCase()
        .split("")
        .map((letter) => (letter === " " ? "space" : letter));
    },
  },
  methods: {
    startDrag(event) {
      if (!event.target.classList.contains("draggable")) {
        return;
      }
      this.drag = {
        clientX: event.clientX,
        clientY: event.clientY,
        x: this.x,
        y: this.y,
      };
      window.addEventListener("mousemove", this.onDrag);
      window.addEventListener("mouseup", this.endDrag);
    },
    onDrag(event) {
      const maxX = this.bounds.width - this.width;
      const maxY = this.bounds.height - this.height;
      this.$emit("move", {
        x: Math.max(
          0,
          Math.min(maxX, this.drag.x + event.clientX - this.drag.clientX),
        ),
        y: Math.max(
          0,
          Math.min(maxY, this.drag.y + event.clientY - this.drag.clientY),
        ),
      });
    },
    endDrag() {
      this.drag = null;
      window.removeEventListener("mousemove", this.onDrag);
      window.removeEventListener("mouseup", this.endDrag);
    },
  },
  beforeUnmount() {
    this.endDrag();
  },
};
</script>

<style scoped>
.dnb-gen-window {
  position: absolute;
}
</style>
