import mongoose, { Schema, Document, Types } from "mongoose";

interface EncryptedData {
  iv: string;
  content: string;
}

interface ExternalData extends Document {
  userId: Types.ObjectId;
  source: string;
  data: EncryptedData;
}

const EncryptedDataSchema = new Schema(
  {
    iv: { type: String, required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const ExternalDataSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  source: { type: String, required: true },
  data: { type: EncryptedDataSchema, required: true },
});

export default mongoose.model<ExternalData>("ExternalData", ExternalDataSchema);
