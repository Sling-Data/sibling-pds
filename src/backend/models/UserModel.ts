import mongoose, { Schema, Document, Types } from "mongoose";

interface EncryptedData {
  iv: string;
  content: string;
}

interface User extends Document {
  name: EncryptedData;
  email: EncryptedData;
  volunteeredData: Types.ObjectId[];
  behavioralData: Types.ObjectId[];
  externalData: Types.ObjectId[];
}

const EncryptedDataSchema = new Schema(
  {
    iv: { type: String, required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const UserSchema: Schema = new Schema({
  name: { type: EncryptedDataSchema, required: true },
  email: { type: EncryptedDataSchema, required: true },
  volunteeredData: [{ type: Schema.Types.ObjectId, ref: "VolunteeredData" }],
  behavioralData: [{ type: Schema.Types.ObjectId, ref: "BehavioralData" }],
  externalData: [{ type: Schema.Types.ObjectId, ref: "ExternalData" }],
});

export default mongoose.model<User>("User", UserSchema);
