import joi from 'joi';
import User from '../models/user.model';

// GET /v1/users
export const listUsers = {
  query: {
    skip: joi.number().min(1),
    limit: joi.number().min(1).max(100),
    name: joi.string(),
    email: joi.string(),
    role: joi.string().valid(User.roles)
  }
};

// POST /v1/users
export const createUser = {
  body: {
    email: joi.string().email().required(),
    password: joi.string().min(6).max(128).required(),
    name: joi.string.max(128),
    role: joi.string().valid(User.roles)
  }
};

// PUT /v1/users/:userId
export const replaceUser = {
  body: {
    email: joi.string().email().required(),
    password: joi.string().min(6).max(128).required(),
    name: joi.string().max(128),
    role: joi.string().valid(User.roles)
  },
  params: {
    userId: joi.string().regex(/^[a-fA-F0-9]{24}$/).required(),
  }
};

 // PATCH /v1/users/:userId
export const updateUser = {
  body: {
    email: joi.string().email(),
    password: joi.string().min(6).max(128),
    name: joi.string().max(128),
    role: joi.string().valid(User.roles),
  },
  params: {
    userId: joi.string().regex(/^[a-fA-F0-9]{24}$/).required(),
  }
};