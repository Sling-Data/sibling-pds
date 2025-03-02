import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { Request, Response } from "express";
import UserModel from "./models/user.model";
import VolunteeredData from "./models/volunteeredData.model";
import BehavioralData from "./models/behavioralData.model";
import ExternalData from "./models/externalData.model";
import { Document, Types } from "mongoose";

const app = express();
app.use(cors());
app.use(express.json());

let isConnected = false;

// Encryption Configuration
const KEY_FILE = path.join(__dirname, "config/encryption_key");
let ENCRYPTION_KEY: Buffer;

try {
  // Try to read existing key
  const keyHex = fs.readFileSync(KEY_FILE, "utf8");
  ENCRYPTION_KEY = Buffer.from(keyHex, "hex");
} catch (error) {
  // Generate new key if none exists
  ENCRYPTION_KEY = crypto.randomBytes(32);
  fs.writeFileSync(KEY_FILE, ENCRYPTION_KEY.toString("hex"), "utf8");
}

const IV_LENGTH = 16;

interface EncryptedData {
  iv: string;
  content: string;
}

// Updated User model interface
interface UserDocument extends Document {
  name: EncryptedData;
  email: string;
  volunteeredData: Types.ObjectId[];
  behavioralData: Types.ObjectId[];
  externalData: Types.ObjectId[];
}

// Encryption functions
function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
  };
}

function decrypt(data: EncryptedData): string {
  const iv = Buffer.from(data.iv, "hex");
  const encryptedText = Buffer.from(data.content, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Dynamic connection
export async function connectDb(uri: string) {
  if (!isConnected) {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("Connected to MongoDB");
  }
}

export async function disconnectDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  isConnected = false;
}

// Updated API routes with encryption
app.post("/users", async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }
    const encryptedName = encrypt(name);
    const user = new UserModel({ name: encryptedName, email });
    const savedUser = await user.save();
    res.status(201).json({
      _id: savedUser._id,
      name: name,
      email: savedUser.email,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById<UserDocument>(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const decryptedName = decrypt(user.name);
    res.json({ _id: user._id, name: decryptedName, email: user.email });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Failed to retrieve user" });
  }
});

app.post("/volunteered-data", async (req: Request, res: Response) => {
  try {
    const { userId, type, value } = req.body;
    if (!userId || !type || value === undefined) {
      res.status(400).json({ error: "userId, type, and value are required" });
      return;
    }
    const encryptedValue = encrypt(value.toString());
    const volunteeredData = new VolunteeredData({
      userId,
      type,
      value: encryptedValue,
    });
    const savedData = await volunteeredData.save();
    await UserModel.findByIdAndUpdate(userId, {
      $push: { volunteeredData: savedData._id },
    });
    res.status(201).json({ _id: savedData._id, type: savedData.type });
  } catch (error) {
    console.error("Error creating volunteered data:", error);
    res.status(500).json({ error: "Failed to create volunteered data" });
  }
});

app.post("/behavioral-data", async (req: Request, res: Response) => {
  try {
    const { userId, action, context } = req.body;
    if (!userId || !action || context === undefined) {
      res
        .status(400)
        .json({ error: "userId, action, and context are required" });
      return;
    }
    const encryptedContext = encrypt(JSON.stringify(context));
    const behavioralData = new BehavioralData({
      userId,
      action,
      context: encryptedContext,
    });
    const savedData = await behavioralData.save();
    await UserModel.findByIdAndUpdate(userId, {
      $push: { behavioralData: savedData._id },
    });
    res.status(201).json({ _id: savedData._id, action: savedData.action });
  } catch (error) {
    console.error("Error creating behavioral data:", error);
    res.status(500).json({ error: "Failed to create behavioral data" });
  }
});

app.post("/external-data", async (req: Request, res: Response) => {
  try {
    const { userId, source, data } = req.body;
    if (!userId || !source || data === undefined) {
      res.status(400).json({ error: "userId, source, and data are required" });
      return;
    }
    const encryptedData = encrypt(JSON.stringify(data));
    const externalData = new ExternalData({
      userId,
      source,
      data: encryptedData,
    });
    const savedData = await externalData.save();
    await UserModel.findByIdAndUpdate(userId, {
      $push: { externalData: savedData._id },
    });
    res.status(201).json({ _id: savedData._id, source: savedData.source });
  } catch (error) {
    console.error("Error creating external data:", error);
    res.status(500).json({ error: "Failed to create external data" });
  }
});

app.get("/user-data/:id", async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById<UserDocument>(req.params.id).populate(
      "volunteeredData behavioralData externalData"
    );
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const decryptedName = decrypt(user.name);
    const volunteeredData = await Promise.all(
      user.volunteeredData.map(async (data: any) => ({
        _id: data._id,
        type: data.type,
        value: decrypt(data.value),
      }))
    );
    const behavioralData = await Promise.all(
      user.behavioralData.map(async (data: any) => ({
        _id: data._id,
        action: data.action,
        context: JSON.parse(decrypt(data.context)),
      }))
    );
    const externalData = await Promise.all(
      user.externalData.map(async (data: any) => ({
        _id: data._id,
        source: data.source,
        data: JSON.parse(decrypt(data.data)),
      }))
    );
    res.json({
      user: { _id: user._id, name: decryptedName, email: user.email },
      volunteeredData,
      behavioralData,
      externalData,
    });
  } catch (error) {
    console.error("Error retrieving user data:", error);
    res.status(500).json({ error: "Failed to retrieve user data" });
  }
});

// Only start server if run directly
if (require.main === module) {
  require("dotenv").config();
  exports
    .connectDb(process.env.MONGO_URI || "mongodb://localhost:27018")
    .catch((err: Error) => console.error("MongoDB connection error:", err));
  app.listen(3000, () => {
    console.log("Backend running on port 3000");
  });
}

export default app;
