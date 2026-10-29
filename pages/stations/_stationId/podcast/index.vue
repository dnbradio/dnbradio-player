<template>
  <PageShell
    title="Live Recordings"
    eyebrow="Podcast"
    :station="station"
    active="podcast"
  >
    <p class="archive-intro">
      Every live show, recorded during the broadcast<span v-if="total">
        · {{ total.toLocaleString() }} shows</span
      >
    </p>

    <form class="archive-search" role="search" @submit.prevent="submitSearch">
      <v-icon size="20" aria-hidden="true">mdi-magnify</v-icon>
      <input
        v-model="query"
        type="search"
        enterkeyhint="search"
        placeholder="Search DJs and shows"
        aria-label="Search DJs and shows"
        @input="debouncedSearch"
      />
      <button
        v-if="query"
        type="button"
        class="archive-search__clear"
        aria-label="Clear search"
        @click="clearSearch"
      >
        <v-icon size="18">mdi-close</v-icon>
      </button>
    </form>

    <div class="archive-sort" role="radiogroup" aria-label="Sort">
      <button
        v-for="option in sorts"
        :key="option.value"
        type="button"
        role="radio"
        class="archive-sort__option"
        :class="{ 'archive-sort__option--on': sort === option.value }"
        :aria-checked="sort === option.value ? 'true' : 'false'"
        @click="setSort(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <ol v-if="items.length" class="episodes">
      <li v-for="item in items" :key="item.id">
        <EpisodeRow
          :episode="item"
          :playing="isCurrent(item) && isActive"
          :busy="isCurrent(item) && isBusy"
          @open="openEpisode(item)"
          @toggle="toggle(item)"
        />
      </li>
    </ol>

    <div v-if="loading" class="archive-state">
      <v-progress-circular indeterminate size="28" width="2" color="#e7ff2c" />
    </div>
    <p v-else-if="failed" class="archive-state">
      The archive didn't load.
      <button type="button" class="text-button" @click="load(page)">
        Try again
      </button>
    </p>
    <p v-else-if="!items.length" class="archive-state">
      No recordings match “{{ search }}”.
    </p>
    <button
      v-else-if="page < totalPages"
      type="button"
      class="archive-more"
      @click="load(page + 1)"
    >
      Load more
    </button>
  </PageShell>
</template>

<script>
import { mapGetters } from "vuex";
import PageShell from "~/components/ui/PageShell";
import EpisodeRow from "~/components/podcast/EpisodeRow";
import stationMixin from "~/mixins/station";

let debounceTimer = null;

export default {
  components: { PageShell, EpisodeRow },
  mixins: [stationMixin],
  data() {
    return {
      items: [],
      page: 0,
      totalPages: 0,
      total: 0,
      loading: false,
      failed: false,
      query: this.$route.query.search || "",
      search: this.$route.query.search || "",
      sort: this.$route.query.sort || "",
      sorts: [
        { value: "", label: "Newest" },
        { value: "popular", label: "Most played" },
        { value: "oldest", label: "Oldest" },
      ],
    };
  },
  computed: {
    ...mapGetters("player", ["episode", "isActive", "isBusy"]),
    apiUrl() {
      return this.station && this.station.podcast
        ? this.station.podcast.url
        : "";
    },
  },
  watch: {
    apiUrl: {
      immediate: true,
      handler(url) {
        if (url) {
          this.reset(Number(this.$route.query.page) || 1);
        }
      },
    },
  },
  methods: {
    reset(page = 1) {
      this.items = [];
      this.page = 0;
      this.load(page);
    },
    async load(page) {
      if (!this.apiUrl) {
        return;
      }
      this.loading = true;
      this.failed = false;
      const params = new URLSearchParams({ page: String(page) });
      if (this.search) params.set("search", this.search);
      if (this.sort) params.set("sort", this.sort);
      const search = this.search;
      const sort = this.sort;
      try {
        const response = await fetch(this.apiUrl + "?" + params.toString());
        const data = await response.json();
        if (search !== this.search || sort !== this.sort) {
          return; // a newer search replaced this one
        }
        this.items = this.items.concat(data.data || []);
        this.page = page;
        this.totalPages =
          Number(data.pagination && data.pagination.total_pages) || 0;
        this.total = Number(data.pagination && data.pagination.total) || 0;
        this.$store.commit("player/SET_EPISODES", this.items);
      } catch (error) {
        this.failed = true;
      } finally {
        this.loading = false;
      }
    },
    syncQuery() {
      const query = { ...this.$route.query };
      delete query.page;
      this.search ? (query.search = this.search) : delete query.search;
      this.sort ? (query.sort = this.sort) : delete query.sort;
      this.$router.replace({ query }).catch(() => {});
    },
    debouncedSearch() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(this.submitSearch, 400);
    },
    submitSearch() {
      clearTimeout(debounceTimer);
      if (this.query.trim() === this.search) {
        return;
      }
      this.search = this.query.trim();
      this.syncQuery();
      this.reset();
    },
    clearSearch() {
      this.query = "";
      this.submitSearch();
    },
    setSort(sort) {
      if (sort === this.sort) {
        return;
      }
      this.sort = sort;
      this.syncQuery();
      this.reset();
    },
    isCurrent(item) {
      return this.episode && this.episode.id === item.id;
    },
    toggle(item) {
      if (this.isCurrent(item) && this.isActive) {
        this.$player.pause();
      } else {
        this.$player.playEpisode(item);
      }
    },
    openEpisode(item) {
      this.$router.push("/stations/" + this.station.id + "/podcast/" + item.id);
    },
  },
};
</script>

<style scoped>
.archive-intro {
  margin: 0 0 14px !important;
  text-align: center;
  font-size: 14px;
  color: var(--dnb-text-2);
}
.archive-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 6px 0 14px;
  border: 1px solid var(--dnb-line-strong);
  border-radius: 999px;
  background: var(--dnb-surface);
}
.archive-search:focus-within {
  border-color: var(--dnb-accent);
}
.archive-search .v-icon {
  color: var(--dnb-text-3) !important;
}
.archive-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: none;
  color: var(--dnb-text);
  font-size: 16px;
}
.archive-search input::placeholder {
  color: var(--dnb-text-3);
}
.archive-search input::-webkit-search-cancel-button {
  display: none;
}
.archive-search__clear {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
}
.archive-sort {
  display: flex;
  gap: 8px;
  margin: 12px 0 14px;
}
.archive-sort__option {
  min-height: 36px;
  padding: 6px 14px;
  border: 1px solid var(--dnb-line-strong);
  border-radius: 999px;
  background: none;
  color: var(--dnb-text-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.archive-sort__option--on {
  border-color: var(--dnb-accent);
  background: var(--dnb-accent);
  color: #000;
  font-weight: 700;
}
.episodes {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}
.archive-state {
  padding: 32px 0;
  text-align: center;
  color: var(--dnb-text-2);
  font-size: 15px;
}
.text-button {
  margin-left: 6px;
  border: 0;
  background: none;
  color: var(--dnb-accent);
  font-weight: 700;
  cursor: pointer;
}
.archive-more {
  display: block;
  width: 100%;
  min-height: 48px;
  margin-top: 14px;
  border: 1px solid var(--dnb-line-strong);
  border-radius: 14px;
  background: var(--dnb-surface);
  color: var(--dnb-text);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}
.archive-more:hover {
  background: var(--dnb-surface-2);
}
</style>
