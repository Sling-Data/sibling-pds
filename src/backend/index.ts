import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import crypto from "crypto";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

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
const algorithm = "aes-256-cbc";
const key = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, "hex")
  : crypto.randomBytes(32);

if (!process.env.ENCRYPTION_KEY) {
  console.warn(
    "ENCRYPTION_KEY not set in .env, using random key. Set it for production security."
  );
}

const ivLength = 16; // AES-256-CBC requires 16-byte IV

interface EncryptedData {
  iv: string;
  content: string;
}

// Updated User model interface
interface UserDocument extends Document {
  name: EncryptedData;
  email: EncryptedData;
  volunteeredData: Types.ObjectId[];
  behavioralData: Types.ObjectId[];
  externalData: Types.ObjectId[];
}

// Encryption functions
const encrypt = (text: string): EncryptedData => {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    iv: iv.toString("hex"),
    content: encrypted,
  };
};

const decrypt = (encryptedData: EncryptedData): string => {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encryptedData.iv, "hex")
  );
  let decrypted = decipher.update(encryptedData.content, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

// Dynamic connection without TLS
export const connectDb = async (uri: string) => {
  if (!isConnected) {
    try {
      await mongoose.connect(uri);
      isConnected = true;
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error details:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw error;
    }
  }
};

export const disconnectDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  isConnected = false;
};

// Updated API routes with encryption
app.post("/users", async (req: Request, res: Response) => {
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
});

app.get("/users/:id", async (req: Request, res: Response) => {
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
    res.status(201).json({
      _id: savedData._id,
      type: savedData.type,
      userId: savedData.userId,
      value: encryptedValue,
    });
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
    res.status(201).json({
      _id: savedData._id,
      action: savedData.action,
      userId: savedData.userId,
      context: encryptedContext,
    });
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
    res.status(201).json({
      _id: savedData._id,
      source: savedData.source,
      userId: savedData.userId,
      data: encryptedData,
    });
  } catch (error) {
    console.error("Error creating external data:", error);
    res.status(500).json({ error: "Failed to create external data" });
  }
});

app.get("/user-data/:id", async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById<UserDocument>(req.params.id)
      .populate("volunteeredData")
      .populate("behavioralData")
      .populate("externalData");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const decryptedName = decrypt(user.name);
    const decryptedEmail = decrypt(user.email);
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
      user: { _id: user._id, name: decryptedName, email: decryptedEmail },
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
