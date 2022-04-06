const Room = require('../models/Rooms');

function addUserToRoom(user, roomName) {
    Room
        .findOne({name: roomName})
        .then(room => {
            if(!room) {
                console.log(`addUserToRoom {404} room {${roomName}} does not exist`);
                return;
            }
            let count = room.playerCount;
            if(count > 7) {
                console.log(`addUserToRoom {400} room {${roomName}} is full!`);
                return;
            }
            count +=1;
            Room
                .updateOne({_id: room._id}, {$set: {playerCount: count}, $push: {players: user}})
                .then()
                .catch(err => console.log(err));
        })
        .catch(err => {
            console.log(err)
        })
}

exports.addUserToRoom = addUserToRoom;

function removeUserFromRoom(user, roomName) {
    Room
        .findOne({name: roomName})
        .then(room => {
            if(!room) {
                console.log("removeUserFromRoom 404");
                return;
            }
            let count = room.playerCount;
            if(count > 0) {
                count -= 1;
                const newPlayers = room.players.filter(player => player !== user);
                Room
                    .updateOne({_id: room._id}, {$set: {playerCount: count, players: newPlayers}})
                    .then()
                    .catch(err => console.log(err));
            }
        })
        .catch(err => {
            console.log(err);
        })
}

exports.removeUserFromRoom = removeUserFromRoom;

function toggleGameInProgress(room) {
    Room
        .findOne({name: room})
        .then(room => {
            let inProgress = room.gameInProgress
            Room
                .updateOne({_id: room._id}, {$set: {gameInProgress: !inProgress}})
                .then()
                .catch(err => console.log(err));
        })
}

exports.toggleGameInProgress = toggleGameInProgress;

function deleteRoom(room) {
    Room
        .findOne({name: room})
        .then(room => room.remove().then(() => 
            console.log("Room removed { " + room.name + " }")
        ))
}

exports.deleteRoom = deleteRoom;