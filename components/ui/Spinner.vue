<template>
  <span
    class="spinner"
    role="status"
    aria-label="Loading"
    :style="{ width: size + 'px', height: size + 'px' }"
  />
</template>
<script>
export default { props: { size: { type: [Number, String], default: 28 } } };
</script>
<style scoped>
.spinner {
  display: inline-block;
  border: 2px solid rgba(231, 255, 44, 0.2);
  border-top-color: #e7ff2c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    border-top-color: #e7ff2c;
  }
}
</style>
