const express = require("express");
const { programsDB, ContestsDB, userSubmitionsDB, ContestSubmitionsDB } = require("../models/db");
const routes = express.Router();

routes.get("/programstitle", async (req, res)=>{
        const allprograms = await programsDB.find({}, { id: 1, title: 1});
        return res.json({
             message: allprograms
        })
});

routes.get("/allcontestslist", async (req, res)=>{
       const allcontests = await ContestsDB.find({}, "contestName");
       return res.json({
            msg: allcontests
       })
})

routes.post("/addcontest", async (req, res)=>{
        const {contestName, addedPrograms} = req.body;
        try{
             await ContestsDB.create({
                     contestName,
                     addedPrograms
             });
             return res.json({
                msg: "added"
             })
        }catch(err){
            return res.json({
                msg: "error"
            }) 
        }
});

routes.post("/contestprograms", async(req, res)=>{
      const {id} = req.body;
      try{
        const data = await ContestsDB.find({_id: id});
        return res.json({
                msg: data
        })
      }catch(err){
         return res.json({
                msg: "error"
        })
      }     
});

routes.post("/contestsubmition", async (req, res) => {
  const { id } = req.body; 

  try {
    // 1. Get the contest details
    const contest = await ContestsDB.findById(id); 
    if (!contest) {
      return res.json({ msg: "Contest not found" });
    }

    // 2. Get the list of users who joined
    const contestJoinedInfo = await ContestSubmitionsDB.findOne({ contestId: id });
    
    if (!contestJoinedInfo || contestJoinedInfo.users.length === 0) {
       return res.json({ msg: "success", data: [] });
    }

    const joinedUsers = contestJoinedInfo.users;

    // 3. Check each joined user's submissions
    const usersProgressData = await Promise.all(joinedUsers.map(async (userEmail) => {
      
      const userSubmissions = await userSubmitionsDB.findOne({ userId: userEmail });
      const userGlobalSolvedIds = userSubmissions ? userSubmissions.programId : [];

      // 4. Filter to get ONLY the IDs of contest programs the user has solved
      const solvedContestProgramIds = contest.addedPrograms
        .map(program => program.id) // Get the IDs from the contest ("1", "4", "6")
        .filter(programId => userGlobalSolvedIds.includes(Number(programId))); // Keep only if solved

      return {
        userEmail: userEmail,
        totalSolved: solvedContestProgramIds.length,
        solvedPrograms: solvedContestProgramIds // This will just be an array like ["4"] or ["2", "4"]
      };
    }));

    return res.json({
      msg: "success",
      data: usersProgressData
    });

  } catch (error) {
    console.error("Error fetching contest submissions:", error);
    return res.json({ msg: "error" });
  }
});

routes.post("/joincontest", async (req, res) => {
  const { profilEmail, id } = req.body;
  
  try {
    // 1. Find the contest document matching the given id
    const contest = await ContestSubmitionsDB.findOne({ contestId: id });

    // 2. If the contest doesn't exist yet, create it and add the user
    if (!contest) {
      await ContestSubmitionsDB.create({
        contestId: id,
        users: [profilEmail]
      });
      return res.json({ msg: "joined successfully" });
    }

    // 3. Check if the user's email is already in the users array
    if (contest.users.includes(profilEmail)) {
      return res.json({ msg: "already joined" });
    }

    // 4. If the user isn't in the array, add them and save
    contest.users.push(profilEmail);
    await contest.save();

    return res.json({ msg: "joined successfully" });

  } catch (error) {
    console.error("Error joining contest:", error);
    return res.json({ msg: "error" });
  }
});

module.exports = routes;