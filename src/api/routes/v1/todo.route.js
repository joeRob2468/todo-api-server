import express from 'express';
import validate from 'express-validation';
import * as controller from '../../controllers/todo.controller';
import * as rules from '../../validations/todo.validation';

const router = express.Router();

/**
 * Load user when API with todoId route parameter is hit
 */
//router.param('todoId', controller.load);

router
  .route('/')
   /**
   * @api {get} /todos List Todos
   * @apiDescription Get a list of todos
   * @apiGroup Todo
   *
   * @apiParam  {Number{1-any}}         [page=1]     List page
   * @apiParam  {Number{1-500}}      [perPage=100]  Todos per page
   *
   * @apiSuccess {Object[]} todos List of todos.
   */
  .get(validate(rules.list), controller.list)
  /**
   * @api {post} /todos Create Todo
   * @apiDescription Create a new todo
   * @apiGroup Todo
   * 
   * @apiParam {String} title The task title
   * @apiParam {String} description The task description, or other notes related to the task
   * @apiParam {Date} dueAt The timestamp by which the task must be completed
   * 
   * @apiSuccess {String} id The task ID
   * @apiSuccess {String} title The task title
   * @apiSuccess {String} description The task description, or other notes related to the task
   * @apiSuccess {Date} dueAt The timestamp by which the task must be completed
   */
  .post(validate(rules.create), controller.create);

router
  .route('/:id')
  /**
   * @api {get} /:id Get Todo
   * @apiDescription Get todo by ID
   * @apiGroup Todo
   * 
   * @apiSuccess {String} id The task ID
   * @apiSuccess {String} title The task title
   * @apiSuccess {String} description The task description, or other notes related to the task
   * @apiSuccess {Date} dueAt The timestamp by which the task must be completed
   */
  .get(controller.get)
  /**
   * @api {delete} /:id Delete Todo
   * @apiDescription Delete a todo
   * @apiGroup Todo
   * 
   * @apiSuccess (No Content 204) Successfully deleted
   * 
   * @apiError (Not Found 404) NotFound Todo does not exist
   */
  .delete(controller.remove);


export default router;