<template>
  <div>
    <v-card
      v-show="loaded"
      class="transparent"
      style="margin:auto; margin-top:0px;"
      flat
      :max-width="500"
      v-touch="{
        left: () => swipe('Left'),
        right: () => swipe('Right'),
        up: () => swipe('Up'),
        down: () => swipe('Down')
      }"
    >
      <v-card
        style="margin:auto;
      text-align: center;"
        flat
        dark
        class="categoryCont transparent"
        v-show="1"
      >
        <v-container fluid>
          <v-row justify="space-around">
            <v-btn
              small
              rounded
              @click="chooseDay(0)"
              :class="isDay(0) ? 'font-weight-bold primary--text' : null"
              >SUN</v-btn
            >
            <v-btn
              small
              rounded
              @click="chooseDay(1)"
              :class="isDay(1) ? 'font-weight-bold primary--text' : null"
              >MON</v-btn
            >
            <v-btn
              small
              rounded
              @click="chooseDay(2)"
              :class="isDay(2) ? 'font-weight-bold primary--text' : null"
              >TUE</v-btn
            >
            <v-btn
              small
              rounded
              @click="chooseDay(3)"
              :class="isDay(3) ? 'font-weight-bold primary--text' : null"
              >WED</v-btn
            >
            <v-btn
              small
              rounded
              @click="chooseDay(4)"
              :class="isDay(4) ? 'font-weight-bold primary--text' : null"
              >THU</v-btn
            >
            <v-btn
              small
              rounded
              @click="chooseDay(5)"
              :class="isDay(5) ? 'font-weight-bold primary--text' : null"
              >FRI</v-btn
            >
            <v-btn
              small
              rounded
              @click="chooseDay(6)"
              :class="isDay(6) ? 'font-weight-bold primary--text' : null"
              >SAT</v-btn
            >
          </v-row>
        </v-container>
        <v-timeline v-if="schedule">
          <v-timeline-item
            v-for="(item, index) in upcoming"
            :key="index"
            medium
            right
            color="transparent lighten-1"
            icon="mic"
          >
            <template v-slot:opposite>
              <div class="text-center">
                <span
                  :class="`headline font-weight-bold primary--text`"
                  v-if="item.start"
                  @click="showEvent(item)"
                  style="cursor: pointer;"
                >
                  <small>
                    {{ item.start | localDay }}<br />
                    <!-- {{ item.start }}<br />
                  {{ item.original_start }} - {{ item.original_end }}<br /> -->
                    {{ item.start | localTime }} - {{ item.end | localTime
                    }}<br />
                    <small>{{ item.start | localTZ }}</small>
                  </small>
                </span>
              </div>
            </template>
            <div class="py-4">
              <h4
                :class="`mb-2 text-center`"
                style="line-height:normal;cursor: pointer;"
                @click="showEvent(item)"
              >
                <small>{{ item.host }}</small>
              </h4>
              <div
                class="text-center"
                style="line-height:normal;cursor: pointer;"
                @click="showEvent(item)"
              >
                <small>
                  {{ item.title }}
                  <span v-if="item.location">({{ item.location }})</span>
                </small>
              </div>
            </div>
          </v-timeline-item>
        </v-timeline>
      </v-card>
    </v-card>
  </div>
</template>

<script>
import Station from "@/models/Station";
import moment from "moment-timezone";
import Vue from "vue";
Vue.filter("localTZ", function(value) {
  if (value) {
    return moment(value)
      .local()
      .format("ZZ");
  }
});
Vue.filter("localTime", function(value) {
  if (value) {
    return moment(value)
      .local()
      .format("HH:mm");
  }
});
Vue.filter("localTimeForceToday", function(value) {
  let time;
  if (value.indexOf("T") !== -1) {
    time = value.split("T")[1];
  } else {
    time = value;
  }
  if (value) {
    let day = moment().format("YYYY-MM-DDT" + time);
    if (moment().isDST() && moment.parseZone(day).utcOffset() <= -240) {
      return moment(day)
        .subtract(1, "hours")
        .format("HH:mm");
    } else {
      return moment(day).format("HH:mm");
    }
  }
});
Vue.filter("localDay", function(value) {
  if (value) {
    return moment(value)
      .local()
      .format("dddd");
  }
});
var abbrs = {
  EST: "Eastern Standard Time",
  EDT: "Eastern Daylight Time",
  CST: "Central Standard Time",
  CDT: "Central Daylight Time",
  MST: "Mountain Standard Time",
  MDT: "Mountain Daylight Time",
  PST: "Pacific Standard Time",
  PDT: "Pacific Daylight Time"
};

