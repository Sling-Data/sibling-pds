import mongoose, { Document, Schema } from "mongoose";
import * as encryption from "../utils/encryption";

// Enum for supported data source types
export enum DataSourceType {
  GMAIL = "gmail",
  PLAID = "plaid",
}

// Interface for the encrypted credentials
export interface EncryptedCredentials extends encryption.EncryptedData {}

// Interface for the document
export interface UserDataSourceDocument extends Document {
  userId: mongoose.Types.ObjectId;
  dataSourceType: DataSourceType;
  credentials: EncryptedCredentials;
  lastIngestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for creating a new data source
export interface CreateUserDataSource {
  userId: string;
  dataSourceType: DataSourceType;
  credentials: string | object;
}

const userDataSourcesSchema = new Schema<UserDataSourceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dataSourceType: {
      type: String,
      enum: {
        values: Object.values(DataSourceType),
        message: "{VALUE} is not a supported data source type",
      },
      required: true,
    },
    credentials: {
      iv: { type: String, required: true },
      content: { type: String, required: true },
    },
    lastIngestedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique combination of userId and dataSourceType
userDataSourcesSchema.index({ userId: 1, dataSourceType: 1 }, { unique: true });

// Static methods for credential management
userDataSourcesSchema.statics.storeCredentials = async function (
  userId: string,
  dataSourceType: DataSourceType,
  credentials: string | object
): Promise<UserDataSourceDocument> {
  // Convert credentials to string if it's an object
  const credentialsString =
    typeof credentials === "string" ? credentials : JSON.stringify(credentials);

  const encryptedCredentials = encryption.encrypt(credentialsString);

  // Validate dataSourceType before proceeding
  if (!Object.values(DataSourceType).includes(dataSourceType)) {
    throw new Error(`Invalid data source type: ${dataSourceType}`);
  }

  return this.findOneAndUpdate(
    { userId, dataSourceType },
    {
      userId,
      dataSourceType,
      credentials: encryptedCredentials,
      $setOnInsert: { lastIngestedAt: null },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );
};

userDataSourcesSchema.statics.getCredentials = async function (
  userId: string,
  dataSourceType: DataSourceType
): Promise<string | null> {
  const dataSource = await this.findOne({ userId, dataSourceType });
  if (!dataSource) return null;

  const decrypted = encryption.decrypt(dataSource.credentials);
  try {
    // Try to parse the decrypted string as JSON
    return JSON.parse(decrypted);
  } catch {
    // If parsing fails, return the raw string
    return decrypted;
  }
};

// Create and export the model
const UserDataSourcesModel = mongoose.model<
  UserDataSourceDocument,
  mongoose.Model<UserDataSourceDocument> & {
    storeCredentials(
      userId: string,
      dataSourceType: DataSourceType,
      credentials: string | object
    ): Promise<UserDataSourceDocument>;
    getCredentials(
      userId: string,
      dataSourceType: DataSourceType
    ): Promise<string | null>;
  }
>("UserDataSources", userDataSourcesSchema);

export default UserDataSourcesModel;
