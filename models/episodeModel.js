const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const { Decimal128 } = require("mongoose").Schema.Types;

// Define the Mongoose schema for expense
const episodeSchema = new mongoose.Schema(
  {
    season: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Season",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    episode_number: {
      type: Number,
      required: true,
    },
    video_url: {
      type: String,
      required: true,
    },
    release_year: {
        type: Date,
        required: true
      },
    user: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true, // Enable timestamps
  }
);

// Create the Mongoose model using the schema
const Episode = mongoose.model("Episode", episodeSchema);

module.exports = Episode;
