import Video from "../models/Video.js";

// Utility to extract YouTube ID
const extractYouTubeId = (url) => {
  const match =
    url.match(/(?:v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/) || [];
  return match[1] || "";
};

// Create
export const createVideo = async (req, res) => {
  try {
    const { title, description, youtubeUrl } = req.body;
    const youtubeId = extractYouTubeId(youtubeUrl);
    const thumbnailUrl = youtubeId
      ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
      : "";

    const video = await Video.create({
      title,
      description,
      youtubeUrl,
      youtubeId,
      thumbnailUrl,
    });

    res.status(201).json(video);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get All
export const getVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get One
export const getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Not found" });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update
export const updateVideo = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    let updateData = { ...req.body };

    if (youtubeUrl) {
      const youtubeId = extractYouTubeId(youtubeUrl);
      updateData.youtubeId = youtubeId;
      updateData.thumbnailUrl = youtubeId
        ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
        : "";
    }

    const video = await Video.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.json(video);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete
export const deleteVideo = async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
