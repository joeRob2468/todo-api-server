import httpStatus from 'http-status';
import Todo from '../models/todo.model';

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