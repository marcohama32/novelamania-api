const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const { Decimal128 } = require("mongoose").Schema.Types;

// Define the Mongoose schema for expense
const novelSchema = new mongoose.Schema(
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
      views: {
        type: Number,
        default: 0 // Default to 0 views
      }
  },
  {
    timestamps: true, // Enable timestamps
  }
);

// Create the Mongoose model using the schema
const Novel = mongoose.model("Novel", novelSchema);

module.exports = Novel;
