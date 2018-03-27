import joi from 'joi';

// POST /v1/auth/register
export const register = {
  body: {
    email: joi.string().email().required(),
    password: joi.string().required().min(6).max(128)
  }
};

// POST /v1/auth/login
export const login = {
  body: {
    email: joi.string().email().required(),
    password: joi.string().required().min(6).max(128)
  }
};

// POST /v1/auth/facebook
// POST /v1/auth/google
export const oAuth = {
  body: {
    access_token: joi.string().required()
  }
};

// POST /v1/auth/refresh
export const refresh = {
  body: {
    email: joi.string().email().required(),
    refreshToken: joi.string().required()
  }
};