const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const bcrypt = require('bcryptjs');

//Register new user
router.post('/', (req, res) => {
    const {username, email, password} = req.body;
    
    //Check if request is valid
    if(!username || !email || !password) {
        return res.status(400).json({msg: 'Please enter all required fields'});
    }

    //Check if already exists
    User.findOne({"$or": [
        {"username": username},
        {"email": email}
    ]})
    .then(user => {
        if(user) return res.status(400).json({msg: 'User with that username or email already exists'});
        const newUser = new User({
            username,
            email,
            password
        });
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
                if(err) throw err;
                    newUser.password = hash;
                newUser.save().then(() => {
                    return res.status(200).json({msg: 'Registration successful'});
                });
            })
        });
    })
});

//Get all users
router.get('/', (req, res) => {
    User
        .find()
        .then(users => res.json(users))
        .catch(err => res.json(err));
})

//Get specific user by id
router.get('/:id', (req, res) => {
    User.findById(req.params.id)
        .then(user => {
            res.json(user);
        })
        .catch(err => {
            res.json(err);
        })
})

//Get specific user by name
router.get('/user/:username', (req, res) => {
    User.findOne({username: req.params.username})
        .then(user => {
            res.json({user: user});
        })
        .catch(err => {
            res.json(err);
        })
})

module.exports = router;