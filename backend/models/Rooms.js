const mongoose = require('mongoose');
const Users = require('./Users');

const RoomSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  host: {
    type: String,
    required: true
  },
  playerCount: {
      type: Number,
      default: 0
  },
  players: [{
      type: String,
      ref: Users,
      default: []
  }],
  gameInProgress: {
      type: Boolean,
      default: false
  },
  creationDate: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Rooms', RoomSchema);
