const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const bcrypt = require('bcryptjs');

//Login
router.post('/', (req, res) => {
    const {username, password} = req.body;

    //Check if request is valid.
    if(!username || !password) {
        return res.status(400).json({msg: 'Please enter all required fields'});
    }

    User.findOne({username})
        .then(user => {
            if(!user) return res.status(400).json({msg: 'User with that username does not exist'});
            bcrypt
                .compare(password, user.password)
                .then(isMatch => {
                    if(!isMatch) return res.status(400).json({msg: 'Invalid password'});
                    else return res.status(200).json({msg: 'Login successful'});
                })
        })
})

module.exports = router;