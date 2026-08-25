import { Schema, model } from "mongoose";

const ticketSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    status: { type: String, enum: ["confirmed", "pending", "cancelled"], default: "confirmed" },
    quantity: { type: Number, required: true, min: 1 },
    reservationCode: { type: String, required: true, unique: true },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

export const Ticket = model("Ticket", ticketSchema);
