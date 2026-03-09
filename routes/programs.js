const express = require("express");
const routes = express.Router();
const { programsDB, programinfoDB, userSubmitionsDB, FeedbacksDB } = require("../models/db");
const { default: axios } = require("axios");

routes.get("/", async (req, res) => {
  const programs = await programsDB.find();
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

async function getRuntimes() {
  const now = Date.now();
  // Refresh cache every 30 minutes
  if (!cachedRuntimes || (now - lastFetched > 30 * 60 * 1000)) {
    const resp = await axios.get("http://localhost:2000/api/v2/runtimes");
    cachedRuntimes = resp.data;
    lastFetched = now;
  } 
  return cachedRuntimes;
}

routes.post("/programexicute", async (req, res) => {
  const { email, code, language, stdio } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: "Login is Required!" });
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

      if (language.toLowerCase() === "python" && io.python) finalCode += `\n${io.python}`;
      if (language.toLowerCase() === "javascript" && io.javascript) finalCode += `\n${io.javascript}`;

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
        console.error(`Execution failed for test case ${i}:`, err.message);
        return {
          index: i,
          success: false,
          output: { stdout: "", stderr: "Execution failed" }
        };
      }

    });

    const results = await Promise.all(execPromises);

    return res.json({ results });

  } catch (err) {
    console.error("Server error:", err.message);
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
})

module.exports = routes;
