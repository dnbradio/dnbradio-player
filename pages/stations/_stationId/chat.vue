<template>
  <PageShell
    title="Chat with listeners"
    eyebrow="Chat"
    :station="station"
    active="chat"
  >
    <p class="chat-intro">
      Our IRC chat room has been running since 2003. It's synced with our
      Discord channel, so you can chat from either one and reach the same room.
    </p>

    <div class="chat-list">
      <ActionCard
        icon="mdi-discord"
        icon-color="#8c9eff"
        title="Join on Discord"
        text="The most mobile-friendly way to chat."
        featured
      >
        <a
          href="https://discord.gg/DYb3fay"
          target="_blank"
          rel="noopener"
          class="dnb-button dnb-button--primary"
        >
          Open Discord<v-icon size="16">mdi-arrow-top-right</v-icon>
        </a>
        <a
          href="https://discord.com/download"
          target="_blank"
          rel="noopener"
          class="dnb-button"
          >Get the app</a
        >
      </ActionCard>

      <ActionCard
        icon="mdi-console"
        title="IRC webchat"
        text="Chat in your browser. Nothing to install, and the connection is secured over HTTPS."
      >
        <a
          href="https://chat.dnbradio.com"
          target="_blank"
          rel="noopener"
          class="dnb-button"
        >
          Open webchat<v-icon size="16">mdi-arrow-top-right</v-icon>
        </a>
      </ActionCard>

      <ActionCard
        icon="mdi-lan-connect"
        title="Your own IRC client"
        text="For the full IRC experience, connect a native client on your computer or phone."
      >
        <dl class="irc">
          <dt>Network</dt>
          <dd>QuakeNet</dd>
          <dt>Channel</dt>
          <dd>
            #dnbradio
            <button
              type="button"
              class="irc__copy"
              aria-label="Copy channel name"
              @click="copy('#dnbradio')"
            >
              <v-icon size="16">mdi-content-copy</v-icon>
            </button>
          </dd>
          <dt>Clients</dt>
          <dd>
            mIRC (Windows), HexChat (Windows, Linux), Textual (macOS), IRCCloud
            (iOS, Android, web)
          </dd>
        </dl>
        <p class="irc__how">
          Pick a server for your country at
          <a href="https://www.quakenet.org" target="_blank" rel="noopener"
            >quakenet.org</a
          >, connect, then type <code>/join #dnbradio</code>.
        </p>
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
  methods: {
    async copy(text) {
      try {
        await navigator.clipboard.writeText(text);
        EventBus.$emit("toast", "Copied " + text);
      } catch (error) {
        EventBus.$emit("toast", text);
      }
    },
  },
};
</script>

<style scoped>
.chat-intro {
  margin: 4px 4px 18px !important;
  text-align: center;
  font-size: 15px;
  line-height: 22px;
  color: var(--dnb-text-2);
}
.chat-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}
.irc {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 14px;
  width: 100%;
  margin: 0;
  font-size: 14px;
  line-height: 20px;
}
.irc dt {
  color: var(--dnb-text-3);
}
.irc dd {
  margin: 0;
  color: var(--dnb-text);
  display: flex;
  align-items: center;
  gap: 6px;
}
.irc__copy {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
}
.irc__how {
  width: 100%;
  margin: 10px 0 0 !important;
  font-size: 13px;
  line-height: 19px;
  color: var(--dnb-text-3);
}
.irc__how a {
  color: var(--dnb-text-2) !important;
}
.irc__how code {
  background: #000 !important;
  color: var(--dnb-text) !important;
  box-shadow: none !important;
}
</style>
