import { Request, Response } from "express";
import UserModel from "../models/user.model";
import { Document } from "mongoose";
import { EncryptedData, encrypt, decrypt } from "../utils/encryption";

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
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
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
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const getUser = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = await UserModel.findById<UserDocument>(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const decryptedName = decrypt(user.name);
    const decryptedEmail = decrypt(user.email);
    res.json({ _id: user._id, name: decryptedName, email: decryptedEmail });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Failed to retrieve user" });
  }
};

export const updateUser = async (
  req: Request<{ id: string }, {}, UserRequest>,
  res: Response
) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }

    const user = await UserModel.findById<UserDocument>(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const encryptedName = encrypt(name);
    const encryptedEmail = encrypt(email);

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      { name: encryptedName, email: encryptedEmail },
      { new: true }
    );

    if (!updatedUser) {
      res.status(500).json({ error: "Failed to update user" });
      return;
    }

    res.status(200).json({
      _id: updatedUser._id,
      name: encryptedName,
      email: encryptedEmail,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};
