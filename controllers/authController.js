const User = require('../models/userModel');
const Role = require('../models/roleModel');
const UserToken = require('../models/userTokenModel')
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')
const jwt = require('jsonwebtoken')
const nodemailer= require('nodemailer')
//to login

const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email })
      .populate("roles", "role");
    const { roles } = user;

    if (!user) {
      //return res.status(404).send("User Not Found")
      return next(createError(404, "User Not Found"))
    }
    const isPassword = await User.findOne({ password: req.body.password })
    if (!isPassword) {
      //return res.status(404).send("Password is Incorrect")
      return next(createError(404, "Password is Incorrect"))
    }
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin, roles: roles },
      process.env.JWT_SECRET
    )
    // return res.status(200).send("Login Success!")
    res.cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json({
        "token" : token,
        status: 200,
        message: "Login Success",
        data: user
      })
  }
  catch (error) {
    // return res.status(500).send("Something went wrong")
    return next(createError(500, "Something went wrong"))
  }
}

//Register Admin

const registerAdmin = async (req, res, next) => {
  try {
    const role = await Role.find({});
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      contactNumber: req.body.contactNumber,
      companyAddress: req.body.companyAddress,
      images,
      isAdmin: true,
      roles: role
    })
    await newUser.save();
    //return res.status(200).send("User Registered Successfully")
    return next(createSuccess(200, "Admin Registered Successfully"))
  }
  catch (error) {
    //return res.status(500).send("Something went wrong")
    return next(createError(500, "Something went wrong"))
  }
}

//sendresetmail

const sendEmail = async (req, res, next) => {
  const email = req.body.email;
  const user = await User.findOne({ email: { $regex: '^' + email + '$', $options: 'i' } });
if(!user){
  return next(createError(404, "User Not found"))
}
 const payload={
  email:user.email
 }
 const expiryTime = 900;
 const token = jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:expiryTime});
 const newToken = new UserToken({
  userId: user._id,
  token: token
 });
 const mailTransporter = nodemailer.createTransport({
  service:"gmail",
  auth:{
    user:"ut.gupta29@gmail.com",
    pass:"yver vjuu fvbb hcot"
   }
 });
 //const resetLink = `http://localhost:4200/reset/${token}`;
 let mailDetails={
  from: "ut.gupta29@gmail.com",
  subject: "Reset Password !",
  to: email,
//  text: `Click the following link to reset your password: ${resetLink}`,
  html: `<html>
  <head>
      <title>Password Reset Request</title>
  </head>
  <body>
      <h1>Password Reset Request</h1>
      <p>Dear ${user.username},</p>
      <p>We have received a request to reset your password for your account with Cleaner Application. To complete the password reset process, please click on the button below:</p>
      <a href=${process.env.LIVE_URL}/reset/${token}><button style="background-color: #4CAF50; color: white; padding: 14px 20px; border: none;
      cursor: pointer; border-radius: 4px;">Reset Password</button></a>
      <p>Please note that this link is only valid for a <b>15 minutes</b>.
      If you did not request a password reset, please ignore this message.</p>
      <p>Thank you,</p>
      <p>Cleaner Application</p>
  </body>
  </html>`,
 };
 mailTransporter.sendMail(mailDetails,async(err,data)=>{
  if(err){
    console.log(err);
    return next(createError(500, "Something went wrong"))
  }
  else{
  console.log("Email sent successfully !!!");
  await newToken.save();
  return next(createSuccess(200, "Email Sent Successfully"))
  }
 });
}

// Reset Password
 const resetPassword = (req, res, next) => {
  const token = req.body.token;
  const newPassword = req.body.password;

  jwt.verify(token, process.env.JWT_SECRET, async (err, data) => {
      if (err)
      {
          return next(CreateError(500, "Password Reset Link is Expired!"));
      }
      else
      {
          const response = data;
          const user = await User.findOne({ email: { $regex: '^' + response.email + '$', $options: 'i'}});
          user.password = newPassword;
          try
          {
              const updatedUser = await User.findOneAndUpdate(
              { _id: user._id },
              { $set: user },
              { new: true });
              return next(createSuccess(200, "Password Reset Success!"));
          }
          catch (error)
          {
              return next(createError(500, "Something went wrong while resetting the password!"))
          }
      }
  });
}

///otpbasedforget


//sendresetmail
const sendEmail1 = async (req, res, next) => {
  const email = req.body.email;
  try {
    const user = await User.findOne({ email: { $regex: '^' + email + '$', $options: 'i' } });

    if (!user) {
      return next(createError(404, "User Not found"))
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = otp;
    user.otpExpiration = Date.now() + 15 * 60 * 1000;
    await user.save();

    const ResetPasswordLink = `http://localhost:3000/reset-password?token=${otp}`;

    const mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailDetails = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong></p><p>This OTP is valid for 15 minutes.</p>
      <p><a href="${ResetPasswordLink}" style="padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a></p>`
    };

    await mailTransporter.sendMail(mailDetails);
    res.status(200).json({ message: "OTP sent to your email" });
  }
  catch (error) {
    console.error("Error sending OTP email:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }

};

// verify otp
const verifyOTP1 = async (req, res, next) => {
  const { otp } = req.body;
  try {
    const user = await User.findOne({ otp, otpExpiration: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.status(200).json({ message: "OTP verified successfully", token });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Reset Password
const resetPassword1 = async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    // Decode the token to get the user's email
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decodedToken.email;

    // Find the user by their email
    const user = await User.findOne({ email: userEmail });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's password with the new password directly (without hashing)
    user.password = newPassword;

    // Save the updated user object
    await user.save();

    // Respond with success message
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


module.exports = {
  login, registerAdmin,sendEmail,resetPassword,sendEmail1,resetPassword1,verifyOTP1
}