import express from "express";
import {
  createVideo,
  getVideos,
  getVideo,
  updateVideo,
  deleteVideo,
} from "../controllers/videoController.js";

const router = express.Router();

router.post("/", createVideo);
router.get("/", getVideos);
router.get("/:id", getVideo);
router.put("/:id", updateVideo);
router.delete("/:id", deleteVideo);

export default router;
