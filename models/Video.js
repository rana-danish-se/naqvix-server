import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true },
    youtubeUrl: { type: String, required: true },
    youtubeId: { type: String, required: true }, // extracted ID for frontend embed
    thumbnailUrl: { type: String }, // can be auto generated
  },
  { timestamps: true }
);

export default mongoose.model("Video", videoSchema);
