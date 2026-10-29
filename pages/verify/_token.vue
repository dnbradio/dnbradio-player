<template>
  <section class="verify">
    <h1>
      {{ verified === null ? "Processing…" : verified ? "VERIFIED!" : "ERROR" }}
    </h1>
    <p>
      {{
        verified === null
          ? "We are checking your token…"
          : verified
            ? "We have verified your account! Your submissions have been recorded."
            : "This token was not found or has already been verified."
      }}
    </p>
    <RouterLink to="/">Back to the player</RouterLink>
  </section>
</template>
<script>
export default {
  data: () => ({ verified: null }),
  async mounted() {
    try {
      await this.$http.get(
        "/api/verify/" + encodeURIComponent(this.$route.params.token),
      );
      this.verified = true;
    } catch {
      this.verified = false;
    }
  },
};
</script>
<style scoped>
.verify {
  padding: 80px 24px;
  text-align: center;
}
</style>
