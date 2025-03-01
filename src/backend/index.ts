import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import User from "./models/user.model";
import VolunteeredData from "./models/volunteeredData.model";
import BehavioralData from "./models/behavioralData.model";
import ExternalData from "./models/externalData.model";

const app = express();
app.use(cors());
app.use(express.json());

let isConnected = false;

export const connectDb = async (uri: string) => {
  if (!isConnected) {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("Connected to MongoDB");
  }
};

export const disconnectDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  isConnected = false;
};

app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }
    const user = new User({ name, email });
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve user" });
  }
});

// New data type routes
app.post("/volunteered-data", async (req, res) => {
  try {
    const { userId, type, value } = req.body;
    if (!userId || !type || value === undefined) {
      res.status(400).json({ error: "userId, type, and value are required" });
      return;
    }
    const volunteeredData = new VolunteeredData({ userId, type, value });
    const savedData = await volunteeredData.save();
    await User.findByIdAndUpdate(userId, {
      $push: { volunteeredData: savedData._id },
    });
    res.status(201).json(savedData);
  } catch (error) {
    res.status(500).json({ error: "Failed to create volunteered data" });
  }
});

app.post("/behavioral-data", async (req, res) => {
  try {
    const { userId, action, context } = req.body;
    if (!userId || !action || context === undefined) {
      res
        .status(400)
        .json({ error: "userId, action, and context are required" });
      return;
    }
    const behavioralData = new BehavioralData({ userId, action, context });
    const savedData = await behavioralData.save();
    await User.findByIdAndUpdate(userId, {
      $push: { behavioralData: savedData._id },
    });
    res.status(201).json(savedData);
  } catch (error) {
    res.status(500).json({ error: "Failed to create behavioral data" });
  }
});

app.post("/external-data", async (req, res) => {
  try {
    const { userId, source, data } = req.body;
    if (!userId || !source || data === undefined) {
      res.status(400).json({ error: "userId, source, and data are required" });
      return;
    }
    const externalData = new ExternalData({ userId, source, data });
    const savedData = await externalData.save();
    await User.findByIdAndUpdate(userId, {
      $push: { externalData: savedData._id },
    });
    res.status(201).json(savedData);
  } catch (error) {
    res.status(500).json({ error: "Failed to create external data" });
  }
});

app.get("/user-data/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "volunteeredData behavioralData externalData"
    );
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      user: { name: user.name, email: user.email },
      volunteeredData: user.volunteeredData,
      behavioralData: user.behavioralData,
      externalData: user.externalData,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve user data" });
  }
});

// Only start server if run directly
if (require.main === module) {
  require("dotenv").config();
  connectDb(process.env.MONGO_URI as string).catch((err) =>
    console.error("MongoDB connection error:", err)
  );
  app.listen(3000, () => {
    console.log("Backend running on port 3000");
  });
}

export default app;
