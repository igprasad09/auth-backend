const express = require("express");
const dotenv = require('dotenv');
dotenv.config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo"); // ✅ Added: Required for Vercel sessions
const passport = require("./passport");

// Route imports
const authRoute = require("./routes/auth");
const programsRoute = require("./routes/programs");
const rankRoute = require("./routes/rankdata");
const adminRoute = require("./routes/admin");
const contestRoute = require("./routes/contests");

const app = express();

// --- ✅ UPDATED CORS CONFIGURATION ---
// This is more robust for Vercel's edge network
app.use(cors({
  origin: ["http://localhost:5173", "https://prepcode.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Explicitly handle preflight OPTIONS requests for all routes
app.options('*', cors());

app.use(cookieParser());
app.use(express.json());

// --- ✅ UPDATED SESSION CONFIGURATION ---
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret",
  resave: false,
  saveUninitialized: false,
  // Store sessions in your database so they survive Vercel's serverless cold starts
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URI // Make sure this is set in your Vercel Environment Variables
  }),
  cookie: {
    // secure MUST be true in production for cross-origin cookies to work
    secure: process.env.NODE_ENV === "production", 
    // sameSite MUST be 'none' when frontend and backend are on different domains
    sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', 
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

app.use(passport.initialize());
// Note: if you are using sessions with Passport, you usually need app.use(passport.session()) here too.

// Routes
app.use("/", authRoute);
app.use("/programs", programsRoute);
app.use("/api", rankRoute);
app.use("/admin", adminRoute);
app.use("/contests", contestRoute);

app.post("/testing", (req, res)=>{
     res.json({
        message: "Working bro"
    });
});

// ✅ Export app for Vercel
module.exports = app;

// ✅ Run locally only
if (require.main === module) {
  app.listen(3000, () => {
    console.log("server is running..... 3000");
  });
}
