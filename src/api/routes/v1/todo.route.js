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
   * @apiVersion 1.0.0
   * @apiName ListTodos
   * @apiGroup Todo
   *
   * @apiParam  {Number{1-any}}         [page=1]     List page
   * @apiParam  {Number{1-500}}      [perPage=100]  Todos per page
   *
   * @apiSuccess {Object[]} todos List of todos.
   */
  .get(validate(rules.list), controller.list);

export default router;