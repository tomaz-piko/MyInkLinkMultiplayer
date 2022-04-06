const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
      type: String,
      required: true
  },
  creationDate: {
    type: Date,
    default: Date.now
  },
  gamesPlayed: {
    type: Number,
    required: false,
    default: 0
  },
  roundsPlayed: {
    type: Number,
    required: false,
    default: 0
  },
  totalPoints: {
    type: Number,
    required: false,
    default: 0
  },
  avgPtsPerRound: {
    type: Number,
    required: false,
    default: 0
  }
})

module.exports = mongoose.model('Users', UserSchema);
