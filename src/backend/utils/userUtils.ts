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
 * Save a user with encrypted name, email, and password
 * @param name User's name
 * @param email User's email
 * @param password User's password
 * @returns Saved user document
 */
export const saveUser = async (
  name: string,
  email: string,
  password: string
) => {
  const encryptedName = encrypt(name);
  const encryptedEmail = encrypt(email);

  // Hash the password with bcrypt, then encrypt the hash
  const hashedPassword = await hashPassword(password);
  const encryptedPassword = encrypt(hashedPassword);

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
