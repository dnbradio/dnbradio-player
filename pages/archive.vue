<template>
  <div>
    <v-container fluid  >
      <v-row>
        <TopMenu />
        <v-col style="margin-top: 30px;">
          <v-card flat style="text-align:center; max-width: 750px; margin: auto;">
            <h1>DnBRadio Live Show Archive</h1>
            <h2>World's longest running drum and bass archive</h2>
            <v-text-field v-model="form.search"  placeholder="Search by artist, track, etc" type="text" />  
            <h3>Subscribe and take us mobile:</h3>
            <p>
              <br  />
              <v-btn>
                Subscribe w/iTunes
              </v-btn>
              <v-btn>
                Subscribe w/RSS
              </v-btn>
              <br />
              <br />25,234 archives found
              <br /><br />New episodes posted hourly after every live show.
              <br />Also tune into the live stream where all mixes are recorded live on the air.
            </p>
            <img src="https://feeds.feedburner.com/~fc/DnbradioArchive?bg=99CCFF&fg=444444&anim=1" />
            <v-container style="text-align:left;" class="archive">
              <v-row v-for="(ep,i) in episodes" :key="i">
                <v-col cols="12">
                  <v-divider />
                </v-col>
                <v-col cols="10">
                  <div class="showTitle">
                    <v-badge light content="New" left class="red--text">
                       {{ ep.title }}
                    </v-badge>
                  </div>
                  <div class="showArtist">
                    hosted by: {{ ep.artist }}
                  </div>
                  <div>
                    RECORDED: {{ ep.date }}
                  </div>
                  <div class="podcastId">
                    podcast id: {{ ep.id }}
                  </div>
                  <div clas="trackList" v-if="ep.tracklist" style="margin-top: 20px;">
                    <strong>Show tracklist:</strong><br />
                    <small v-html="ep.tracklist"></small>
                  </div>
                </v-col>
                <v-col cols="2">
                </v-col>
              </v-row>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import TopMenu from '~/components/TopMenu'

export default {
  layout: 'legacy',
  components: { TopMenu },
  data() {
    return {
      form: {
        search: ''
      },
      episodes: [
        {
          id: 44252,
          artist: 'SyRan',
          title: 'In The Mix 332',
          date: '2021-10-07 18:00:15',
          tracklist: `Vector, Macca & Loz Contreras feat. Charli Brix - Lose Myself
<br />Eastcolors &amp; Noel - Moonwalker
<br />Calibre - Think On
<br />Karma - The Searching
<br />rtificial Intelligence - Definition
<br />Dave Shichman - 5th Sentence (Random Movement remix)
<br />Optiv &amp; CZA - Cant You See 
<br />Phase - Albatross (feat. Viv May)
<br />Utah Jazz - Hold On
<br />FinnaDrift - International A License`
        }
      ]
    }
  }
}
</script>
<style>
.archive .showTitle { font-size: 28px; font-weight: normal; }
.archive .showArtist { font-size: 18px; font-weight: bold; }
.archive .podcastId { font-size: 10px; }
.archive .showSize {font-size: 18px; }
.tiny { font-size: 11px;}
</style>