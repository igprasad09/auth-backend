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
    const resp = await axios.get("https://emkc.org/api/v2/piston/runtimes");
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
    // 🔹 Get runtimes once
    const runtimes = await getRuntimes();

    // 🔹 Find version
    const version = runtimes.find(r =>
      r.language.toLowerCase() === language.toLowerCase() ||
      (r.aliases && r.aliases.includes(language.toLowerCase()))
    )?.version;

    if (!version) {
      return res.status(400).json({ error: "Language not supported" });
    }

    // 🔹 Prepare execution promises in parallel
    const execPromises = stdio.map(async (io, i) => {
      // Clone original code each time
      let finalCode = code;

      // Append test-case-specific code if provided
      if (language.toLowerCase() === "python" && io.python) finalCode += `\n${io.python}`;
      if (language.toLowerCase() === "javascript" && io.javascript) finalCode += `\n${io.javascript}`;

      try {
        const executeResp = await axios.post(
          "https://emkc.org/api/v2/piston/execute",
          {
            language: language.toLowerCase(),
            version,
            files: [{ name: "main", content: finalCode }],
            stdin: io.input || ""
          },
          { timeout: 15000 } // 15 second timeout per execution
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
          output: { run: { stdout: "", stderr: "Execution failed" } }
        };
      }
    });

    // 🔹 Execute all promises in parallel
    const results = await Promise.all(execPromises);

    // 🔹 Send response
    return res.json({ version, results });

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
