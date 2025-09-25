const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { Users, userSubmitionsDB } = require("../models/db");
const bcrypt = require("bcrypt");
dotenv.config();

const routes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Normal signup
routes.post("/signup", async (req, res) => {
  const body = req.body;
  const {email, password, username} = req.body.user;

  try {
    const user = await Users.findOne({ email });
    if (!user) return res.json({ message: "OTP not same bro..." });

    // ✅ Check OTP
    if (user.otp !== body.otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // ✅ Hash password properly
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);

    // ✅ Update user with hashed password
    await Users.findOneAndUpdate({ email }, { username, email, password: hashPassword });

    // ✅ Create safe JWT payload (don’t store password)
    const payload = { email, username };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

    // ✅ Set cookie
    res.cookie("token", token, {
  httpOnly: true,
  secure: true, // true on production (HTTPS)
  sameSite: "none", // allow cross-site
  maxAge: 30 * 24 * 60 * 60 * 1000,
});


    return res.json({ message: "Login successful", user });
  } catch (err) {
    return res.json({ message: "Server error"});
  }
});

routes.post("/login", async(req, res)=>{
  const {email, password} = req.body;

  const user = await Users.findOne({email});
  if(!user) return res.json({message: "user not found"});

  const hashPass = user.password;
  const isValid = await bcrypt.compare(password, hashPass);
  if(!isValid){
      return res.json({
          message: "Incorect Credentials"
      })
  }

  const payload = {email, password}
  const token = jwt.sign(payload, JWT_SECRET, {expiresIn: "30d"});
  res.cookie("token", token, {
  httpOnly: true,
  secure: true, // true on production (HTTPS)
  sameSite: "none", // allow cross-site
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

  return res.json({
      message: "Success"
  })
})


// Verify with passport-jwt
routes.get(
  "/verify",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({ message: req.user });
  }
);

// Google login start
routes.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback
routes.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/", session: false }),
  (req, res) => {
    const token = jwt.sign(req.user, JWT_SECRET);
    res.cookie("token", token, {
  httpOnly: true,
  secure: true, // true on production (HTTPS)
  sameSite: "none", // allow cross-site
  maxAge: 30 * 24 * 60 * 60 * 1000,
});
   
   res.redirect("https://leetcode-clone-frontend-nu.vercel.app");
  }
);

routes.post("/sendotp", async (req, res) => {
  const email = req.body.email;
  const otp = Math.floor(100000 + Math.random() * 900000);

  const userExists = await Users.findOne({ email });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "vivek87228@gmail.com",
        pass: "ojpg abxd bijo zzoi",
      },
    });

    const info = await transporter.sendMail({
      from: '"Prasad" <vivek87228@gmail.com>',
      to: email,
      subject: "OTP from Prasad",
      text: `Your OTP is ${otp}`,
      html: ` <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
      <h2 style="color: #333;">Hello!</h2>
      <p>Use the following OTP to complete your verification:</p>
      <div style="font-size: 32px; font-weight: bold; color: #1a73e8; margin: 20px 0; letter-spacing: 5px;">
        ${otp}
      </div>
      <p style="color: #555;">This OTP is valid for <strong>10 minutes</strong>.</p>
      <hr style="margin: 20px 0; border-color: #ddd;">
      <p style="font-size: 12px; color: #999;">If you did not request this, please ignore this email.</p>
    </div>
`,
    });

    if (!userExists) {
      await Users.create({
        username: "",
        email,
        password: "",
        otp,
      });
    } else {
      await Users.findOneAndUpdate(
        { email },
        {
          otp,
        }
      );
    }

   return res.json({ email, message: "OTP sent", info: info.messageId });
  } catch (err) {
   return res.json({ error: "Failed to send email"});
  }
});

routes.post("/logout", (req, res)=>{
      res.clearCookie("token",{
            httpOnly: true,
            secure: true,
            sameSite: "strict"
      })
      res.json({
         message: "logout success"
      })
})

routes.post("/testing", (req, res)=>{
     res.json({
        message: "Working bro"
    })
})

module.exports = routes;
