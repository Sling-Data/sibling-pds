import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

// Import routes
import usersRouter from "./routes/users";
import volunteeredDataRouter from "./routes/volunteeredData";
import behavioralDataRouter from "./routes/behavioralData";
import externalDataRouter from "./routes/externalData";
import userDataRouter from "./routes/userData";
import userDataSourcesRouter from "./routes/userDataSources";
import authRouter from "./routes/authRoutes";
import testRouter from "./routes/testRoutes";
const app = express();
app.use(cors());
app.use(express.json());

let isConnected = false;

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

// Mount routers
app.use("/users", usersRouter);
app.use("/volunteered-data", volunteeredDataRouter);
app.use("/behavioral-data", behavioralDataRouter);
app.use("/external-data", externalDataRouter);
app.use("/user-data", userDataRouter);
app.use("/user-data-sources", userDataSourcesRouter);
app.use("/auth", authRouter);
app.use("/test", testRouter);

// Only start server if run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27018/sibling-pds";
    connectDb(mongoUri).catch(console.error);
  });
}

export default app;
