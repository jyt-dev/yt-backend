import {Router} from "express";
import {changeCurrPassword, 
        getCurrUser, 
        getUserChannelProfile, 
        getWatchHistory, 
        loginUser, 
        logoutUser, 
        refrAccessToken, 
        registerUser, 
        updateAccDetails, 
        updateAvatar, 
        updateCoverImage} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

console.log("User routes loaded");

//Routes → Middleware → Controller
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser);

router.route("/login").post(loginUser);
//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refrAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrPassword);
router.route("/current-user").get(verifyJWT,getCurrUser);
router.route("/update-account").patch(verifyJWT,updateAccDetails);
router.route("/c/:username").get(verifyJWT,getUserChannelProfile);
router.route("/watch-history").get(verifyJWT,getWatchHistory);
router.report("/avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar);
router.route("/coverImage").patch(verifyJWT,upload.single("coverImage"),updateCoverImage);

export default router;