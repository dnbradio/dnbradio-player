<template>
  <transition name="toast">
    <div v-if="message" class="toast" role="status" aria-live="polite">
      {{ message }}
    </div>
  </transition>
</template>

<script>
import { EventBus } from "@/components/eventbus";

export default {
  data() {
    return { message: "", timer: null };
  },
  mounted() {
    EventBus.$on("toast", this.show);
  },
  beforeDestroy() {
    EventBus.$off("toast", this.show);
  },
  methods: {
    show(message) {
      this.message = message;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => (this.message = ""), 2600);
    },
  },
};
</script>

<style scoped>
.toast {
  position: fixed;
  left: 50%;
  bottom: calc(
    var(--dnb-chrome-bottom, 0px) + 20px + env(safe-area-inset-bottom)
  );
  transform: translateX(-50%);
  z-index: 300;
  max-width: calc(100% - 32px);
  padding: 12px 18px;
  border-radius: 999px;
  background: #f1f1f1;
  color: #000;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
