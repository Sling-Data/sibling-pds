import bcrypt from "bcrypt";
import UserModel from "../models/UserModel";
import { encrypt } from "./encryption";

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Save a user with encrypted name, email, and optionally a password
 * @param name User's name
 * @param email User's email
 * @param password Optional password (will use default if not provided)
 * @returns Saved user document
 */
export const saveUser = async (
  name: string,
  email: string,
  password?: string
) => {
  const encryptedName = encrypt(name);
  const encryptedEmail = encrypt(email);

  // If password is provided, hash it and encrypt it
  // Otherwise use a temporary default password
  let encryptedPassword;
  if (password) {
    // First hash the password with bcrypt, then encrypt the hash
    const hashedPassword = await hashPassword(password);
    encryptedPassword = encrypt(hashedPassword);
  } else {
    // Create a temporary default password
    const defaultPassword = await hashPassword("temporary_" + Date.now());
    encryptedPassword = encrypt(defaultPassword);
  }

  const user = new UserModel({
    name: encryptedName,
    email: encryptedEmail,
    password: encryptedPassword,
  });

  return await user.save();
};

/**
 * Update a user's password
 * @param userId User ID
 * @param newPassword New password
 * @returns Updated user document
 */
export const updateUserPassword = async (
  userId: string,
  newPassword: string
) => {
  // First hash the password with bcrypt, then encrypt the hash
  const hashedPassword = await hashPassword(newPassword);
  const encryptedPassword = encrypt(hashedPassword);

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { password: encryptedPassword },
    { new: true }
  );

  return updatedUser;
};
