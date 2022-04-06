const { isValidObjectId } = require('mongoose');
const roomDBUtils = require('./roomDBFunctions');
const userDBUtils = require('./usersDBFunctions');

const possibleWords = ["akvarij", "britvica", "cigareta", "časopis", "daljnogled", "evolucija", "faraoni", "geotrikotnik", "hidrant", "injekcija", "jasnovidec", "klobuk", "lopata", "merjasec", "najemnina", "ogrlica", "pivo", "rumenjak", "skodelica", "štoparica", "tarantela", "uspavalo", "vazektomija", "zobozdravnik", "želva"];
const roundLength = 180000; //3m
exports.roundLength = roundLength;
const roundReadyLength = 5000; //5s
exports.roundReadyLength = roundReadyLength;
const maxPoints = 300;

let rooms = [];

//user = {user: 'ime', socket: socketId, room: room}
//room = 'neki'
function addUserToRoom(user, room) {  
    let roomIdx = findRoomIdx(room);
    if(roomIdx !== -1) {
        const currUsers = rooms[roomIdx].users;
        rooms[roomIdx].users = [...currUsers, user];
    }
    else {
        let newRoom = {
            name: room,
            users: [{...user}],
            game: {
                inProgress: false,
                playerQueue: [], //Kdo še ni bil na vrsti
                rounds: null
            }
        }
        rooms.push(newRoom);
    }
    roomDBUtils.addUserToRoom(user.user, room);
}

exports.addUserToRoom = addUserToRoom;

function removeUserFromRoom(user, room) {
    let roomIdx = findRoomIdx(room);
    if(roomIdx !== -1) {
        rooms[roomIdx].users = rooms[roomIdx].users.filter(u => u.user !== user)
        roomDBUtils.removeUserFromRoom(user, room);
        if(rooms[roomIdx].users.length === 0) {
            roomDBUtils.deleteRoom(room);
            return true;
        }
        return false;
    }
    return false;
}

exports.removeUserFromRoom = removeUserFromRoom;

function findRoomIdx(room) {
    for(let i = 0; i < rooms.length; i++) {
        if(rooms[i].name === room) {
            return i;
        }
    }
    return -1;
}

function getRoomInfo(room) {
    for(let i = 0; i < rooms.length; i++) {
        if(rooms[i].name === room) {
            return rooms[i];
        }
    }
    return null;
}

exports.getRoomInfo = getRoomInfo;

function stateOfRoundByIdx(idx, room) {
    return getRoomInfo(room).game.rounds[idx-1].state;
}

exports.stateOfRoundByIdx = stateOfRoundByIdx;

function startGame(room) {
    let roomIdx = findRoomIdx(room);
    let currRoom = rooms[roomIdx];
    currRoom.game.playerQueue = currRoom.users;
    currRoom.game.inProgress = true;
    currRoom.game.rounds = [];
    roomDBUtils.toggleGameInProgress(room); //Nastavi na in progress.
    rooms[roomIdx] = currRoom; //Sobo v seznamo sob prepišemo z urejeno sobo.
}

exports.startGame = startGame;

function prepareNewRound(room) {
    let roomIdx = findRoomIdx(room);
    let currRoom = rooms[roomIdx];
    let randWordIdx = Math.floor(Math.random() * possibleWords.length); //Random od 0 do (št. besed)
    let randPlayerIdx = Math.floor(Math.random() * (currRoom.game.playerQueue.length - 1))
    let randWord = possibleWords[randWordIdx];
    let randPlayer = currRoom.game.playerQueue[randPlayerIdx]
    let round = {
        state: 0, //0 = preparing, 1 = inProgress, 2 = finished(all guessed), 3 = finished(timeExpired)
        number: currRoom.game.rounds.length + 1,
        guessWord: randWord,
        playerOnTurn: randPlayer,
        roundStartTS: null, //time now + 10s
        correctGuesses: []
    }
    currRoom.game.playerQueue = currRoom.game.playerQueue.filter(p => p.user !== round.playerOnTurn.user);
    currRoom.game.rounds.push(round); 
    rooms[roomIdx] = currRoom;
    return round;
}

exports.prepareNewRound = prepareNewRound;

function startNewRound(room) {
    let roomIdx = findRoomIdx(room);
    let currRoom = rooms[roomIdx];
    currRoom.game.rounds[currRoom.game.rounds.length - 1].state = 1;
    var ts = Math.round(+ new Date()/1000);
    currRoom.game.rounds[currRoom.game.rounds.length - 1].roundStartTS = ts;
    rooms[roomIdx] = currRoom;
}

