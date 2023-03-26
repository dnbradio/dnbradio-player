var mongoose = require('mongoose');
var schema = new mongoose.Schema({
  name: String,
  tags: Array
});
module.exports = mongoose.model('Autocomplete', schema);