import mongoose from "mongoose";
import slugify from "slugify";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true },
    link: { type: String, trim: true },
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

announcementSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug =
      slugify(this.title, { lower: true, strict: true }) +
      "-" +
      Math.random().toString(36).substring(2, 6);
  }
  next();
});

export default mongoose.model("Announcement", announcementSchema);
