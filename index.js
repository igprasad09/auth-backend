const express = require("express")
const dotenv = require('dotenv')
dotenv.config()
const cors = require("cors")
const cookiParser = require("cookie-parser");
const authRoute = require("./routes/auth");
const passport = require("./passport");
const session = require("express-session");

const app = express()

app.use(cors({
   credentials: true,
   origin: "http://localhost:5173",
}));
app.use(cookiParser());
app.use(express.json());
app.use(passport.initialize());
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret",
  resave: false,
  saveUninitialized: false,
}));

app.use("/", authRoute);

app.listen(3000,()=>{
     console.log("server is running.....")
})

