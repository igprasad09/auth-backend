const express = require("express");
const dotenv = require('dotenv');
dotenv.config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth");
const passport = require("./passport");
const session = require("express-session");
const programsRoute = require("./routes/programs");

const app = express();

app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL || "http://localhost:5173",
}));

app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret",
  resave: false,
  saveUninitialized: false,
}));

app.use("/", authRoute);
app.use("/programs", programsRoute);

app.post("/testing", (req, res)=>{
     res.json({
        message: "Working bro"
    })
})

// ✅ Export app for Vercel
module.exports = app;

// ✅ Run locally only
if (require.main === module) {
  app.listen(3000, () => {
    console.log("server is running..... 3000");
  });
}
