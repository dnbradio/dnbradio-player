// Emulating todo records which should be returned from API backend
// in the real world.
export default async function data() {
  return [
    {
      id: 1,
      pathname: "default",
      name: "dnbradio.com [all flavors]",
      title: "dnbradio.com",
      subtitle: "all flavors",
      cover:
        "https://res.cloudinary.com/dgp7z9vkg/image/fetch/b_auto,c_pad,w_960/https://staging.dnbradio.com/images/logotags.png",
      website: "https://dnbradio.com/?forceMobile=0",
      facebook: "https://facebook.com/dnbradio",
      twitter: "https://twitter.com/dnbradio",
      twitterId: "dnbradio",
      instagram: "https://instagram.com/dnbradio",
      soundcloud: "https://soundcloud.com/dnbradio",
      description: "All flavors of dnb from dj's across the globe!",
      schedule: {
        url: "https://api.dnbradio.nl/schedule"
      },
      podcast: {
        url: "https://api.dnbradio.nl/podcast",
        website: "https://dnbradio.com/podcast"
      },
      nowplaying_url: {
        type: "azuracast",
        url: "https://azura.dnbradio.com/api/nowplaying/dnbradio"
      },
      streams: [
        {
          url: "https://fw.dnbradio.com/dnbradio_main.mp3",
          format: "mp3",
          mimetype: "audio/mpeg"
        }
      ],
      position: 1
    },
    {
      id: 2,
      pathname: "darkst",
      name: "dark.st",
      title: "dark.st",
      subtitle: "dnbradio's darkstep channel",
      cover: "https://res.cloudinary.com/dgp7z9vkg/image/fetch/b_auto,c_pad,w_960/https://staging.dnbradio.com/images/darkstep.png",
      website: "http://section8recs.com",
      facebook: "https://facebook.com/dnbradio",
      twitter: "https://twitter.com/section8recs",
      twitterId: "section8recs",
      instagram: "https://instagram.com/section8recs",
      soundcloud: "https://soundcloud.com/section8recs",
      description: "Unrelenting dark and heavy drum and bass.",
      nowplaying_url: {
        type: "azuracast",
        url: "https://azura.dnbradio.com/api/nowplaying/darkstep"
      },
      schedule: {
        url: "https://api.dnbradio.nl/schedule"
      },
      podcast: {
        url: "https://api.dnbradio.nl/podcast",
        website: "https://dnbradio.com/podcast"
      },
      streams: [
        {
          url:
            "https://fw.dnbradio.com/dnbradio_darkstep.mp3",
          format: "aac",
          mimetype: "audio/aacp"
        }
      ],
      position: 4
    },
    {
      id: 3,
      pathname: "jt",
      name: "jungletrain.net",
      title: "jungletrain",
      subtitle: "A train in constant motion",
      cover: "https://res.cloudinary.com/dgp7z9vkg/image/fetch/b_auto,c_pad,w_960/https://staging.dnbradio.com/images/jungletrain.png",
      website: "https://jungletrain.net",
      facebook: "https://facebook.com/jungletrain",
      twitter: "https://twitter.com/jungletrain",
      twitterId: "jungletrain",
      donations: {},
      schedule: {
        url: "https://api.dnbradio.nl/schedule"
      },
      podcast: {
        url: "https://api.dnbradio.nl/podcast",
        website: "https://dnbradio.com/podcast"
      },
      description: "More than 80 different live shows and events",
      nowplaying_url: {
        type: "jt",
        url: "https://dnbradio.com/tv/now_playing-jungletrain.php"
      },
      streams: [
        {
          url: "https://chat.jungletrain.net/streamtest/;stream/1",
          format: "mp3",
          mimetype: "audio/mpeg"
        }
      ],
      position: 3
    },
    {
      id: 4,
      pathname: "plushrecs",
      name: "plushrecs.com",
      title: "plushrecs",
      subtitle: "Lush jungle and drum and bass",
      cover:
        "https://res.cloudinary.com/dgp7z9vkg/image/fetch/b_auto,c_pad,w_960/https://staging.dnbradio.com/images/plushrecs.png",
      website: "https://plushrecs.com",
      facebook: "https://facebook.com/plushrecs",
      twitter: "https://twitter.com/plushrecs",
      twitterId: "plushrecs",
      donations: {},
      schedule: {
        url: "https://api.dnbradio.nl/schedule"
      },
      podcast: {
        url: "https://api.dnbradio.nl/podcast",
        website: "https://dnbradio.com/podcast"
      },
      description: "Feel good music from Plush Recordings",
      nowplaying_url: {
        type: "azuracast",
        url: "https://azura.dnbradio.com/api/nowplaying/plushrecs"
      },
      streams: [
        {
          url: "https://plushrecs247.dnbradio.com/stream.mp3",
          format: "mp3",
          mimetype: "audio/mpeg"
        }
      ],
      position: 2
    },
    {
      id: 5,
      pathname: "section8recs",
      name: "section8recs.com",
      title: "section8recs",
      subtitle: "Dark heavy drum and bass",
      cover:
        "https://res.cloudinary.com/dgp7z9vkg/image/fetch/b_auto,c_pad,w_960/https://staging.dnbradio.com/images/section8recs.png",
      website: "https://section8recs.com",
      facebook: "https://facebook.com/section8recs",
      twitter: "https://twitter.com/section8recs",
      twitterId: "section8recs",
      donations: {},
      schedule: {
        url: "https://api.dnbradio.nl/schedule"
      },
      podcast: {
        url: "https://api.dnbradio.nl/podcast",
        website: "https://dnbradio.com/podcast"
      },
      description: "Heavy dnb from Section 8 Recordings",
      nowplaying_url: {
        type: "azuracast",
        url: "https://azura.dnbradio.com/api/nowplaying/section8recs"
      },
      streams: [
        {
          url: "https://section8recs247.dnbradio.com/stream.mp3",
          format: "mp3",
          mimetype: "audio/mpeg"
        }
      ],
      position: 5
    }
  ];
}
