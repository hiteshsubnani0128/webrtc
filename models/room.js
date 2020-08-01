var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var RoomSchema = mongoose.Schema({
    roomName: {
        type: String
    },
    users: Array,
    time: {
        type: Date,
        default: Date.now
    },
    chat: Array
});

var Room = module.exports = mongoose.model('Room', RoomSchema);

module.exports.createRoom = function (newUser, callback) {
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(newUser.password, salt, function (err, hash) {
            newUser.password = hash;
            newUser.save(callback);
        });
    });
}

module.exports.getUserByUsername = function (email, callback) {
    var query = {
        email: email
    };
    User.findOne(query, callback);
}

// ========== To Update ===============
module.exports.getUser = function (username, callback) {
    var query = {
        username: username
    };
    User.findOne(query, callback);
}


module.exports.getUserById = function (id, callback) {
    User.findById(id, callback);
}

module.exports.comparePassword = function (candidatePassword, hash, callback) {
    bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
        if (err) throw err;
        callback(null, isMatch);
    });
}