const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // Opcional: expirar sessões automaticamente após 30 dias
  }
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
