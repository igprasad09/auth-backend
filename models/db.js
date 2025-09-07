const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://admin:admin123@clusterlearn.9aeov48.mongodb.net/leetclone");

const Users = mongoose.model('users',{
           username: String,
           email: String,
           password: String,
           otp: String
});

module.exports = {
      Users
}