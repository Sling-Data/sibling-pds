import mongoose, { Schema, Document } from "mongoose";

interface User extends Document {
  name: string;
  email: string;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
});

export default mongoose.model<User>("User", UserSchema);
