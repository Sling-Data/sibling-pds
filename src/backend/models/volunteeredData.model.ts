import mongoose, { Schema, Document, Types } from "mongoose";

interface VolunteeredData extends Document {
  userId: Types.ObjectId;
  type: string;
  value: any;
  timestamp: Date;
}

const VolunteeredDataSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  value: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<VolunteeredData>(
  "VolunteeredData",
  VolunteeredDataSchema
);
