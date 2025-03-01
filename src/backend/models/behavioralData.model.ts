import mongoose, { Schema, Document, Types } from "mongoose";

interface BehavioralData extends Document {
  userId: Types.ObjectId;
  action: string;
  context: any;
  timestamp: Date;
}

const BehavioralDataSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  context: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<BehavioralData>(
  "BehavioralData",
  BehavioralDataSchema
);
