import Blog from '../models/Blog.js';
import cloudinary from '../configs/cloudinary.js';
import fs from 'fs'

export const createBlog = async (req, res) => {
  try {
    const { title, subtitle, description, category } = req.body;
    if (!title || !subtitle || !description) {
      return res
        .status(400)
        .json({ error: 'All required fields must be filled' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    let uploadedUrls = [];
    for (const file of req.files) {
      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: 'naqvix_blogs' }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(file.buffer);
      });

      uploadedUrls.push({
        url: uploadRes.secure_url,
        public_id: uploadRes.public_id,
      });
    }
    const blog = await Blog.create({
      title,
      subtitle,
      images: uploadedUrls,
      description,
      category,
    });

    return res.status(201).json({
      success: true,
      message: '✅ Blog created successfully!',
      blog,
    });
  } catch (error) {
    console.error('❌ Error creating blog:', error);
    return res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};

export const getBlogs = async (req, res) => {
  try {
    // Extract query params (or set defaults)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || 'all';

    // Build filter
    let filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category !== 'all') {
      filter.category = category;
    }

    // Count total
    const totalBlogs = await Blog.countDocuments(filter);

    // Query blogs
    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 }) // latest first
      .skip((page - 1) * limit)
      .limit(limit);

    // Response
    res.json({
      success: true,
      blogs,
      page,
      limit,
      totalBlogs,
      totalPages: Math.ceil(totalBlogs / limit),
      hasPrev: page > 1,
      hasNext: page < Math.ceil(totalBlogs / limit),
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Server error while fetching blogs' });
  }
};

// Add this to your existing BlogController.js

export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if ID is provided
    if (!id) {
      return res.status(400).json({
        error: 'Blog ID is required',
      });
    }

    // Find blog by ID
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        error: 'Blog not found',
      });
    }

    // Return the blog
    return res.status(200).json({
      message: '✅ Blog retrieved successfully!',
      blog,
    });
  } catch (error) {
    console.error('❌ Error fetching blog by ID:', error);

    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid blog ID format',
      });
    }

    return res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};


export const removeBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Blog ID is required" });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Delete images from Cloudinary
    if (blog.images && blog.images.length > 0) {
      for (const img of blog.images) {
        if (img.public_id) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (err) {
            console.error(`Failed to delete image ${img.public_id}:`, err);
          }
        }
      }
    }

    // Delete blog document
    await Blog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
      blog,
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const updateBlog = async (req, res) => {
  try {
    const blogId = req.params.id;

    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    // Parse existingImages sent from frontend
    let existingImages = [];
    if (req.body.existingImages) {
      // existingImages could be a single string or JSON string
      if (typeof req.body.existingImages === "string") {
        try {
          existingImages = JSON.parse(req.body.existingImages);
        } catch {
          existingImages = [req.body.existingImages]; // fallback
        }
      } else {
        existingImages = req.body.existingImages;
      }
    }

    // Convert existingImages (URLs) to match blog.images
    const keepImages = blog.images.filter(img =>
      existingImages.includes(img.url)
    );

    // Delete images that were not kept
    const deleteImages = blog.images.filter(img =>
      !existingImages.includes(img.url)
    );
    for (const img of deleteImages) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }

    // Upload new images
    let uploadedUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadRes = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "naqvix_blogs" }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(file.buffer);
        });

        uploadedUrls.push({
          url: uploadRes.secure_url,
          public_id: uploadRes.public_id,
        });
      }
    }

    // Final images = kept + new
    blog.images = [...keepImages, ...uploadedUrls];

    // Update blog fields
    blog.title = req.body.title || blog.title;
    blog.subtitle = req.body.subtitle || blog.subtitle;
    blog.description = req.body.description || blog.description;
    blog.category = req.body.category || blog.category;

    await blog.save();

    res.json({ success: true, message: "Blog updated successfully", blog });
  } catch (error) {
    console.error("Update Blog Error:", error);
    res.status(500).json({ success: false, message: "Failed to update blog" });
  }
};
