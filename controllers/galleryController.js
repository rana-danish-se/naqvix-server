import Gallery from "../models/Gallery.js";
import cloudinary from "../configs/cloudinary.js";

// Create a new gallery post
export const createGallery = async (req, res) => {
  try {
    const { title, description, link } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    let uploadedUrls = [];

    for (const file of req.files) {
      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "community/gallery", resource_type: "image" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(file.buffer);
      });

      uploadedUrls.push({
        url: uploadRes.secure_url,
        public_id: uploadRes.public_id,
      });
    }

    const newGallery = new Gallery({
      title,
      description,
      link,
      images: uploadedUrls,
    });

    await newGallery.save();

    res.status(201).json({
      message: "Gallery created successfully",
      data: newGallery,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating gallery", error: error.message });
  }
};

// Get all galleries
export const getGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    res.status(200).json(galleries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching galleries", error: error.message });
  }
};

// Get single gallery
export const getGalleryById = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ message: "Gallery not found" });

    res.status(200).json(gallery);
  } catch (error) {
    res.status(500).json({ message: "Error fetching gallery", error: error.message });
  }
};

// Update gallery (can also re-upload images)
export const updateGallery = async (req, res) => {
  try {
    const { title, description, link } = req.body;

    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ message: "Gallery not found" });

    // If new images are uploaded → upload them to Cloudinary
    if (req.files && req.files.length > 0) {
      let uploadedUrls = [];

      for (const file of req.files) {
        const uploadRes = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { folder: "community/gallery", resource_type: "image" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(file.buffer);
        });

        uploadedUrls.push({
          url: uploadRes.secure_url,
          public_id: uploadRes.public_id,
        });
      }

      // Optional: delete old images from Cloudinary if needed
      for (const img of gallery.images) {
        await cloudinary.uploader.destroy(img.public_id);
      }

      gallery.images = uploadedUrls;
    }

    gallery.title = title || gallery.title;
    gallery.description = description || gallery.description;
    gallery.link = link || gallery.link;

    await gallery.save();

    res.status(200).json({
      message: "Gallery updated successfully",
      data: gallery,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating gallery", error: error.message });
  }
};

// Delete gallery
export const deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ message: "Gallery not found" });

    // Delete images from Cloudinary
    for (const img of gallery.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    await gallery.deleteOne();

    res.status(200).json({ message: "Gallery deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting gallery", error: error.message });
  }
};
