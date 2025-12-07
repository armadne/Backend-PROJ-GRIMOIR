const mongoose = require('mongoose');

const BookSchema = mongoose.Schema({
  _id: {type: Number, required: true},
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  userId: { type: String, required: true },
  price: { type: Number, required: true },
});

module.exports = mongoose.model('Book', BookSchema);