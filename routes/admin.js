const express = require("express");
const { Users, userSubmitionsDB, programsDB , programinfoDB} = require("../models/db");
const routes = express.Router();


routes.get("/dashboardDetails", async(req, res)=>{
     const totalUsers = await Users.countDocuments();
     const totalSubmitions = await userSubmitionsDB.countDocuments();
     const totalPrograms = await programsDB.countDocuments();
     const allSubmitions = await userSubmitionsDB.distinct("userId");
     const allUsers = await Users.find({}, { email: 1, username: 1 });
     const allsubmitionsresult = await userSubmitionsDB.aggregate([
               {
               $project: {
                    userId: 1,
                    programCount: { $size: "$programId" }
               }
               }
               ]);
     const allPrograms = await programsDB.distinct("title")
     return res.json({
          totalUsers,
          totalSubmitions,
          totalPrograms,
          allSubmitions,
          allUsers,
          allsubmitionsresult,
          allPrograms
     })
});



routes.get("/allPrograms", async(req, res)=>{
     const allPrograms = await programsDB.find();
     return res.json({
          allPrograms
     })
});

routes.post("/changeTogales", async (req, res) => {
  const { title } = req.body;

  const updated = await programsDB.findOneAndUpdate(
    { title },
    [{ $set: { active: { $not: "$active" } } }],
    { new: true }
  );

  res.json(updated);
});

routes.post("/addProgram", async (req, res) => {
  try {
    const { 
      title, 
      category, 
      description, 
      difficulty, 
      visibility, 
      constraints, 
      solutionlink,
      tags,
      starterCode,
      examples,
      testCases,
      stdio // ✅ 1. Extract stdio from the frontend request
    } = req.body;

    // 1. Generate ID safely
    const lastProgram = await programsDB.findOne().sort({ id: -1 }).collation({ locale: "en_US", numericOrdering: true });
    const nextId = lastProgram ? String(Number(lastProgram.id) + 1) : "1";
    
    // Format the title (e.g., "8. New Problem")
    const formattedTitle = `${nextId}. ${title}`;

    // 2. Format Constraints (split by new lines into an array)
    const constraintsArray = constraints 
      ? constraints.split('\n').map(c => c.trim()).filter(c => c !== "")
      : ["No constraints"];

    // 3. Format Tags (split by comma)
    const tagsArray = tags
      ? tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== "")
      : [category.toLowerCase()];

    // 4. Save to Summary DB (programs)
    const newProgram = new programsDB({
      id: nextId,
      title: formattedTitle,
      difficulty: difficulty || "Easy",
      category: category,
      solutionlink: solutionlink || "", 
      active: true 
    });
    
    await newProgram.save();

    // 5. Save to Detailed DB (programdetail)
    const newProgramDetail = new programinfoDB({
      id: nextId,
      title: formattedTitle,
      difficulty: difficulty || "Easy",
      description: description || "No description provided.",
      examples: examples || [],
      constraints: constraintsArray,
      starterCode: {
        javascript: starterCode?.javascript || "",
        python: starterCode?.python || "",
        cpp: starterCode?.cpp || "",
        c: starterCode?.c || "",
        java: starterCode?.java || ""
      },
      testCases: testCases || [],
      tags: tagsArray,
      visibility: visibility || "public",
      dislike: "0",
      like: "0",
      stdio: stdio || [] // ✅ 2. Save the stdio array directly to the database!
    });

    await newProgramDetail.save();

    res.status(201).json({ message: "Program created successfully" });
  } catch (error) {
    console.error("Failed to add program:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

routes.post("/deleteProgram", async (req, res) => {
  try {
    const { title } = req.body;

    // 1. Delete from the programs collection
    const deletedSummary = await programsDB.findOneAndDelete({ title: title });
    
    // 2. Delete from the programdetail collection (programinfoDB)
    const deletedDetail = await programinfoDB.findOneAndDelete({ title: title });

    // Print to your node terminal to verify BOTH were found and deleted
    console.log("Deleted from programs:", deletedSummary ? "Success" : "Not Found");
    console.log("Deleted from programdetail:", deletedDetail ? "Success" : "Not Found");

    res.status(200).json({ message: "Program completely deleted from both databases" });
  } catch (error) {
    console.error("Failed to delete program:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = routes;