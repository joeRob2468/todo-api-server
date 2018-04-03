import express from 'express';
import validate from 'express-validation';
import * as controller from '../../controllers/user.controller';
import * as rules from '../../validations/user.validation';
import { authorize, ADMIN, LOGGED_USER } from '../../middlewares/auth';

const router = express.Router();

/**
 * Load user when API with userId route parameter is hit
 */
router.param('userId', controller.load);

router
  .route('/')
  /**
  * @api {get} /users List Users
  * @apiDescription Get a list of users
  * @apiGroup User
  * @apiPermission admin
  * 
  * @apiHeader {String} Authorization  User's access token
  *
  * @apiParam  {Number{1-any}} [skip=1]   Number of users to skip
  * @apiParam  {Number{1-500}} [limit=100]  Limit of users to return
  *
  * @apiSuccess {Object[]} users List of users.
  * 
  * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
  * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
  */
  .get(authorize(ADMIN), validate(rules.list), controller.list)
  /**
   * @api {post} /users Create User
   * @apiDescription Create a new user
   * @apiGroup User
   * @apiPermission admin
   * 
   * @apiHeader {String} Authorization  User's access token
   * 
   * @apiParam {String} email User's email
   * @apiParam {String{6...128}} password User's password
   * @apiParam {String{...128}} [name] User's name
   * @apiParam  {String=user,admin} [role] User's role
   * 
   * @apiSuccess (Created 201) {String}  id         User's id
   * @apiSuccess (Created 201) {String}  name       User's name
   * @apiSuccess (Created 201) {String}  email      User's email
   * @apiSuccess (Created 201) {String}  role       User's role
   * @apiSuccess (Created 201) {Date}    createdAt  Timestamp
   * 
   * @apiError (Bad Request 400)   ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401)  Unauthorized     Only authenticated users can create the data
   * @apiError (Forbidden 403)     Forbidden        Only admins can create the data
   */
  .post(authorize(ADMIN), validate(rules.create), controller.create);

router
  .route('/profile')
  /**
   * @api {get} /users/profile User Profile
   * @apiDescription Get logged in user profile information
   * @apiGroup User
   * @apiPermission user
   * 
   * @apiHeader {String} Authorization User's access token
   * 
   * @apiSuccess {String}  id         User's id
   * @apiSuccess {String}  name       User's name
   * @apiSuccess {String}  email      User's email
   * @apiSuccess {String}  role       User's role
   * @apiSuccess {Date}    createdAt  Timestamp
   * 
   * @apiError (Unauthorized 401)  Unauthorized     Only authenticated users can access the data
   */
  .get(authorize(), controller.loggedIn);

router
  .route('/:userId')
  /**
   * @api {get} /users/:id Get User
   * @apiDescription Get user information
   * @apiGroup User
   * @apiPermission user
   * 
   * @apiHeader {String} Authorization User's access token
   * 
   * @apiSuccess {String}  id         User's id
   * @apiSuccess {String}  name       User's name
   * @apiSuccess {String}  email      User's email
   * @apiSuccess {String}  role       User's role
   * @apiSuccess {Date}    createdAt  Timestamp
   * 
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can access the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can access the data
   * @apiError (Not Found 404)    NotFound     User does not exist
   */
  .get(authorize(LOGGED_USER), controller.get)
  /**
   * @api {put} /users/:id Replace User
   * @apiDescription Replace the whole user document with a new one
   * @apiGroup User
   * @apiPermission user
   * 
   * @apiHeader {String} Authorization User's access token
   * 
   * @apiParam  {String}             email     User's email
   * @apiParam  {String{6..128}}     password  User's password
   * @apiParam  {String{..128}}      [name]    User's name
   * @apiParam  {String=user,admin}  [role]    User's role
   * (You must be an admin to change the user's role)
   * 
   * @apiSuccess {String}  id         User's id
   * @apiSuccess {String}  name       User's name
   * @apiSuccess {String}  email      User's email
   * @apiSuccess {String}  role       User's role
   * @apiSuccess {Date}    createdAt  Timestamp
   * 
   * @apiError (Bad Request 400) ValidationError Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can access the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can access the data
   * @apiError (Not Found 404)    NotFound     User does not exist
   */
  .put(authorize(LOGGED_USER), validate(rules.replace), controller.replace)
  /**
   * @api {patch} /users/:id Update User
   * @apiDescription Update some fields of a user document
   * @apiGroup User
   * @apiPermission user
   * 
   * @apiHeader {String} Authorization User's access token
   * 
   * @apiParam  {String}             email     User's email
   * @apiParam  {String{6..128}}     password  User's password
   * @apiParam  {String{..128}}      [name]    User's name
   * @apiParam  {String=user,admin}  [role]    User's role
   * (You must be an admin to change the user's role)
   * 
   * @apiSuccess {String}  id         User's id
   * @apiSuccess {String}  name       User's name
   * @apiSuccess {String}  email      User's email
   * @apiSuccess {String}  role       User's role
   * @apiSuccess {Date}    createdAt  Timestamp
   * 
   * @apiError (Bad Request 400) ValidationError Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can access the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can access the data
   * @apiError (Not Found 404)    NotFound     User does not exist
   */
  .patch(authorize(LOGGED_USER), validate(rules.update), controller.update)
  /** 
   * @api {delete} /users/:id Delete User
   * @apiDescription Delete a user
   * @apiGroup User
   * @apiPermission user
   * 
   * @apiHeader {String} Authorization User's access token
   * 
   * @apiSuccess (No Content 204) Successfully deleted
   * 
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can delete the data
   * @apiError (Forbidden 403) Forbidden Only user with same id or admins can delete the data
   * @apiError (Not Found 404) NotFound User does not exist
   */
  .delete(authorize(LOGGED_USER), controller.remove);

export default router;