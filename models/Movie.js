const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, required: true },
  year:        { type: Number, required: true },
  genres:      [{ type: String }],
  rating:      { type: Number, min: 0, max: 10 },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Movie', MovieSchema);
