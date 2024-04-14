const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const fs = require("fs");

module.exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }, { __v: 0 });
    if (!user)
      return res.json({ msg: "Incorrect email or Password", status: false });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.json({ msg: "Incorrect email or Password", status: false });
    delete user.password;
    return res.json({
      status: true,
      user: {
        avatarImage: user.avatarImage,
        email: user.email,
        fullName: user.fullName,
        isAvatarImageSet: user.isAvatarImageSet,
        _id: user._id,
      },
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const emailCheck = await User.findOne({ email });
    if (emailCheck)
      return res.json({ msg: "Email already used", status: false });

    const otp = Math.floor(100000 + Math.random() * 900000);

    await nodemailer.createTestAccount((err, account) => {
      if (err) {
        // console.error("Failed to create a testing account. " + err.message);
        return process.exit(1);
      }
      // console.log("Credentials obtained, sending message...");
      let transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        service: "gmail",
        auth: {
          user: `${process.env.ADMIN_EMAIL_ID}`,
          pass: `${process.env.ADMIN_EMAIL_PASS}`,
        },
      });

      let message = {
        from: "Chatnow <shopnow@service.mail>",
        to: `${email}`,
        subject: "Chatnow OTP!",
        text: ``,
        html: `
  <body style="margin: 0; padding: 0; left: 0; top: 0;">
<div>
<div
  style="
    text-align: center;
    border: 1px solid #0084c7;
    padding: 5px 0;
    font-size: 20px;
    background-color: #0084c7;
    color: white;
    margin-bottom: 5px;
  "
>
  <b>One Time Password</b>
</div>
<div style="padding: 10px;">
  <h2>Dear,</h2>
  <p>
    Your One Time Password (OTP) is
    <u style="color: #0084c7;"><b>${otp}</b></u>
  </p>
  <p>It will be expired after 10 minutes.</p>
  <p style="color: red;">
    * Don't share your OTP to anyone else & be alert from fraudsters!
  </p>
  <div style="display: flex;">
    <div>
      <h3>Regards,</h3>
      <p style="margin-top: -15px;">Chatnow</p>
    </div>
    <div style="text-align: end; margin-top: 22px; width: 100%;">
      <img
        src="https://www.cryptocompare.com/media/34478301/logo_132_132_chat.png"
        alt="Chatnow"
        style="width: 35px;"
      />
    </div>
</div>
</div>
</body>
`,
      };

      transporter.sendMail(message, async (err, info) => {
        if (err) {
          res.json({ msg: "Could not send the otp try again!", status: false });
          return process.exit(1);
        }
        const SECRET = process.env.JWT_SECRET_KEY;
        const jwtToken = await jwt.sign({ otp, email }, SECRET);
        res
          .status(201)
          .json({ msg: "Success", status: true, otpToken: jwtToken });
      });
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.register = async (req, res, next) => {
  await jwt.verify(
    req.body.otpToken,
    process.env.JWT_SECRET_KEY,
    async (error, verifed) => {
      if (error) {
        return res.json({
          msg: "Something went wrong try again!",
          status: false,
        });
      }
      if (verifed) {
        const { otp, email } = verifed;
        if (req.body.otp.length !== 6) {
          return res.send({ msg: "Please enter 6 digit OTP!", status: false });
        } else {
          if (otp === parseInt(req.body.otp, 10) && email === req.body.email) {
            try {
              const { fullName, email, password } = req.body;
              const emailCheck = await User.findOne({ email }, { __v: 0 });
              if (emailCheck)
                return res.json({ msg: "Email already used", status: false });
              const hashedPassword = await bcrypt.hash(password, 10);
              const user = await User.create({
                fullName,
                email,
                password: hashedPassword,
              });
              delete user.password;
              return res.json({
                status: true,
                user: {
                  avatarImage: user.avatarImage,
                  email: user.email,
                  fullName: user.fullName,
                  isAvatarImageSet: user.isAvatarImageSet,
                  _id: user._id,
                },
              });
            } catch (ex) {
              next(ex);
            }
          } else {
            return res.send({ msg: "Incorrect OTP!", status: false });
          }
        }
      }
    }
  );
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.params.id } }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
      "fullName",
      "contacts",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};

module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const avatarImage = req.body.image;
    const userData = await User.findByIdAndUpdate(
      userId,
      {
        isAvatarImageSet: true,
        avatarImage,
      },
      { new: true }
    );
    return res.json({
      isSet: userData.isAvatarImageSet,
      image: userData.avatarImage,
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.logOut = (req, res, next) => {
  try {
    if (!req.params.id) return res.json({ msg: "User id is required " });
    onlineUsers.delete(req.params.id);
    return res.status(200).send();
  } catch (ex) {
    next(ex);
  }
};

module.exports.postUserProfile = async (req, res, next) => {
  const { fullName } = req.body;

  const check = await User.findById({ _id: req.params.id });
  const oldAvatar = check.avatarImage && check.avatarImage.slice("28");

  if (req.file && !fullName) {
    try {
      const users = await User.findByIdAndUpdate(
        { _id: req.params.id },
        {
          avatarImage: "https://ndxmx8-5000.csb.app/" + req.file.path,
        }
      );
      fs.unlinkSync(oldAvatar);
      return res.json(users);
    } catch (ex) {
      next(ex);
    }
  }
  if (fullName && !req.file) {
    try {
      const users = await User.findByIdAndUpdate(
        { _id: req.params.id },
        {
          fullName,
        }
      );
      return res.json(users);
    } catch (ex) {
      next(ex);
    }
  }
  if (req.file && fullName) {
    try {
      const users = await User.findByIdAndUpdate(
        { _id: req.params.id },
        {
          fullName,
          avatarImage: "https://ndxmx8-5000.csb.app/" + req.file.path,
        }
      );
      fs.unlinkSync(oldAvatar);
      return res.json(users);
    } catch (ex) {
      next(ex);
    }
  }
};

module.exports.getUserProfile = async (req, res, next) => {
  try {
    const users = await User.findById({ _id: req.params.id }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
      "fullName",
      "isAvatarImageSet",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};
