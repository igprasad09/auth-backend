const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://admin:admin123@clusterlearn.9aeov48.mongodb.net/leetclone"
);

const Users = mongoose.model("users", {
  username: String,
  email: String,
  password: String,
  otp: String,
});

const userSubmitionsDB = mongoose.model("submitions", {
  userId: String,
  programId: [{
      type: Number
  }],
});

const programsDB = mongoose.model("programs", {
  id: String,
  title: String,
  difficulty: String,
  category: String,
  solutionlink: String,
});

const programinfoDB = mongoose.model("programdetail",{
      id: String,
      difficulty: String,
      description: String,
      examples: [{
           input: String,
           output: String,
           explanation: String
      }],
      constraints: [],
      starterCode: {
        javascript: String,
        python: String,
        cpp: String
      },
      testCases: [],
      tags: [],
      visibility: String
},"programdetail");

module.exports = {
  Users,
  userSubmitionsDB,
  programsDB,
  programinfoDB
};
