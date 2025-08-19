import express from "express";
import upload from "../middlewares/multer.js";
import { createBlog, getBlogs, getBlogById, removeBlogById, updateBlog } from "../controllers/BlogController.js";

const blogRouter = express.Router();

blogRouter.post("/create", upload.array("images", 4), createBlog);
blogRouter.get("/get", getBlogs);
blogRouter.get("/get/:id", getBlogById); 
blogRouter.delete("/remove/:id", removeBlogById); 
blogRouter.put(
  '/update/:id',                 // blog ID in URL                   // optional auth middleware
  upload.array('images', 4),     // multer handles up to 4 images
  updateBlog
);
export default blogRouter;