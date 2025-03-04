import mongoose, { Schema, Document, Types } from "mongoose";

interface EncryptedData {
  iv: string;
  content: string;
}

interface VolunteeredData extends Document {
  userId: Types.ObjectId;
  type: string;
  value: EncryptedData;
}

const EncryptedDataSchema = new Schema(
  {
    iv: { type: String, required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const VolunteeredDataSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  value: { type: EncryptedDataSchema, required: true },
});

export default mongoose.model<VolunteeredData>(
  "VolunteeredData",
  VolunteeredDataSchema
);
