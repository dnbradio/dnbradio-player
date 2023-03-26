import Vue from "vue";
//import 'vuetify/dist/vuetify.min.css'
//import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader version "^2.1.1" ,
//import 'material-design-icons-iconfont/dist/material-design-icons.css'
import Vuetify, {
  VApp,
  VLayout,
  VMain,
  VIcon,
  VBtn,
  VImg,
  VToolbar,
  VToolbarTitle,
  VContainer,
  VAvatar,
  VSpacer,
  VMenu,
  VSnackbar,
  VCardText,
  VCol,
  VRow,
  VCard,
  VFooter,
  VCarousel,
  VCarouselItem,
  VSheet,
  VListItem,
  VListItemContent,
  VListItemTitle,
  VListItemSubtitle,
  VListItemAvatar,
  VCardActions,
  VForm,
  VCardTitle,
  VTextarea,
  VRating,
  VTooltip,
  VHover,
  VFlex,
  VFadeTransition
} from "vuetify/lib";

Vue.use(Vuetify, {
  components: {
    VApp,
    VLayout,
    VMain,
    VIcon,
    VBtn,
    VImg,
    VSpacer,
    VMenu,
    VSnackbar,
    VCardText,
    VCol,
    VRow,
    VToolbar,
    VToolbarTitle,
    VContainer,
    VAvatar,
    VFooter,
    VCarousel,
    VCarouselItem,
    VSheet,
    VListItem,
    VListItemContent,
    VListItemTitle,
    VListItemSubtitle,
    VListItemAvatar,
    VCardActions,
    VCard,
    VForm,
    VCardTitle,
    VRating,
    VTooltip,
    VHover,
    VFlex,
    VTextarea,
    VFadeTransition
  }
});

export default ctx => {
  const vuetify = new Vuetify({
    treeShake: true,
    defaultAssets: {
      font: {
        family: "ambit-regular"
      },
      icons: null
    },
    breakpoint: {
      thresholds: {
        xs: 340,
        sm: 600,
        md: 960,
        lg: 1264,
        xl: 1904
      },
      scrollBarWidth: 24
    },
    theme: {
      dark: true,
      themes: {
        dark: {
          primary: "#3c3c3c",
          secondary: "#909399",
          accent: "#5dcf6c",
          error: "#fa3719",
          info: "#3c3c3c",
          success: "#5dcf6c",
          warning: "#e89082"
        }
      }
    }
  });

  ctx.app.vuetify = vuetify;
  ctx.$vuetify = vuetify.framework;
};

// import Vue from 'vue'
// import Vuetify from 'vuetify/lib'
// Vue.use(Vuetify, {
//   treeShake: true,
//   defaultAssets: {
//     font: {
//       family: 'ambit-regular'
//     },
//     icons: {
//       iconfont: 'mdi',
//     }
//   },
//   breakpoint: {
//     thresholds: {
//       xs: 340,
//       sm: 540,
//       md: 800,
//       lg: 1280,
//     },
//     scrollBarWidth: 24,
//   },
//   theme: {
//     dark: true,
//     themes: {
//       dark: {
//         primary: '#3c3c3c',
//         secondary: '#909399',
//         accent: '#5dcf6c',
//         error: '#fa3719',
//         info: '#3c3c3c',
//         success: '#5dcf6c',
//         warning: '#e89082',
//       }
//     }
//   }
// })

// // Vue.use(Vuetify, {
// //   iconfont: 'md'
// // })
// // Vue.use(Vuetify, {
// //   iconfont: 'mdi'
// // })
// // Vue.use(Vuetify, {
// //   iconfont: 'fa'
// // })
