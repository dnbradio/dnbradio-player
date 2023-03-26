var mongoose = require('mongoose');
var schema = new mongoose.Schema({
  token: String,
  email: String,
  name: String,
  verified: Boolean,
  expires: { type: Date, default: () => new Date(+new Date() + 3*60*60*1000) },
});
module.exports = mongoose.model('AccessCode', schema);