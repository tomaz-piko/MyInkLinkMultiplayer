const express = require('express');
const http = require('http');
const cors = require('cors');
const socketio = require('socket.io');
const dotenv = require('dotenv').config();
const connectDB = require('./config/db');
const PORT = process.env.PORT || 5000;

connectDB();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors());

//Routes
const usersRoute = require('./routes/users');
const authRoute = require('./routes/auth');
const roomsRoute = require('./routes/rooms');
const roomUtils = require('./utils/roomFunctions');
app.use('/users', usersRoute);
app.use('/auth', authRoute);
app.use('/rooms', roomsRoute);

var allClients = [];
var statusReportIntervals = [];
var roundEndTimeouts = [];
var gameHandlerIntervals = [];
//When client connects
io.on('connection', socket => {
  //Join the user to specific room.
  socket.on('joinRoom', ({room, user}) => {
      socket.join(room);

      let client = {socket: socket.id, room, user}
      roomUtils.addUserToRoom(client, room);
      //Prvi gost v sobi... setup interval
      let roomInfo = roomUtils.getRoomInfo(room);
      if(roomInfo.users.length == 1) {
        let statusReportInterval = setInterval(statusReport, 5000);
        statusReportIntervals.push({room: room, interval: statusReportInterval});
        function statusReport() {
          let roomInfo = roomUtils.getRoomInfo(room)
          if(roomInfo.game.inProgress) {
            io.to(room).emit('statusMessage', `game in progress... (${roomInfo.users.length} / 8)`);
          }
          else if(roomInfo.users.length < 3) {
            io.to(room).emit('statusMessage', `waiting for players... (${roomInfo.users.length} / 8)`);
          }
          else if(roomInfo.users.length >= 3 && roomInfo.users.length < 8) {
            io.to(room).emit('statusMessage', `waiting for host to start game... (${roomInfo.users.length} / 8)`);
          }
          else if(roomInfo.users.length === 8) {
            io.to(room).emit('statusMessage', `game starting soon... (${roomInfo.users.length} / 8)`);
          }
        }
      }

      //Keeping track of all connected user for disconnect.
      allClients.push(client);

      //Send welcome msg to user that joined
      socket.emit('serverMessage', `Welcome ${user}`);
  
      //Send msg to everyone else that a new user has joined.
      socket.broadcast.to(room).emit('serverMessage', `${user} has joined the room.`);
    });

  //Listen for chat message
  socket.on('chatMessage', ({msg, room}) => {
    io.to(room).emit('chatMessage', msg);
  })

  //Listen for drawing
  socket.on('drawBuffer', ({drawBuffer, room}) => {
    socket.broadcast.to(room).emit('drawBuffer', drawBuffer);
  })

  socket.on('gameStart', ({msg, room}) => {
    let roomInfo1 = roomUtils.getRoomInfo(room);
    if(roomInfo1.users.length < 3) return;  
    io.to(room).emit('serverMessage', `${msg.user} started the game. Get ready!`);
    roomUtils.startGame(room);

    let gameHandlerInterval = setInterval(gameHandler, 1000);
    gameHandlerIntervals.push({room: room, interval: gameHandlerInterval}); 
    
    function gameRound() {
      let currRound = roomUtils.prepareNewRound(room);
      io.to(room).emit('canvasClear');
      io.to(room).emit('serverMessage', `Next round starting in ${roomUtils.roundReadyLength / 1000}s. It's ${currRound.playerOnTurn.user}'s turn.`)
      io.to(currRound.playerOnTurn.socket).emit('serverMessage', `Your word is "${currRound.guessWord}".`);
      setTimeout(function() { //Runda se začne po 5 sekundnem "ready period-u"
        roomUtils.startNewRound(room);         
        io.to(room).emit('serverMessage', 'START!');
        io.to(currRound.playerOnTurn.socket).emit('allowDrawing');
        let roundEndTimeout = setTimeout(function() {
          roomUtils.endRound(room);
          io.to(currRound.playerOnTurn.socket).emit('disallowDrawing');
          io.to(room).emit('serverMessage', 'TIME IS UP!');
        }, roomUtils.roundLength);
          roundEndTimeouts.push({room: room, timeout: roundEndTimeout}); 
      }, roomUtils.roundReadyLength);   
    }

    function gameHandler() {
      function clearGameHandlerInterval(room) {
        let indexOf = gameHandlerIntervals.indexOf({room: room});
        let ghi = gameHandlerIntervals.splice(indexOf, 1)[0];
        clearInterval(ghi.interval);
      }
      function clearRoundEndTimeout(room) {
        let indexOf = roundEndTimeouts.indexOf({room: room});
        let ret = roundEndTimeouts.splice(indexOf, 1)[0];
        clearTimeout(ret.timeout);
      }
      let roomInfo = roomUtils.getRoomInfo(room);    
      if(!roomInfo) {
        clearRoundEndTimeout(room);
        clearGameHandlerInterval(room);
      }
      //Prva runda
      if(roomInfo.game.rounds.length === 0) {
        gameRound();
      }
      //Zadnja runda in že končana
      else if(roomInfo.inProgress === false) {
        //Poračunaj statistiko
        io.to(room).emit('statusMessage', `game ended.`);
        let results = roomUtils.calculateStatistics(roomInfo.name);
        io.to(room).emit('gameResults', results);
        clearRoundEndTimeout(room);
        clearGameHandlerInterval(room);
      }
      //Ena izmed vmesnih rund zaključena (vsi ugotovili besedo).
      else if(roomInfo.game.rounds[roomInfo.game.rounds.length - 1].state === 2){
        clearRoundEndTimeout(room);
        io.to(roomInfo.game.rounds[roomInfo.game.rounds.length - 1].playerOnTurn.socket).emit('disallowDrawing');
        io.to(room).emit('serverMessage', 'Everybody guessed correctly... round over.');
        gameRound();
      }
      //Runda se je zaključila s potekom časa.
      else if(roomInfo.game.rounds[roomInfo.game.rounds.length - 1].state === 3) {
        gameRound();
      }
    }   
  })

  socket.on('gameGuess', ({msg, room}) => {
    let result = roomUtils.guessWord(msg, room);
    if(!result) return; //Game is not in progress
    if(result.status === "SUCCESS") {
      //Tell others the player has guessed the word.
      socket.broadcast.to(room).emit('serverMessage', `${msg.user} successfuly guessed the word!`);
      //Tell the user the result
      socket.emit('guessResponse', result);
    }
    else if(result.status === "FAIL") {
      result.msg = `${result.word} is incorrect`;
      //Tell the user the result
      socket.emit('guessResponse', result);
    }
  })

  //When client disconnects
  socket.on('disconnect', () => {
    var indexOf = allClients.indexOf({socket: socket.id});
    var client = allClients.splice(indexOf, 1)[0];
    if(client) {
      io.to(client.room).emit('serverMessage', `${client.user} has left the room.`);
      //If last user left the room, clear interval
      if(roomUtils.removeUserFromRoom(client.user, client.room)){
        let indexOf = statusReportIntervals.indexOf({room: client.room});
        let spi = statusReportIntervals.splice(indexOf, 1)[0];
        clearInterval(spi.interval);
      }  
    }
  })
})

server.listen(PORT);
console.log(`Server listening on port ${PORT}`);