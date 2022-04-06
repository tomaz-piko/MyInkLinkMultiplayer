const express = require('express');
const router = express.Router();
const Room = require('../models/Rooms');

//Get all available rooms
router.get('/', (req, res) => {
    Room
        .find()
        .sort({creationDate: -1})
        .then(rooms => res.json({rooms: rooms}))
        .catch(err => res.json(err));
})

//Create room
//Creates new room
//Called from CreateRoomModal.js
router.post('/', (req, res) => {
    const {name, host} = req.body;

    //Check if request is valid.
    if(!name || !host) {
        return res.status(400).json({msg: 'Please enter all required fields'});
    }

    Room.findOne({"name": name})
    .then(room => {
        if(room) return res.status(400).json({msg: 'Room with that name already exists'});
        const newRoom = new Room({
            name,
            host
        });
        newRoom
            .save()
            .then(roomObj => {
                if(!roomObj) return res.status(400).json({msg: 'Creation unsuccessful'})
                else return res.status(200).json({msg: 'Room creation successful', room: roomObj})
            })
            .catch(err => {
                console.log(err);
            })
    })
})

//Join user to room.
//Checks if room is not full yet and prevents joining if it is.
//Runs in Lobby.js
router.patch('/join/:name', (req, res) => {
    //Find corresponding room
    Room
        .findOne({name: req.params.name})
        .then(room => {
            //Room with that name was not found.
            if(!room) return res.status(404).json({msg: 'Room does not exist.'});
            //Check if room is not full yet.
            if(room.playerCount > 7) return res.status(400).json({msg: 'Room is already full.'})
            if(room.gameInProgress) return res.status(400).json({msg: 'Game already in progress'})
            return res.status(200).json({msg: 'User has successfuly joined the room.'});
        })
        .catch(err => {
            console.log(err);
        })
})

//Remove user from room.
//Never called, used as admin playerCount control method.
router.patch('/leave/:name', (req, res) => {
    //Find corresponding room
    Room
        .findOne({name: req.params.name})
        .then(room => {
            //Room with that name was not found.
            if(!room) return res.status(404).json({msg: 'Room does not exist.'});
            let count = room.playerCount;
            //Decrement player count.
            //TODO array with actual players.
            if(count > 0) count -= 1;
            Room
                .updateOne({_id: room._id}, {$set: {playerCount: count}})
                .then(res => res.json({msg: 'User has successfuly left the room.'}))
                .catch(err => res.json(err))               
        })
})

//Remove room
//Never called, used as admin control
router.delete('/:id', (req, res) => {
    Room.findById(req.params.id)
        .then(room => room.remove().then(() => res.json({success: true})));
})

module.exports = router;