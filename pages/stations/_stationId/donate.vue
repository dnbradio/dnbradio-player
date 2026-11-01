<template>
  <PageShell
    title="Support the station"
    eyebrow="Donate"
    :station="station"
    active="donate"
  >
    <div class="support-hero">
      <span class="support-hero__heart" aria-hidden="true"
        ><UiIcon size="30">favorite</UiIcon></span
      >
      <h2>Keepin' the beats rollin'</h2>
      <p>
        dnbradio is a non-profit station run by and for its listeners. Donations
        help pay licensing, hosting, and development.
      </p>
      <p class="support-hero__note">All donations can be made anonymously.</p>
    </div>

    <div class="support-list">
      <ActionCard
        icon="mdi-patreon"
        title="Become a patron"
        text="Support the station every month on Patreon and get perks in return."
        featured
      >
        <a
          href="https://patreon.com/dnbradio"
          target="_blank"
          rel="noopener"
          class="dnb-button dnb-button--primary"
        >
          Join on Patreon<UiIcon size="16">mdi-arrow-top-right</UiIcon>
        </a>
      </ActionCard>

      <ActionCard
        icon="mdi-credit-card-outline"
        title="Donate via PayPal"
        text="A single or recurring donation through PayPal."
      >
        <a
          href="https://dnbradio.com/donate"
          target="_blank"
          rel="noopener"
          class="dnb-button"
        >
          Donate with PayPal<UiIcon size="16">mdi-arrow-top-right</UiIcon>
        </a>
      </ActionCard>

      <ActionCard
        icon="mdi-tshirt-crew"
        title="Buy merch"
        text="T-shirts, dog tags, and stickers from the dnbradio shop."
      >
        <a
          href="https://shop.dnbradio.com"
          target="_blank"
          rel="noopener"
          class="dnb-button"
        >
          Visit the shop<UiIcon size="16">mdi-arrow-top-right</UiIcon>
        </a>
      </ActionCard>
    </div>
  </PageShell>
</template>

<script>
import PageShell from "~/components/ui/PageShell.vue";
import ActionCard from "~/components/ui/ActionCard.vue";
import stationMixin from "~/mixins/station.js";

export default {
  components: { PageShell, ActionCard },
  mixins: [stationMixin],
};
</script>

<style scoped>
.support-hero {
  padding: 8px 8px 20px;
  text-align: center;
}
.support-hero__heart {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(244, 67, 54, 0.14);
}
.support-hero__heart .ui-icon {
  color: var(--dnb-red) !important;
}
.support-hero h2 {
  margin: 12px 0 6px;
  font-size: 24px;
  line-height: 30px;
  font-weight: 700;
}
.support-hero p {
  max-width: 420px;
  margin: 0 auto !important;
  font-size: 15px;
  line-height: 22px;
  color: var(--dnb-text-2);
}
.support-hero .support-hero__note {
  margin-top: 8px !important;
  font-size: 13px;
  color: var(--dnb-text-3);
}
.support-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}
</style>
