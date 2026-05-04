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

const FeedbacksDB = mongoose.model("feedbacks",{
     email: String,
     feedback: String
})

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
  active: { type: Boolean, default: true }
});

const programinfoDB = mongoose.model("programdetail",{
      id: String,
      difficulty: String,
      title: String,
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
      visibility: String,
      stdio: []
},"programdetail");

const LikesDB = mongoose.model("LikesDB",{
      email: String,
      programId: [{
          type: Number
      }],
},"LikesDB");

const ContestsDB = mongoose.model("Contests",{
       contestName: String,
       addedPrograms: []
},"ContestsDB");

const ContestSubmitionsDB = mongoose.model("ContestSubmitions",{
        contestId: String,
        users: []
}, "ContestSubmitions");

module.exports = {
  Users,
  userSubmitionsDB,
  programsDB,
  programinfoDB,
  FeedbacksDB,
  LikesDB,
  ContestsDB,
  ContestSubmitionsDB
};
