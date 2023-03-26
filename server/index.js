require("dotenv").config();
const express = require("express");
const consola = require("consola");
const mongoose = require("mongoose");
const AccessCode = require("./models/AccessCode.js");
const Autocomplete = require("./models/Autocomplete.js");
const axios = require("axios");
const cors = require("cors");

//let axiosDefaults = require('axios/lib/defaults');
// axiosDefaults.baseURL = '/';

const AWS = require("aws-sdk");
const cryptoRandomString = require("crypto-random-string");

const { Nuxt, Builder } = require("nuxt");
const app = express();
app.use(cors());

// var bodyParser = require('body-parser');

// // configure the app to use bodyParser()
// app.use(bodyParser.urlencoded({
//     extended: true
// }));
// app.use(bodyParser.json());

app.use(express.json({ extended: true }));

// mongoose.connect('mongodb://'+process.env.MONGO_INITDB_ROOT_USERNAME+':'+process.env.MONGO_INITDB_ROOT_PASSWORD+'@' + process.env.MONGO_INITDB_HOST + ':27017/' + process.env.MONGO_INITDB_DATABASE, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

// Import and Set Nuxt.js options
const config = require("../nuxt.config.js");
config.dev = process.env.NODE_ENV !== "production";

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config);
  let { host, port } = nuxt.options.server;
  if (process.env.NODE_HOST) {
    host = process.env.NODE_HOST;
  }
  if (process.env.NODE_PORT) {
    port = process.env.NODE_PORT;
  }

  await nuxt.ready();
  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt);
    await builder.build();
  }

  app.get("/api", async (req, res, next) => {
    res.json({ message: "go away!" });
  });

  app.get("/api/hello", async (req, res, next) => {
    res.json({ message: "hello!" });
  });

  // now playing
  app.post("/api/now_playing", async (req, res, next) => {
    //console.log('req.body.url', req)
    axios
      .get(req.body.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36"
        }
      })
      .then(response => {
        res.json(response.data);
        return;
      })
      .catch((err, res) => {
        console.log(err, res);
      });
  });
  app.get("/api/now_playing", async (req, res, next) => {
    //console.log('req.params.url', req.query)
    axios
      .get(req.query.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36"
        }
      })
      .then(response => {
        res.json(response.data);
        return;
      })
      .catch((err, res) => {
        console.log(err, res);
        return;
      });
  });
  app.get("/api/now_playing/jungletrain", async (req, res, next) => {
    //console.log('req.params.url', req.query)
    axios
      .get("https://jungletrain.net/np_info.php", {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36"
        }
      })
      .then(response => {
        res.json(response.data);
        return;
      })
      .catch((err, res) => {
        console.log(err, res);
        return;
      });
  });
  // autocompletes - PUT
  app.put("/api/autocompletes", async (req, res, next) => {
    if (req.body.payload) {
      req.body.payload.forEach(item => {
        //console.log('item', item)
        Autocomplete.findOneAndUpdate(
          { name: item.name, tags: item.tags },
          {
            tags: item.tags,
            name: item.name
          },
          { new: true, useFindAndModify: false, upsert: true },
          function(err, docs) {
            //console.log(err, docs);
          }
        );
      });
      res.send(req.body.payload);
      return;
    }
    res.status(500).send("empty");
  });
  // autocompletes - SEARCH
  app.post("/api/autocompletes/search", async (req, res, next) => {
    if (req.body.search) {
      // find
      await Autocomplete.find(
        req.body.search,
        { name: 1, tags: 1 },
        (err, matches) => {
          if (err) return console.error(err);
          res.json({ matches: matches });
        }
      );
    } else {
      // return all
      await Autocomplete.find(
        { name: { $ne: null } },
        { name: 1, tags: 1 },
        (err, matches) => {
          if (err) return console.error(err);
          res.json({ matches: matches });
        }
      );
    }
  });
  // access code - CHECK IF EMAIL EXISTS
  app.post("/api/check-email", async (req, res, next) => {
    if (req.body.email) {
      await AccessCode.find(
        { email: req.body.email },
        {
          email: 1,
          name: 1,
          nominees: 1,
          nominations: 1,
          verfied: 1,
          expires: 1
        },
        (err, matches) => {
          if (err) return console.error(err);
          res.json({ matches: matches });
        }
      );
    }
  });
  // access code - POST (verify)
  app.post("/api/verify-code/:code", async (req, res, next) => {
    if (req.params.code) {
      let accesscode = await AccessCode.findOneAndUpdate(
        { token: req.params.code, email: req.body.email, verified: false },
        { verified: true },
        { new: true, useFindAndModify: false }
      );
      if (!accesscode) {
        res.status(404).send("not found");
        return;
      }
      res.json(accesscode);
    }
  });

  // acccess code - SEND
  app.post("/api/access-code/send", async (req, res, next) => {
    const code = cryptoRandomString({ length: 6, type: "numeric" });
    let accesscode = await AccessCode.findOneAndUpdate(
      { email: req.body.email },
      {
        token: code,
        email: req.body.email,
        name: req.body.name,
        expires: new Date(+new Date() + 3 * 60 * 60 * 1000),
        verified: false
      },
      { new: true, useFindAndModify: false, upsert: true }
    );

    // SES config
    let config = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_KEY,
      region: process.env.AWS_ACCESS_REGION
    };
    AWS.config.update(config);
    const ses = new AWS.SES({ apiVersion: "2010-12-01" });
    const recipientName = req.body.name || req.body.email;

    // SES compose
    const params = {
      Destination: {
        ToAddresses: ['"' + recipientName + '" <' + req.body.email + ">"]
      },
      // ConfigurationSetName: <<ConfigurationSetName>>,
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data:
              "<html><body><h1>Hello " +
              recipientName +
              ",</h1><p>Here is your access code.</p><h2 style='color:red'>" +
              code +
              "</h2></body></html>"
          },
          Text: {
            Charset: "UTF-8",
            Data:
              "Hello " +
              recipientName +
              ", \n\nHere is your access code.\n\n" +
              code
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Access code"
        }
      },
      Source: '"dnbradio" <team@dnbradio.coms>'
    };
    // SES send
    ses
      .sendEmail(params)
      .promise()
      .then(() => {
        res.json({ message: "ok" });
      });
  });

  // Give nuxt middleware to express
  app.use(nuxt.render);

  // Listen the server
  app.listen(port, host);
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  });
}
start();
