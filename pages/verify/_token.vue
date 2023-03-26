<template>
  <div>
    <v-card flat v-if="verified===null">
      <br /><br /><br /><br /><br /><br /><br /><br /><br />
      <v-card-title class="headline">
        <h3 style="margin:auto;">Processing...</h3>
      </v-card-title>
      <v-card-text style="text-align:center;">
        <p>We are checking your token...</p>
      </v-card-text>
    </v-card>
    <v-card flat v-if="verified">
      <br /><br /><br /><br /><br /><br /><br /><br /><br />
      <v-card-title class="headline">
        <h3 style="margin:auto;">VERIFIED!</h3>
      </v-card-title>
      <v-card-text style="text-align:center;">
        <p>We have verified your account! Your submissions have been recorded.</p>
        <p>To stay up to date about all future information be sure to whitelist our email address.</p>
        <v-btn to="/">BACK</v-btn>
      </v-card-text>
    </v-card>
    <v-card flat v-else-if="verified===false">
      <br /><br /><br /><br /><br /><br /><br /><br /><br />
      <v-card-title class="headline">
        <h3 style="margin:auto;">ERROR</h3>
      </v-card-title>
      <v-card-text style="text-align:center;">
        <p>This token was not found or has already been verified.</p>
        <v-btn to="/">BACK</v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  components: {
  },
  data() {
    return {
      verified: null,
    }
  },
  mounted() {
    this.$axios.get('/api/verify/'+ this.$route.params.token).then((res) => {
      this.verified = true
    }).catch((err) => {
      console.log(err.response.status)
      this.verified = false
    })
  }
}
</script>

<style>
  .v-autocomplete__content.v-menu__content .v-card  { color:#fff }
  .theme--dark.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) {
      color: #fff !important;
  }
  .v-application .primary--text {
      color: #e7ff2c !important;
      caret-color: #e7ff2c !important;
  }
  .v-select__slot input { color: #fff !important; }
  .theme--dark.v-application {
      background: #1d1d1d;
      color: #FFFFFF;
  }
</style>