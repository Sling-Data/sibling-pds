import { Request, Response } from "express";
import UserModel from "../models/user.model";
import { Document } from "mongoose";
import { EncryptedData, encrypt, decrypt } from "../utils/encryption";
import { AppError } from "../middleware/errorHandler";

// Types
interface UserDocument extends Document {
  name: EncryptedData;
  email: EncryptedData;
}

interface UserRequest {
  name: string;
  email: string;
}

// Controller functions
export const createUser = async (
  req: Request<{}, {}, UserRequest>,
  res: Response
) => {
  const { name, email } = req.body;
  if (!name || !email) {
    throw new AppError("Name and email are required", 400);
  }

  const encryptedName = encrypt(name);
  const encryptedEmail = encrypt(email);
  const user = new UserModel({ name: encryptedName, email: encryptedEmail });
  const savedUser = await user.save();

  res.status(201).json({
    _id: savedUser._id,
    name: encryptedName,
    email: encryptedEmail,
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
  const { name, email } = req.body;
  if (!name || !email) {
    throw new AppError("Name and email are required", 400);
  }

  const user = await UserModel.findById<UserDocument>(req.params.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const encryptedName = encrypt(name);
  const encryptedEmail = encrypt(email);

  const updatedUser = await UserModel.findByIdAndUpdate(
    req.params.id,
    { name: encryptedName, email: encryptedEmail },
    { new: true }
  );

  if (!updatedUser) {
    throw new AppError("Failed to update user", 500);
  }

  res.status(200).json({
    _id: updatedUser._id,
    name: encryptedName,
    email: encryptedEmail,
  });
};
