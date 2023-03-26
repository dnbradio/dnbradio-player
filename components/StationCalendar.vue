<template>
  <div>
 
  <v-row>
    <v-col class="transparent">
      <v-sheet v-if="schedule">
        <v-calendar
          ref="calendar"
          :now="today"
          :value="today"
          :events="schedule"
          type="week"
          dark
          :interval-format="intervalFormat"
          :event-name="eventName"
          :event-color="getEventColor"
          @click:event="showEvent"
          :event-text-color="getEventTextColor"
          style="background:transparent;"
        ></v-calendar>
      </v-sheet>
    </v-col>
  </v-row>
  </div>
</template>

<script>
import Station from '@/models/Station'
import moment from 'moment-timezone'
import Vue from 'vue'
Vue.filter('localTZ', function(value) {
  if (value) {
    return moment(value).format('ZZ')
  }
});
Vue.filter('localTime', function(value) {
  if (value) {
    return moment(value).format('HHmm')
  }
});
// Vue.filter('localTimeForceToday', function(value) {
//   if (value) {
//     let day = moment().format('YYYY-MM-DDT' + value.split('T')[1])
//     return moment(value).format('HHmm')
//   }
// });
Vue.filter('localDay', function(value) {
  if (value) {
    return moment(value).format('dddd')
  }
});
var abbrs = {
    EST : 'Eastern Standard Time',
    EDT : 'Eastern Daylight Time',
    CST : 'Central Standard Time',
    CDT : 'Central Daylight Time',
    MST : 'Mountain Standard Time',
    MDT : 'Mountain Daylight Time',
    PST : 'Pacific Standard Time',
    PDT : 'Pacific Daylight Time',
};

moment.fn.zoneName = function () {
    var abbr = this.zoneAbbr();
    return abbrs[abbr] || abbr;
};
export default {
  props: ['station'],
  data() {
    return {
      today: moment().format('YYYY-MM-DD'),
      selectedDay: null,
      schedule: null,
      loaded: false,
      moment: moment
    }
  },
  methods: {
    eventName(payload) {
      let now = moment();
      let output;
      if (moment(payload.end.date + 'T' + payload.end.time) > now && moment(payload.start.date + 'T' + payload.start.time) < now) {
        output = '<strong><big>' + payload.input.name + '<br />' + payload.start.time + '-' + payload.end.time + '</big></strong>';
      } else {
        output = payload.input.name + '<br />' + payload.start.time + '-' + payload.end.time;
      }
      output += '<i aria-hidden="true" class="v-icon notranslate mdi mdi-information theme--dark" style="color: #5d5d5d; font-size:16px; margin-left: 3px;"></i>'
      //output += ((payload.input.image) ? '' + `<div class="v-image__image v-image__image--cover" style="background-size: contain; width: 40px; height: 40px; position: inherit; background-image: url(${payload.input.image}); background-position: center center;"></div>` : '')
      return output
    },
    intervalFormat(interval) {
      return interval.time
    },
    getEventColor (event) {
      let now = moment();
      if (moment(event.end) > now && moment(event.start) < now) {
        return 'rgb(0, 0, 0)';
      } else if (moment(event.start) < now) {
        return 'rgb(39, 39, 39)';
      } else {
        return 'rgb(39, 39, 39)';
      }
    // border-color: rgb(132, 132, 132);
    // color: rgb(107, 107, 107);
    },
    getEventTextColor(event) {
      let now = moment();
      if (moment(event.end) > now && moment(event.start) < now) {
        return 'rgba(2, 255, 185, 0.87)';
      } else if (moment(event.start) < now) {
        return '#616161';
      } else {
        return 'rgb(185, 185, 185)';
      }
    },
    showEvent(payload) {
      let occurs = null;
      switch(payload.event.occurs)
      {
        case 'even':
        case 'odd':
          occurs = 'every other ' + moment(payload.event.start).format('dddd')
          break;
        case 'last':
          occurs = 'last ' + moment(payload.event.start).format('dddd') + ' of the month'
          break;
        case 1:
          occurs = 'first ' + moment(payload.event.start).format('dddd') + ' of the month'
          break;
        case 'weekly':
          occurs = 'every ' + moment(payload.event.start).format('dddd')
          break;
      }
      this.$dialog.confirm({
        title: payload.event.name, 
        text: '<strong>' + payload.event.title + '</strong>' + 
        '<br />' + payload.event.location +
        '<br />' + payload.event.start.split(' ')[1] + ' - ' + payload.event.end.split(' ')[1] + 
        ((occurs) ? ' (' + occurs + ')' : '') +
        '<br /><br /><small>' + '' + payload.event.description + '</small>' +
        ((payload.event.image) ? '<img src="' +payload.event.image+ '" style="max-width: 400px;" />' : null), 
        fullscreen:false
      })
    },
    chooseDay(val) {
      this.selectedDay = val
    },
    isDay(val) {
      return this.selectedDay == val
    },
    swipe (direction) {
      switch(direction) {
        case 'left':
          this.loadPrev();
          break;
        case 'right':
          this.loadNext();
          break; 
      }
    }
  },
  computed: {
    currenStationIndex() {
      return this.$route.params.stationId
    }
  },
  mounted() {
    this.selectedDay = moment().day()
    if (this.station) {
      this.$axios.get(this.station.schedule.url).then((res) => {
        this.schedule = res.data.map((item) => { 
          let start, end;
          // if (moment().isDST()) {
          //   start = moment(item.start).subtract(1, 'hours').format('YYYY-MM-DD HH:mm')
          //   end = moment(item.end).subtract(1, 'hours').format('YYYY-MM-DD HH:mm') 
          // } else {
          //   start = moment(item.start).format('YYYY-MM-DD HH:mm')
          //   end = moment(item.end).format('YYYY-MM-DD HH:mm') 
          // }
          start = moment(item.start).format('YYYY-MM-DD HH:mm')
          end = moment(item.end).format('YYYY-MM-DD HH:mm')
          return {
            name: item.host, 
            title: item.title,
            description:item.description,
            location: item.location,
            occurs: item.occurs,
            image: (item.image) ? 'https://dnbradio.com/assets/swframework/' + item.image : '',
            start: start, 
            end: end
          } 
        })
      })
    }
    this.$nextTick(() => {
      this.loaded = true
    })
    setTimeout(() => {
      this.$refs.calendar.scrollToTime(moment().format('HH:mm'))
    }, 3000)
  }
}
</script>

<style>
.theme--dark.v-calendar-daily .v-calendar-daily__day { border-right: #464646 1px solid; }
.theme--dark.v-calendar-daily .v-calendar-daily__day-interval {
    border-top: #2d2c2c 1px solid;
}
.theme--dark.v-calendar-daily .v-calendar-daily_head-day {
    border-right: #545454 1px solid;
    border-bottom: #9e9e9e 1px solid;
    color: #FFFFFF;
}
.theme--dark.v-calendar-daily .v-calendar-daily__intervals-body {
    border-right: #4c4c4c 1px solid;
}
.theme--dark.v-calendar-daily {
    background-color: transparent;
    border-left: #353535 0px solid;
    border-top: #444242 0px solid;
}
.v-calendar-daily__scroll-area {
  overflow: hidden;
  padding-right: 15px;
}
.transparent .v-sheet.theme--dark { background: transparent; }
</style>