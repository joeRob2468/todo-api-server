import express from 'express';
import validate from 'express-validation';
import * as controller from '../../controllers/todo.controller';
import * as rules from '../../validations/todo.validation';
import { authorize, ADMIN, LOGGED_USER } from '../../middlewares/auth';

const router = express.Router({mergeParams: true});

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
  .get(authorize(LOGGED_USER), validate(rules.list), controller.list)
  /**
   * @api {post} /todos Create Todo
   * @apiDescription Create a new todo
   * @apiGroup Todo
   * 
   * @apiParam {String} user The author user's ID
   * @apiParam {String} title The task title
   * @apiParam {String} [description] The task description, or other notes related to the task
   * @apiParam {Boolean} [completed] Marks the task as completed
   * @apiParam {Date} dueAt The timestamp by which the task must be completed
   * 
   * @apiSuccess {String} id The task ID
   * @apiSuccess {String} user The author user's ID
   * @apiSuccess {String} title The task title
   * @apiSuccess {String} [description] The task description, or other notes related to the task
   * @apiSuccess {Boolean} [completed] Marks the task as completed
   * @apiSuccess {Date} dueAt The timestamp by which the task must be completed
   * 
   * @apiError (Bad Request 400) ValidationError Some parameters may contain invalid values
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   */
  .post(authorize(LOGGED_USER), validate(rules.create), controller.create);

router
  .route('/:id')
  /**
   * @api {get} /:id Get Todo
   * @apiDescription Get todo by ID
   * @apiGroup Todo
   * 
   * @apiSuccess {String} id The task ID
   * @apiSuccess {String} user The author user's ID
   * @apiSuccess {String} title The task title
   * @apiSuccess {String} [description] The task description, or other notes related to the task
   * @apiSuccess {Boolean} [completed] Marks the task as completed
   * @apiSuccess {Date} dueAt The timestamp by which the task must be completed
   * 
   * @apiError (Not Found 404) NotFound Todo does not exist
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   */
  .get(authorize(LOGGED_USER), controller.get)
  /**
   * @api {put} /:id Replace Todo
   * @apiDescription Replace the entire todo document with a new one
   * @apiGroup Todo
   * 
   * @apiParam {String} user The author user's ID
   * @apiParam {String} title The task title
   * @apiParam {String} [description] The task description, or other notes related to the task
   * @apiParam {Boolean} [completed] Marks the task as completed
   * @apiParam {Date} dueAt The timestamp by which the task must be completed
   * 
   * @apiSuccess {String} id The task ID
   * @apiSuccess {String} user The author user's ID
   * @apiSuccess {String} title The task title
   * @apiSuccess {String} [description] The task description, or other notes related to the task
   * @apiSuccess {Boolean} [completed] Marks the task as completed
   * @apiSuccess {Date} dueAt The timestamp by which the task must be completed
   * 
   * @apiError (Bad Request 400) ValidationError Some parameters may contain invalid values
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   * @apiError (Not Found 404) NotFound Todo does not exist
   */
  .put(authorize(LOGGED_USER), validate(rules.replace), controller.replace)
  /**
   * @api {patch} /:id Update Todo
   * @apiDescription Update the todo
   * @apiGroup Todo
   * 
   * @apiParam {String} [user] The author user's ID
   * @apiParam {String} [title] The task title
   * @apiParam {String} [description] The task description, or other notes related to the task
   * @apiParam {Boolean} [completed] Marks the task as completed
   * @apiParam {Date} [dueAt] The timestamp by which the task must be completed
   * 
   * @apiSuccess {String} id The task ID
   * @apiSuccess {String} user The author user's ID
   * @apiSuccess {String} title The task title
   * @apiSuccess {String} [description] The task description, or other notes related to the task
   * @apiSuccess {Boolean} [completed] Marks the task as completed
   * @apiSuccess {Date} dueAt The timestamp by which the task must be completed
   * 
   * @apiError (Bad Request 400) ValidationError Some parameters may contain invalid values
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   * @apiError (Not Found 404) NotFound User does not exist
   */
  .patch(authorize(LOGGED_USER), validate(rules.update), controller.update)
  /**
   * @api {delete} /:id Delete Todo
   * @apiDescription Delete a todo
   * @apiGroup Todo
   * 
   * @apiSuccess (No Content 204) Successfully deleted
   * 
   * @apiError (Not Found 404) NotFound Todo does not exist
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   */
  .delete(authorize(LOGGED_USER), controller.remove);


export default router;