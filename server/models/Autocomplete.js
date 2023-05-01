import mongoose from 'mongoose';
var schema = new mongoose.Schema({
  name: String,
  tags: Array
});
export default mongoose.model('Autocomplete', schema);