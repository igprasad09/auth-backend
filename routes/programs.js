const express = require("express");
const routes = express.Router();
const { programsDB, programinfoDB, userSubmitionsDB, FeedbacksDB, LikesDB } = require("../models/db");
const { default: axios } = require("axios");

routes.get("/", async (req, res) => {
  const programs = await programsDB.find({active: true});
  return res.json({
    programs,
  });
});

routes.post("/programinfo", async (req, res) => {
  const id = req.body.id;
  const programinfo = await programinfoDB.findOne({ id });
  return res.json({
    info: programinfo,
  });
});

let cachedRuntimes = null;
let lastFetched = 0;


routes.post("/programexicute", async (req, res) => {
  const { email, code, language, stdio } = req.body;
  
  // 1. Debugging check: See what the frontend actually sent
  console.log("Execution Request Payload:", { email, language, hasCode: !!code, stdioType: typeof stdio });

  if (!email) {
    return res.status(400).json({ message: "Login is Required!" });
  }

  // 2. Safety check: Prevent server crash if stdio is missing or not an array
  if (!stdio || !Array.isArray(stdio)) {
    console.error("Execution Error: stdio is missing or not an array.");
    return res.status(400).json({ error: "Test cases are missing or invalid for this problem." });
  }

  try {
    // 🔹 Judge0 language mapping
    const languageMap = {
      python: 71,
      javascript: 63,
      cpp: 54,
      c: 50,
      java: 62
    };

    const language_id = languageMap[language.toLowerCase()];

    if (!language_id) {
      return res.status(400).json({ error: "Language not supported" });
    }

    const execPromises = stdio.map(async (io, i) => {
      let finalCode = code;

      // Append the execution function call based on language
      if (language.toLowerCase() === "python" && io.python) finalCode += `\n${io.python}`;
      if (language.toLowerCase() === "javascript" && io.javascript) finalCode += `\n${io.javascript}`;
      // Note: C, C++, and Java usually require a main() function in the starter code, 
      // so they might not need string concatenation here unless you set it up that way.

      try {
        const executeResp = await axios.post(
          "https://ce.judge0.com/submissions/?base64_encoded=false&wait=true",
          {
            source_code: finalCode,
            language_id: language_id,
            stdin: io.input || ""
          },
          {
            headers: {
              "Content-Type": "application/json"
            },
            timeout: 15000
          }
        );

        return {
          index: i,
          success: true,
          output: executeResp.data
        };

      } catch (err) {
        console.error(`Execution failed for test case ${i}:`, err.response?.data || err.message);
        return {
          index: i,
          success: false,
          output: { stdout: "", stderr: "Execution request failed." }
        };
      }
    });

    const results = await Promise.all(execPromises);
    return res.json({ results });

  } catch (err) {
    // Log the FULL error to the terminal so you aren't guessing
    console.error("Server execution block error:", err);
    return res.status(500).json({ error: "Server busy or execution failed" });
  }
});



routes.post("/submit", async(req, res)=>{
      const {email, id} = req.body;
      const programId = Number(id);
      console.log(programId)
      try{
          const updated = await userSubmitionsDB.findOneAndUpdate(
            {userId: email},
            {$addToSet: {programId}},
            {new: true, upsert: true}
          )
          res.json(updated)
      }catch(err){
          console.error(err);
          res.status(500).json({ error: "Something went wrong" });
      }
});

routes.post("/allsubmitions", async(req, res)=>{
     const {email} = req.body;
     try{
         const submitions = await userSubmitionsDB.findOne({userId: email});
         return res.json(submitions);
     }catch(err){
        console.log(err)
        return res.status(401).json({
           message: err
        })
     }
});

routes.post("/feedback",async(req, res)=>{
  const body = req.body;
  try{
     const feedbackDB = await FeedbacksDB.create({
                email: body.email,
                feedback: body.feedback
     })
     return res.json({
     message: `${feedbackDB}`
  })
  }catch(err){
     return res.json({
       message: "Error bro....."
     })
  }
});

routes.get("/allfeedbacks",async(req, res)=>{
      const allfeedbacks = await FeedbacksDB
  .find()
  .sort({ _id: -1 });

      try {
          return res.json({
             allfeedbacks
          })
      } catch (error) {
         return res.json({
          data: "error"
         })
      }
});

  routes.post("/addlikes", async(req, res)=>{
        const {email, id} = req.body
        const programId = Number(id);
        try{
           const updated = await LikesDB.findOneAndUpdate(
            {email: email},
            {$addToSet: {programId}},
            {new: true, upsert: true}
          )
          return res.json({
              message: "ok bro",
              updated
          })
        }catch(erro){
           return res.json({
             message:"error bro"
           })
        }
  })

module.exports = routes;