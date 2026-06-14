import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { deleteVideo, getAllVideos, getVideoById, togglePublishStatus, updateVideo, uploadAVideo } from "../controllers/video.controller";
import { upload } from "../middlewares/multer.middleware";


const router = Router();

router.use(verifyJWT); //applies all routes in this file

router.get("/",getAllVideos);

router.route("/").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    uploadAVideo
);

router.route("/:videoId").get(getVideoById);

router.route("/:videoId").patch(upload.single("thumbnail"),updateVideo);
router.route("/:videoId").delete(deleteVideo);
router.route("/:videoId/toggle-publish").patch(togglePublishStatus);
export default router;