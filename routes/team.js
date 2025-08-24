import express from "express";
import upload from "../middlewares/multer.js";
import { createTeamMember, getTeamMembers, getTeamMemberById, updateTeamMember, deleteTeamMember } from "../controllers/teamController.js";

const router = express.Router();

// Single image upload
router.post("/", upload.single("image"), createTeamMember);
router.get("/", getTeamMembers);
router.get("/:id", getTeamMemberById);
router.put("/:id", upload.single("image"), updateTeamMember);
router.delete("/:id", deleteTeamMember);

export default router;
