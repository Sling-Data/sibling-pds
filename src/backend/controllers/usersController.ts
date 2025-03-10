import { Request, Response } from "express";
import UserModel from "../models/UserModel";
import { Document } from "mongoose";
import { EncryptedData, encrypt, decrypt } from "../utils/encryption";
import { AppError } from "../middleware/errorHandler";
import { saveUser, updateUserPassword } from "../utils/userUtils";

// Types
interface UserDocument extends Document {
  name: EncryptedData;
  email: EncryptedData;
  password?: EncryptedData;
}

interface UserRequest {
  name: string;
  email: string;
  password?: string;
}

// Controller functions
export const createUser = async (
  req: Request<{}, {}, UserRequest>,
  res: Response
) => {
  const { name, email, password } = req.body;
  if (!name || !email) {
    throw new AppError("Name and email are required", 400);
  }

  // Use the saveUser utility function which handles password hashing and encryption
  const savedUser = await saveUser(name, email, password);

  res.status(201).json({
    _id: savedUser._id,
    name: savedUser.name,
    email: savedUser.email,
  });
};

export const getUser = async (req: Request<{ id: string }>, res: Response) => {
  const user = await UserModel.findById<UserDocument>(req.params.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const decryptedName = decrypt(user.name);
  const decryptedEmail = decrypt(user.email);
  res.json({ _id: user._id, name: decryptedName, email: decryptedEmail });
};

export const updateUser = async (
  req: Request<{ id: string }, {}, UserRequest>,
  res: Response
) => {
  const { name, email, password } = req.body;
  if (!name || !email) {
    throw new AppError("Name and email are required", 400);
  }

  const user = await UserModel.findById<UserDocument>(req.params.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const encryptedName = encrypt(name);
  const encryptedEmail = encrypt(email);

  // Create update object
  const updateData: any = {
    name: encryptedName,
    email: encryptedEmail,
  };

  // If password is provided, update it
  if (password) {
    // Update password separately using the utility function
    await updateUserPassword(req.params.id, password);
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  if (!updatedUser) {
    throw new AppError("Failed to update user", 500);
  }

  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
  });
};
