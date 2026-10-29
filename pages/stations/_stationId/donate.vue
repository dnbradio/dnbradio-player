<template>
  <PageShell
    title="Support the station"
    eyebrow="Donate"
    :station="station"
    active="donate"
  >
    <div class="support-hero">
      <span class="support-hero__heart" aria-hidden="true"
        ><v-icon size="30">favorite</v-icon></span
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
          Join on Patreon<v-icon size="16">mdi-arrow-top-right</v-icon>
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
          Donate with PayPal<v-icon size="16">mdi-arrow-top-right</v-icon>
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
          Visit the shop<v-icon size="16">mdi-arrow-top-right</v-icon>
        </a>
      </ActionCard>

      <ActionCard
        v-for="wallet in wallets"
        :key="wallet.name"
        :icon="wallet.icon"
        :title="'Send ' + wallet.name"
        :text="
          'Send ' +
          wallet.name +
          ' to the station\'s ' +
          wallet.symbol +
          ' wallet.'
        "
      >
        <div class="dnb-code">
          <code>{{ wallet.address }}</code>
          <button
            type="button"
            class="dnb-button"
            :aria-label="'Copy ' + wallet.symbol + ' address'"
            @click="copy(wallet)"
          >
            <v-icon size="16">mdi-content-copy</v-icon>Copy
          </button>
        </div>
      </ActionCard>
    </div>
  </PageShell>
</template>

<script>
import { EventBus } from "@/components/eventbus";
import PageShell from "~/components/ui/PageShell";
import ActionCard from "~/components/ui/ActionCard";
import stationMixin from "~/mixins/station";

export default {
  components: { PageShell, ActionCard },
  mixins: [stationMixin],
  data() {
    return {
      wallets: [
        {
          name: "Bitcoin",
          symbol: "BTC",
          icon: "mdi-bitcoin",
          address: "1FGW9JXGPNfvgGMpSKiRSVuaaz6DiYYpyv",
        },
        {
          name: "Ethereum",
          symbol: "ETH",
          icon: "mdi-ethereum",
          address: "0x5659C68c3176CFF2641CeFA2f4F9eE9C26F66EE6",
        },
      ],
    };
  },
  methods: {
    async copy(wallet) {
      try {
        await navigator.clipboard.writeText(wallet.address);
        EventBus.$emit("toast", wallet.symbol + " address copied");
      } catch (error) {
        EventBus.$emit("toast", "Copy failed. Select the address to copy it.");
      }
    },
  },
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
.support-hero__heart .v-icon {
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
