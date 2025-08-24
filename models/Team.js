import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    designation: { type: String, required: true },
    image: { type: String, required: true }, 
    cloudinary_id: { type: String, required: true }, 
  },
  { timestamps: true }
);

const Team = mongoose.model("Team", teamSchema);
export default Team;
