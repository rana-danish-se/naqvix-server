import express from "express";
import upload from "../middlewares/multer.js";
import {
  createGallery,
  getGalleries,
  getGalleryById,
  updateGallery,
  deleteGallery,
} from "../controllers/galleryController.js";

const router = express.Router();

// CRUD Routes
router.post("/", upload.array("images", 5), createGallery);
router.get("/", getGalleries);
router.get("/:id", getGalleryById);
router.put("/:id", upload.array("images", 5), updateGallery);
router.delete("/:id", deleteGallery);

export default router;