moment.fn.zoneName = function() {
  var abbr = this.zoneAbbr();
  return abbrs[abbr] || abbr;
};
export default {
  props: ["station"],
  data() {
    return {
      selectedDay: null,
      schedule: null,
      loaded: false,
      moment: moment
    };
  },
  methods: {
    showEvent(payload) {
      let occurs = null;
      switch (payload.occurs) {
        case "even":
        case "odd":
          occurs = "every other " + moment(payload.start).format("dddd");
          break;
        case "last":
          occurs =
            "last " + moment(payload.start).format("dddd") + " of the month";
          break;
        case 1:
          occurs =
            "first " + moment(payload.start).format("dddd") + " of the month";
          break;
        case "weekly":
          occurs = "every " + moment(payload.start).format("dddd");
          break;
      }
      this.$dialog.confirm({
        title: payload.host,
        text:
          "<strong>" +
          payload.title +
          "</strong>" +
          "<br />" +
          payload.location +
          "<br />" +
          moment(payload.start).format("HH:mm") +
          " - " +
          moment(payload.end).format("HH:mm") +
          (occurs ? " (" + occurs + ")" : "") +
          "<br /><br /><small>" +
          "" +
          payload.description +
          "</small>" +
          (payload.image
            ? '<img src="https://dnbradio.com/assets/swframework/' +
              payload.image +
              '" style="max-width: 400px;" />'
            : ""),
        fullscreen: false
      });
    },
    chooseDay(val) {
      this.selectedDay = val;
    },
    isDay(val) {
      return this.selectedDay == val;
    },
    swipe(direction) {
      switch (direction) {
        case "left":
          this.loadPrev();
          break;
        case "right":
          this.loadNext();
          break;
      }
    }
  },
  computed: {
    currenStationIndex() {
      return this.$route.params.id;
    },
    upcoming() {
      if (!this.schedule) {
        return null;
      }
      return this.schedule.filter(item => {
        var end = moment
          .utc({ hour: 23, minute: 59, second: 59 })
          .add(6, "days");
        var start = moment.utc({ hour: 0, minute: 0, second: 0 });
        //let ostart = moment.parseZone(moment(item.start).format('YYYY-MM-DDT' + item.original_start))
        let ostart = moment.utc(item.start);
        return (
          ostart > start &&
          ostart < end &&
          ostart.local().day() == this.selectedDay
        );
        //return new Date(item.start) > date2 && new Date(item.start) < date &&  moment(item.start).day() == this.selectedDay
        //return  moment(item.start).day() == this.selectedDay
      });
      // .sort((a,b) => {
      //   return (a.start > b.start) ? 1 : -1;
      // });
      // .sort((a,b) => {
      //   let a1 = moment().format('YYYY-MM-DDT' + a.original_start)
      //   let b1 = moment().format('YYYY-MM-DDT' + b.original_start)
      //   console.log('a1', a1, 'b1', b1)
      //   let val = (a1 > b1) ? 1 : -1;
      //   return val
      // })
    }
  },
  mounted() {
    this.selectedDay = moment().day();
    if (this.station) {
      this.$axios.get(this.station.schedule.url).then(res => {
        this.schedule = res.data;
      });
    } else {
      console.log("status is not defined yet");
    }
    this.$nextTick(() => {
      this.loaded = true;
    });
  }
};
</script>

<style>
.v-calendar-daily__scroll-area {
  overflow-y: hidden;
}
</style>
