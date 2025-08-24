import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/annoucementController.js";

const router = express.Router();

router.post("/", createAnnouncement);
router.get("/", getAnnouncements);
router.get("/:id", getAnnouncement);
router.put("/:id", updateAnnouncement);
router.delete("/:id", deleteAnnouncement);

export default router;
