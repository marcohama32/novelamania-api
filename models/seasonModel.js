const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const { Decimal128 } = require("mongoose").Schema.Types;

// Define the Mongoose schema for expense
const seasonSchema = new mongoose.Schema(
  {
    novel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Novel',
      required: true
    },
    season_number: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
    },
    release_year: {
      type: Date,
    },
    episodes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Episode'
    }],
  },
  {
    timestamps: true, // Enable timestamps
  }
);

// Create the Mongoose model using the schema
const Season = mongoose.model("Season", seasonSchema);

module.exports = Season;
