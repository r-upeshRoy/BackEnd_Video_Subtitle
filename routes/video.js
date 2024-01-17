const {
  addVideo,
  getAllVideos,
  addSubtitle,
  getSubtitles,
  getSubtitleSrtFile,
  deleteVideo,
} = require("../controllers/video");
const { videoUpload, subtitleUpload } = require("../middlewares/videoUpload");

const router = require("express").Router();

router.post("/upload", videoUpload.single("video"), addVideo);
router.get("/videos", getAllVideos);
router.post(
  "/upload-subtitle/:videoId",
  subtitleUpload.array("subtitles"),
  addSubtitle
);
router.get("/subtitles/:videoId", getSubtitles);
router.get("/subtitlesSrtFile/:videoId", getSubtitleSrtFile);
router.delete("/video/:videoId", deleteVideo);

module.exports = router;
