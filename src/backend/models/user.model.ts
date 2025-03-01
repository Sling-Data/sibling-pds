import mongoose, { Schema, Document, Types } from "mongoose";

interface User extends Document {
  name: string;
  email: string;
  volunteeredData: Types.ObjectId[];
  behavioralData: Types.ObjectId[];
  externalData: Types.ObjectId[];
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  volunteeredData: [{ type: Schema.Types.ObjectId, ref: "VolunteeredData" }],
  behavioralData: [{ type: Schema.Types.ObjectId, ref: "BehavioralData" }],
  externalData: [{ type: Schema.Types.ObjectId, ref: "ExternalData" }],
});

export default mongoose.model<User>("User", UserSchema);
