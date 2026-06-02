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
   res.redirect("https://prepcode.vercel.app/dashboard"); // redirect to frontend
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
      from: '"Prepcode" <vivek87228@gmail.com>',
      to: email,
      subject: "OTP from Prasad",
      text: `Your OTP is ${otp}`,
      html: ` <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Animations for email clients that support them */
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(15px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes glowPulse {
      0% { box-shadow: 0 0 10px rgba(0, 240, 255, 0.1); }
      50% { box-shadow: 0 0 25px rgba(0, 240, 255, 0.4); }
      100% { box-shadow: 0 0 10px rgba(0, 240, 255, 0.1); }
    }
    
    .animated-wrapper {
      animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .otp-glow {
      animation: glowPulse 2.5s infinite alternate;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; -webkit-font-smoothing: antialiased;">

  <!-- Background Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #09090b; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <tr>
      <td align="center" style="padding: 60px 15px;">
        
        <!-- Main Content Card -->
        <div class="animated-wrapper" style="max-width: 480px; width: 100%; background: linear-gradient(145deg, #121214, #18181b); padding: 40px; border-radius: 16px; border: 1px solid #27272a; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- Header Icon (Optional SVG placeholder) -->
          <div style="margin-bottom: 24px;">
            <div style="width: 48px; height: 48px; background-color: rgba(0, 240, 255, 0.1); border-radius: 50%; display: inline-block; line-height: 48px;">
              <span style="font-size: 24px;">🛡️</span>
            </div>
          </div>

          <h2 style="color: #ffffff; margin: 0 0 12px 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Security Verification</h2>
          
          <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
            A request was made to verify your identity. Please use the secure authorization code below to proceed.
          </p>

          <!-- Animated OTP Box -->
          <div class="otp-glow" style="background-color: #000000; border: 1px solid #00f0ff; border-radius: 12px; padding: 24px; margin: 0 auto 24px auto; max-width: 300px;">
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 700; color: #00f0ff; letter-spacing: 12px; margin-left: 12px; text-shadow: 0 0 15px rgba(0, 240, 255, 0.3);">
              ${otp}
            </div>
          </div>

          <p style="color: #71717a; font-size: 14px; margin: 0 0 32px 0;">
            This code will expire in <span style="color: #00f0ff; font-weight: 600;">10 minutes</span>.
          </p>

          <!-- Divider -->
          <div style="height: 1px; background: linear-gradient(90deg, transparent, #27272a, transparent); margin: 32px 0;"></div>

          <p style="color: #52525b; font-size: 12px; line-height: 1.5; margin: 0;">
            If you did not initiate this request, your account is secure, but you may safely ignore and delete this email.
          </p>

        </div>
      </td>
    </tr>
  </table>

</body>
</html>
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
