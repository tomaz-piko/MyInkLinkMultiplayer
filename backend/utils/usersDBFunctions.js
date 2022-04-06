const User = require('../models/Users');

function updateStatsFromGame(players) {
    players.forEach(player => {
        User
            .findOne({username: player.user})
            .then(user => {
                if(!user) {
                    console.log("error update stats user not found");
                    return;
                }
                let _gamesPlayed = user.gamesPlayed + 1;
                let _roundsPlayed = user.roundsPlayed + player.roundsPlayed;
                let _totalPoints = user.totalPoints + player.totalPoints;
                _totalPoints = Math.round(_totalPoints * 10) / 10;
                let _avgPtsPerRound = _totalPoints / _roundsPlayed;
                _avgPtsPerRound = Math.round(_avgPtsPerRound * 10) / 10;
                User
                    .updateOne({username: user.username}, {$set: {
                        gamesPlayed: _gamesPlayed,
                        roundsPlayed: _roundsPlayed,
                        totalPoints: _totalPoints,
                        avgPtsPerRound: _avgPtsPerRound
                    }})
                    .then()
                    .catch(err => console.log(err))
            })
    })
}

exports.updateStatsFromGame = updateStatsFromGame;