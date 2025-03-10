import { Request, Response, NextFunction } from "express";
import Joi from "joi";

/**
 * Middleware factory for validating request data using Joi schemas
 * @param schema - Joi schema for validation
 * @param property - Request property to validate (body, params, query)
 * @returns Express middleware function
 */
export const validate = (
  schema: Joi.ObjectSchema,
  property: "body" | "params" | "query" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown properties
    });

    if (!error) {
      next();
    } else {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      res.status(400).json({
        status: "error",
        message: "Validation error",
        details: errorMessage,
      });
    }
  };
};

/**
 * Common validation schemas
 */
export const schemas = {
  // User ID validation schema
  userId: Joi.object({
    userId: Joi.string().required().messages({
      "string.empty": "userId cannot be empty",
      "any.required": "userId is required",
    }),
  }),

  // Login validation schema
  login: Joi.object({
    userId: Joi.string().required().messages({
      "string.empty": "userId cannot be empty",
      "any.required": "userId is required",
    }),
    password: Joi.string().required().messages({
      "string.empty": "password cannot be empty",
      "any.required": "password is required",
    }),
  }),

  // Signup validation schema
  signup: Joi.object({
    name: Joi.string().required().messages({
      "string.empty": "name cannot be empty",
      "any.required": "name is required",
    }),
    email: Joi.string().email().required().messages({
      "string.empty": "email cannot be empty",
      "string.email": "email must be a valid email address",
      "any.required": "email is required",
    }),
    password: Joi.string().min(8).required().messages({
      "string.empty": "password cannot be empty",
      "string.min": "password must be at least 8 characters long",
      "any.required": "password is required",
    }),
  }),

  // Gmail auth validation schema
  gmailAuth: Joi.object({
    userId: Joi.string().required().messages({
      "string.empty": "userId cannot be empty",
      "any.required": "userId is required",
    }),
  }),

  // Plaid auth validation schema
  plaidAuth: Joi.object({
    userId: Joi.string().required().messages({
      "string.empty": "userId cannot be empty",
      "any.required": "userId is required",
    }),
  }),

  // Plaid callback validation schema
  plaidCallback: Joi.object({
    public_token: Joi.string().required().messages({
      "string.empty": "public_token cannot be empty",
      "any.required": "public_token is required",
    }),
    userId: Joi.string().required().messages({
      "string.empty": "userId cannot be empty",
      "any.required": "userId is required",
    }),
  }),

  // Add refreshToken schema
  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      "string.empty": "refreshToken cannot be empty",
      "any.required": "refreshToken is required",
    }),
  }),
};
