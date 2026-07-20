import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "organizer", "admin"], default: "user" },
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
