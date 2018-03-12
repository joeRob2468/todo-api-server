import joi from 'joi';

// GET /v1/todos
export const list = {
  query: {
    page: joi.number().min(1),
    perPage: joi.number().min(1).max(200)
  }
};