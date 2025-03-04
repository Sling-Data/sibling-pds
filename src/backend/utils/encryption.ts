import crypto from "crypto";

export interface EncryptedData {
  iv: string;
  content: string;
}

// Encryption Configuration
const algorithm = "aes-256-cbc";
const key = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, "hex")
  : crypto.randomBytes(32);
const ivLength = 16;

export const encrypt = (text: string): EncryptedData => {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    iv: iv.toString("hex"),
    content: encrypted,
  };
};

export const decrypt = (encryptedData: EncryptedData): string => {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encryptedData.iv, "hex")
  );
  let decrypted = decipher.update(encryptedData.content, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
