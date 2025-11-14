const express = require("express");
const dotenv = require('dotenv');
dotenv.config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth");
const passport = require("./passport");
const session = require("express-session");
const programsRoute = require("./routes/programs");
const rankRoute = require("./routes/rankdata");

const app = express();

const allowedOrigins = [
  "http://localhost:5173", // Local development
  "https://leetcode-clone-frontend-nu.vercel.app" // Production frontend
];

app.use(cors({
  credentials: true,
  // Check if the request origin is in the allowed list
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
app.use("/api", rankRoute);

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
