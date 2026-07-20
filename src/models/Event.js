import { Schema, model } from "mongoose";

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["published", "cancelled"], default: "published" },
  },
  { timestamps: true }
);

export const Event = model("Event", eventSchema);
