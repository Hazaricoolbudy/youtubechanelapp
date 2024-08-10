import { Router } from "express";
const router = Router();
import {
  accessRefreshToken,
  changeUserCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  upDateCoverImage,
  updateUserAvatar,
  updateUserDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
// secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(accessRefreshToken);
router.route("/changed-password").post(verifyJWT, changeUserCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/change-user-details").patch(verifyJWT, updateUserDetails);
router
  .route("/change-user-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/change-user-cover").patch(verifyJWT, upDateCoverImage);

export default router;
