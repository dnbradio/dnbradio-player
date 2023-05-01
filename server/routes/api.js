const express = require('express')
import RecordingController from "../controllers/RecordingController.js"
import StatusController from "../controllers/StatusController.js"
import EventController from "../controllers/EventController.js"
import UserProfileController from "../controllers/UserProfileController.js"
import DonationsController from "../controllers/DonationsController.js"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// go-away
app.get('/api', async (req, res, next) => {
  res.json({ message: 'go away!' });
});

// hello
app.get('/api/hello', async (req, res, next) => {
  res.json({ message: 'hello!' });
});

// status
app.get("/status", StatusController.index);
app.get("/now_playing", StatusController.index);

// donation
app.get("/donations", DonationsController.index);

// events
app.get("/events", EventController.findAll);

// recordings
app.get("/recordings", RecordingController.findAll);
app.get("/recordings/:id", RecordingController.findOne);
app.post("/recordings", RecordingController.create);
app.put("/recordings/:id", RecordingController.update);
app.delete("/recordings/:id", RecordingController.delete);
app.delete("/recordings", RecordingController.deleteAll);

// profiles
app.get("/profiles", UserProfileController.findAll);
app.get("/profiles/:id", UserProfileController.findOne);
app.post("/profiles", UserProfileController.create);
app.put("/profiles/:id", UserProfileController.update);
app.delete("/profiles/:id", UserProfileController.delete);
app.delete("/profiles", UserProfileController.deleteAll);

export default {
  path: '/api',
  handler: app
}