exports.startNewRound = startNewRound;

function endRound(room) {
    let roomIdx = findRoomIdx(room);
    let currRoom = rooms[roomIdx];
    let lastRoundIdx = currRoom.game.rounds.length - 1;
    let currRound = currRoom.game.rounds[lastRoundIdx];
    if(currRound.correctGuesses.length === currRoom.users.length - 1) {
        currRoom.game.rounds[currRoom.game.rounds.length - 1].state = 2;
    }
    else {
        currRoom.game.rounds[currRoom.game.rounds.length - 1].state = 3;
    }
    
    //Zaključena runda je bila zadnja runda
    if(currRoom.game.rounds.length === currRoom.users.length) {
        currRoom.inProgress = false;
        roomDBUtils.toggleGameInProgress(room); //Nazaj na !inProgress
    }
    rooms[roomIdx] = currRoom;
}

exports.endRound = endRound;

function calculateStatistics(room) {
    let roomIdx = findRoomIdx(room);
    let currRoom = rooms[roomIdx];
    let participants = [];
    for(let i = 0; i < currRoom.users.length; i++) {
        let participant = {
            user: currRoom.users[i].user,
            roundsPlayed: currRoom.game.rounds.length,
            totalPoints: 0,
            totalGuesses: 0
        }
        participants.push(participant);
    }
    for(let i = 0; i < currRoom.game.rounds.length; i++) {
        let currRound = currRoom.game.rounds[i];
        let roundTS = currRound.roundStartTS;
        for(let j = 0; j < currRound.correctGuesses.length; j++) {
            let guess = currRound.correctGuesses[j];
            let idx = findInArray(participants, guess.user)
            if(idx > -1) {
                let neededSeconds = guess.timeStamp - roundTS;
                let pointPerSecond = maxPoints / (roundLength / 1000);
                let totalPoints = maxPoints - (neededSeconds * pointPerSecond);
                totalPoints = Math.round(totalPoints * 10) / 10; //Na eno decimalno mesto
                participants[idx].totalPoints += totalPoints;
                participants[idx].totalGuesses += 1;
                if(j === 0) {
                    //"Obdelujemo" prvega / zmagovalca zato polovico točk damo risatelju
                    let dIdx = findInArray(participants, currRound.playerOnTurn.user);
                    if(dIdx > -1) {
                        totalPoints = Math.round((totalPoints / 2) * 10) / 10;
                        participants[dIdx].totalPoints += totalPoints;
                    }
                }
            }
        }
    }
    userDBUtils.updateStatsFromGame(participants);
    return participants;
}

exports.calculateStatistics = calculateStatistics;

function guessWord(msg, room) {
    let roomIdx = findRoomIdx(room);
    let currRoom = rooms[roomIdx];
    let lastRoundIdx = currRoom.game.rounds.length - 1;
    if(!currRoom.game.inProgress) {
        console.log("room game not in progress");
        return null;
    }
    if(currRoom.game.rounds[lastRoundIdx].state !== 1) {
        console.log("round game not in progress");
        return null;
    }
    let lastRound = currRoom.game.rounds[lastRoundIdx];
    //Preveri če je igralec, ki riše vpisal guess
    if(msg.user === lastRound.playerOnTurn.user) {
        return null;
    }
    //Preveri če je beseda prava
    if(msg.message === lastRound.guessWord) {
        //Preveri če je igralec že ugotovil besedo
        if(!userAlreadyGuessed(lastRound, msg.user)) {
            let ts = Math.round(+ new Date()/1000);
            currRoom.game.rounds[lastRoundIdx].correctGuesses.push({user: msg.user, timeStamp: ts});
            rooms[roomIdx] = currRoom;
            //Vsi razen risar ugotovili, zaključi rundo.
            if(currRoom.game.rounds[lastRoundIdx].correctGuesses.length === currRoom.users.length - 1) {
                endRound(room);
            }
            return {word: msg.message, status: "SUCCESS"}
        }
        else {
            return null;
        }
    }
    else {
        return {word: msg.message, status: "FAIL"}
    }
}

exports.guessWord = guessWord;

function userAlreadyGuessed(lastRound, user) {
    for(let i = 0; i < lastRound.correctGuesses.length; i++) {
        if(lastRound.correctGuesses[i].user === user) {
            return true
        }
    }
    return false;
}

function findInArray(arr, user) {
    for(let i = 0; i < arr.length; i++) {
        if(arr[i].user === user) {
            return i
        }
    }
    return -1;
}