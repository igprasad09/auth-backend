const express = require("express");
const {userSubmitionsDB} = require("../models/db");
const routes = express.Router();

routes.get("/allrank", async(req, res)=>{
      const rankData = await userSubmitionsDB.find({});
      const Data = rankData.map((element) => ({
                       email: element.userId,
                       numberOfProgram: element.programId.length
                }));
      const sortedData = Data.sort((a, b)=> b.numberOfProgram - a.numberOfProgram);
      res.json({
          rank : sortedData
      })
});

module.exports = routes;