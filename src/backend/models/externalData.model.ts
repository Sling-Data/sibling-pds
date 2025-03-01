import mongoose, { Schema, Document, Types } from "mongoose";

interface ExternalData extends Document {
  userId: Types.ObjectId;
  source: string;
  data: any;
  timestamp: Date;
}

const ExternalDataSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  source: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<ExternalData>("ExternalData", ExternalDataSchema);
