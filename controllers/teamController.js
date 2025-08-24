import Team from "../models/Team.js";
import cloudinary from "../configs/cloudinary.js";

// Create a new team member with single image
export const createTeamMember = async (req, res) => {
  try {
    const { name, designation } = req.body;
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    // Upload image to Cloudinary
    const uploadRes = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "team_members" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(req.file.buffer);
    });

    const newMember = new Team({
      name,
      designation,
      image: uploadRes.secure_url,
      cloudinary_id: uploadRes.public_id,
    });

    await newMember.save();
    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all team members
export const getTeamMembers = async (req, res) => {
  try {
    const members = await Team.find();
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single team member
export const getTeamMemberById = async (req, res) => {
  try {
    const member = await Team.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Team member not found" });
    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update team member (optionally update image)
export const updateTeamMember = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      // Upload new image
      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "team_members" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(req.file.buffer);
      });

      updateData.image = uploadRes.secure_url;
      updateData.cloudinary_id = uploadRes.public_id;
    }

    const updatedMember = await Team.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedMember) return res.status(404).json({ message: "Team member not found" });

    res.status(200).json(updatedMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a team member
export const deleteTeamMember = async (req, res) => {
  try {
    const member = await Team.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Team member not found" });

    // Delete image from Cloudinary
    if (member.cloudinary_id) {
      await cloudinary.uploader.destroy(member.cloudinary_id);
    }

    await member.deleteOne();
    res.status(200).json({ message: "Team member deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
