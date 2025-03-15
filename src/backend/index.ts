import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

// Import config
import config from "./config/config";

// Import routes
import api from "./routes/apiClientRoutes";
import auth from "./routes/authRoutes";
import behavioralDataRouter from "./routes/behavioralDataRoutes";
import externalDataRouter from "./routes/externalDataRoutes";
import testRouter from "./routes/testRoutes";
import userDataRouter from "./routes/userDataRoutes";
import userDataSourcesRouter from "./routes/userDataSourcesRoutes";
import usersRouter from "./routes/usersRoutes";
import volunteeredDataRouter from "./routes/volunteeredDataRoutes";

// Import middleware
import { authenticateJWT } from "./middleware/auth";

// Import scheduler
import scheduler from "./services/scheduler";

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

// Mount unprotected auth routes (login, signup, and callback) before JWT middleware
app.use("/auth", auth.publicRouter);
app.use("/api", api.publicRouter);

// Apply JWT authentication middleware to all other routes
app.use(authenticateJWT);

// Mount protected routers
app.use("/users", usersRouter);
app.use("/volunteered-data", volunteeredDataRouter);
app.use("/behavioral-data", behavioralDataRouter);
app.use("/external-data", externalDataRouter);
app.use("/user-data", userDataRouter);
app.use("/user-data-sources", userDataSourcesRouter);
app.use("/auth", auth.protectedRouter); // All other auth routes will be protected
app.use("/api", api.protectedRouter);
app.use("/test", testRouter);

// Only start server if run directly
if (require.main === module) {
  const PORT = config.PORT;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Connect to MongoDB
    const mongoUri = config.MONGODB_URI;
    connectDb(mongoUri)
      .then(() => {
        // Start the scheduler after database connection is established
        const isDev = config.NODE_ENV === "development";
        scheduler.startScheduler({
          // Use a more frequent schedule in development for testing
          cronExpression: isDev ? "*/5 * * * *" : "0 2 * * *",
          // TODO: add config for this
          enabled: process.env.DISABLE_SCHEDULER !== "true",
          // Using default runImmediately: false to prevent unnecessary API calls on server restarts
        });
      })
      .catch(console.error);
  });
}

export default app;
