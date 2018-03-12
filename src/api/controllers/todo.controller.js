import httpStatus from 'http-status';
import Todo from '../models/todo.model';

/** 
 * Create a new todo
 * @public
 */
export const create = async (req, res, next) => {
  try {
    const todo = new Todo(req.body);
    const savedUser = await todo.save();
    res.status(httpStatus.CREATED);
    res.json(savedUser.transform());
  } catch (error) {
    next(error);
  }
};

/**
 * Get a todo by ID
 * @public
 */
export const get = async (req, res, next) => {
  try {
    const todo = await Todo.get(req.params.id);
    res.json(todo.transform());
  } catch (error) {
    next(error);
  }
};

 /**
 * Get list of todos
 * @public
 */
export const list = async (req, res, next) => {
  try {
    const todos = await Todo.list(req.query);
    const transformedTodos = todos.map(todo => todo.transform());
    res.json(transformedTodos);
  } catch (error) {
    next(error);
  }
};

/**
  * Remove a todo by ID
  * @public
  */
export const remove = async (req, res, next) => {
  try {
    const todo = await Todo.get(req.params.id);
    await todo.remove();
    res.status(httpStatus.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};