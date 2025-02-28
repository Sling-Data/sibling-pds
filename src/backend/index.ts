import express, { Request, Response, RequestHandler } from "express";
import cors from "cors";
import mongoose from "mongoose";
import User from "./user.model";
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const getRoot: RequestHandler = (req, res) => {
  res.json({ message: "Hello, Sibling!" });
};

const createUser: RequestHandler = async (req, res) => {
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
};

const getUserById: RequestHandler = async (req, res) => {
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
};

app.get("/", getRoot);
app.post("/users", createUser);
app.get("/users/:id", getUserById);

app.listen(3000, () => {
  console.log("Backend running on port 3000");
});
