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
 * Replace a todo by ID
 * @public
 */
export const replace = async (req, res, next) => {
  try {
    const todo = await Todo.get(req.params.id);
    
    // remove _id and assign the new object to newTodo.
    // technically, it creates a new variable called _id, but we won't use that.
    // this is an es6 replacement for lodash's omit.
    const {_id, ...newTodo} = req.body;

    await todo.update(newTodo, {override: true, upsert: true});
    const savedTodo = await Todo.findById(todo._id);

    res.json(savedTodo.transform());
  } catch (error) {
    next(error);
  }
};

/** 
 * Update a todo by ID
 * @public
 */
export const update = async (req, res, next) => {
  try {
    const todo = await Todo.get(req.params.id);
    const updatedTodo = Object.assign(todo, req.body);

    await updatedTodo.save();
    res.json(updatedTodo.transform());
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