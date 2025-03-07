import mongoose, { Schema, Document, Types } from "mongoose";

interface EncryptedData {
  iv: string;
  content: string;
}

interface BehavioralData extends Document {
  userId: Types.ObjectId;
  action: string;
  context: EncryptedData;
}

const EncryptedDataSchema = new Schema(
  {
    iv: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const BehavioralDataSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  context: {
    type: EncryptedDataSchema,
    required: true,
  },
});

export default mongoose.model<BehavioralData>(
  "BehavioralData",
  BehavioralDataSchema
);
