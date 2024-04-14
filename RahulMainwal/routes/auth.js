const {
  login,
  sendOtp,
  register,
  getAllUsers,
  setAvatar,
  getUserProfile,
  postUserProfile,
  logOut,
} = require("../controllers/userController");
const router = require("express").Router();
const upload = require("../middlewares/upload");

router.post("/login", login);
router.post("/sendOtp", sendOtp);
router.post("/register", register);
router.get("/allusers", getAllUsers);
router.post("/setavatar/:id", setAvatar);
router.get("/profile/:id", getUserProfile);
router.post("/profile/:id", upload.single("avatarImage"), postUserProfile);
router.get("/logout/:id", logOut);

module.exports = router;
