import joi from 'joi';

// GET /v1/todos
export const list = {
  query: {
    page: joi.number().min(1),
    perPage: joi.number().min(1).max(200)
  }
};

// POST /v1/todos
export const create = {
  body: {
    title: joi.string().required(),
    description: joi.string().required(),
    dueAt: joi.date().timestamp().required()
  }
};

// PUT /v1/todos/:id
export const replace = {
  body: {
    title: joi.string().required(),
    description: joi.string().required(),
    dueAt: joi.date().timestamp().required()
  },
  params: {
    id: joi.string().regex(/^[a-fA-F0-9]{24}$/).required()
  }
};

// PATCH /v1/todos/:id
export const update = {
  body: {
    title: joi.string(),
    description: joi.string(),
    dueAt: joi.date().timestamp()
  },
  params: {
    id: joi.string().regex(/^[a-fA-F0-9]{24}$/).required()
  }
};