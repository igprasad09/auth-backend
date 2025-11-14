const express = require("express");
const routes = express.Router();
const { programsDB, programinfoDB, userSubmitionsDB } = require("../models/db");
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
    // 1️⃣ Fetch runtimes
    const runtimesResp = await axios.get(
      "https://emkc.org/api/v2/piston/runtimes"
    );
    const runtimes = runtimesResp.data;

    // 2️⃣ Find version
    const versions = runtimes
      .filter(
        (r) =>
          r.language.toLowerCase() === language.toLowerCase() ||
          (r.aliases &&
            r.aliases.includes(language.toLowerCase()))
      )
      .map((r) => r.version);

    const version = versions[0];
    if (!version)
      return res.status(400).json({ error: "Language not supported" });

    // 3️⃣ Prepare executions for each stdio entry
    const promises = stdio.map(async (io, index) => {
      let finalCode;

      if (language.toLowerCase() === "python") {
        finalCode = `${code}\n${io.python}`;
      } else if (language.toLowerCase() === "javascript") {
        finalCode = `${code}\n${io.javascript}`; // or your field name
      } else {
        finalCode = `${code}`;
      }

      const executeResp = await axios.post(
        "https://emkc.org/api/v2/piston/execute",
        {
          language: language.toLowerCase(),
          version,
          files: [{ name: "main", content: finalCode }],
        }
      );

      return {
        index,
        output: executeResp.data,
      };
    });

    // 4️⃣ Wait for all executions to finish
    const results = await Promise.all(promises);

    // 5️⃣ Send ONE response with all outputs
    return res.json({
      version,
      results,
    });
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
})

module.exports = routes;
