import 'dotenv/config'
import express from 'express'
import consola from 'consola'

import axios from 'axios'
import cors from 'cors'

import Autocomplete from './models/Autocomplete.js'
import Sequelize from 'sequelize';

//import db from "./models/index.js"
import routes from "./routes/api.js"

import { Nuxt, Builder } from 'nuxt'

// db.sequelize.sync()
// .then(() => {
//   console.log("Synced db.");
// })
// .catch((err) => {
//   console.log("Failed to sync db: " + err.message);
// });


var axiosDefaults = axios.defaults;
axiosDefaults.baseURL = '/';

const app = express()
app.use(cors())

// var bodyParser = require('body-parser');
// // configure the app to use bodyParser()
// app.use(bodyParser.urlencoded({
//     extended: true
// }));
// app.use(bodyParser.json());

app.use(express.json({ extended: true }))

// Import and Set Nuxt.js options
import config from '../nuxt.config.js'

config.dev = process.env.NODE_ENV !== 'production'

async function start () {

  // Init Nuxt.js
  const nuxt = new Nuxt(config)
  let { host, port } = nuxt.options.server

  console.log('nuxt.options.server', nuxt.options.server);

  if (process.env.NODE_HOST) {
    host = process.env.NODE_HOST
  }
  if (process.env.NODE_PORT) {
    port = process.env.NODE_PORT
  }

  await nuxt.ready()
  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }

  app.use('/api', routes)

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()
