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

routes.post("/programexicute", async (req, res) => {
  const { email, code, language, stdio } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Login is Required!" });
  }

  try {
    // 1️⃣ Fetch runtimes
    const runtimesResp = await axios.get("https://emkc.org/api/v2/piston/runtimes");
    const runtimes = runtimesResp.data;

    // 2️⃣ Find version
    const version = runtimes.find(r =>
      r.language.toLowerCase() === language.toLowerCase() ||
      (r.aliases && r.aliases.includes(language.toLowerCase()))
    )?.version;

    if (!version) return res.status(400).json({ error: "Language not supported" });

    // 3️⃣ Execute code for each stdio safely
    const results = [];
    for (let i = 0; i < stdio.length; i++) {
      const io = stdio[i];
      let finalCode = code;

      if (language.toLowerCase() === "python" && io.python) finalCode += `\n${io.python}`;
      if (language.toLowerCase() === "javascript" && io.javascript) finalCode += `\n${io.javascript}`;

      try {
        const executeResp = await axios.post("https://emkc.org/api/v2/piston/execute", {
          language: language.toLowerCase(),
          version,
          files: [{ name: "main", content: finalCode }],
          stdin: io.input || ""
        });

        results.push({ index: i, output: executeResp.data });
      } catch (err) {
        console.error(`Execution failed for test case ${i}:`, err.message);
        results.push({ index: i, output: { run: { stdout: "", stderr: "Execution failed" } } });
      }
    }

    // 4️⃣ Return all results
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
})

module.exports = routes;
