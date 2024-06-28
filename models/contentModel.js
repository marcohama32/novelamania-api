const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

// Define the Mongoose schema for content
const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    release_year: {
      type: Date,
      required: true
    },
    genres: {
      type: [String],
      required: false
    },
    image_url: {
      type: String,
      required: true
    },
    seasons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Season'
    }],
    user: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    type: {
      type: String,
      enum: ['novela', 'dorama'],
      required: true
    },
    views: {
      type: Number,
      default: 0 // Default to 0 views
    },
  },
  {
    timestamps: true, // Enable timestamps
  }
);

// Create the Mongoose model using the schema
const Content = mongoose.model("Content", contentSchema);

module.exports = Content;
