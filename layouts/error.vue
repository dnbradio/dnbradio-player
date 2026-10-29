<template>
  <div>
    <div class="error-page">
      <img
        src="https://dnbradio.com/images/logotags.png"
        alt=""
        class="error-page__logo"
      />
      <h1>
        {{
          error.statusCode === 404
            ? "This page doesn't exist"
            : "Something went wrong"
        }}
      </h1>
      <p>
        {{
          error.statusCode === 404
            ? "The link may be old, or the page moved."
            : "Reload the page or head back to the player."
        }}
      </p>
      <RouterLink to="/" class="error-page__button"
        >Back to the player</RouterLink
      >
    </div>
  </div>
</template>

<script>
export default {
  layout: "empty",
  props: {
    error: {
      type: Object,
      default: () => ({ statusCode: 404 }),
    },
  },
  head() {
    return {
      title:
        this.error.statusCode === 404 ? "404 Not Found" : "An error occurred",
    };
  },
};
</script>

<style scoped>
.error-page {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
  background: #000;
}
.error-page__logo {
  width: 120px;
  opacity: 0.5;
  margin-bottom: 12px;
}
.error-page h1 {
  font-size: 22px;
  margin: 0;
}
.error-page p {
  margin: 0;
  color: rgba(255, 255, 255, 0.74);
}
.error-page__button {
  margin-top: 14px;
  padding: 12px 22px;
  border-radius: 999px;
  background: #e7ff2c;
  color: #000 !important;
  font-weight: 700;
  text-decoration: none;
}
</style>
