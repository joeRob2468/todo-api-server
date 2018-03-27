import express from 'express';
import validate from 'express-validation';
import * as controller from '../../controllers/auth.controller';
import * as rules from '../../validations/auth.validation';
import { oAuth as oAuthLogin } from '../../middlewares/auth';

const router = express.Router();

/**
 * @api {post} /auth/register Register
 * @apiDescription Register a new user
 * @apiGroup Auth
 * @apiPermission public
 * 
 * @apiParam {String} email User's email
 * @apiParam {String{6...128}} User's password
 * 
 * @apiSuccess (Created 201) {String} token.tokenType Access Token's type
 * @apiSuccess (Created 201) {String} token.accessToken Authorization Token
 * @apiSuccess (Created 201) {String} token.refreshToken Token to get a new accessToken after expiration time
 * @apiSuccess (Created 201) {Number} token.expiresIn Access Token's expiration time in miliseconds
 * @apiSuccess (Created 201) {String} token.timezone The server's Timezone
 *
 * @apiSuccess (Created 201) {String} user.id         User's id
 * @apiSuccess (Created 201) {String} user.name       User's name
 * @apiSuccess (Created 201) {String} user.email      User's email
 * @apiSuccess (Created 201) {String} user.role       User's role
 * @apiSuccess (Created 201) {Date} user.createdAt  Timestamp
 * 
 * @apiError (Bad Request 400) ValidationError Some parameters may contain invalid values
 */
router.route('/register')
  .post(validate(rules.register), controller.register);

/**
 * @api {post} /auth/login Login
 * @apiDescription Get an accessToken
 * @apiGroup Auth
 * @apiPermission public
 * 
 * @apiParam {String} email User's email
 * @apiParam {String{6...128}} password User's password
 * 
 * @apiSuccess {String} token.tokenType Access Token's type
 * @apiSuccess {String} token.accessToken Authorization Token
 * @apiSuccess {String} token.refreshToken Token to get a new accessToken after expiration time
 * @apiSuccess {String} token.expiresIn Access token's expiration time in milliseconds
 * 
 * @apiSuccess {String} user.id User's id
 * @apiSuccess {String} user.name User's name
 * @apiSuccess {String} user.email User's email
 * @apiSuccess {String} user.role User's role
 * @apiSuccess {Date} user.createdAt Timestamp
 * 
 * @apiError (Bad Request 400) ValidationError Some parameters may contain invalid values
 * @apiError (Unauthorized 401) Unauthorized Incorrect email or password
 */
router.route('/login')
  .post(validate(rules.login), controller.login);

/**
 * @api {post} /auth/refresh-token Refresh Login
 * @apiDescription Refresh expired accessToken
 * @apiGroup Auth
 * @apiPermission public
 * 
 * @apiParam {String} email User's email
 * @apiParam {String} refreshToken Refresh token acquired when user logged in
 * 
 * @apiSuccess {String} tokenType Access Token's type
 * @apiSuccess {String} accessToken Authorization Token
 * @apiSuccess {String} refreshToken Token to get a new accessToken after expiration time
 * @apiSuccess {Number} expiresIn Access Token's expiration time in milliseconds
 * 
 * @apiError (Bad Request 400) ValidationError Some parameters may contain invalid values
 * @apiError (Unauthorized 401) Unauthorized Incorrect email or refresh token
 */
router.route('/refresh-token')
  .post(validate(rules.refresh), controller.refresh);

/**
 * TODO: POST /auth/reset-password
 */

/**
 * @api {post} /auth/facebook Facebook Login
 * @apiDescription Login with facebook. Creates a new user if it does not exist
 * @apiGroup Auth
 * @apiPermission public
 * 
 * @apiSuccess {String} tokenType Access Token's type
 * @apiSuccess {String} accessToken Authorization Token
 * @apiSuccess {String} refreshToken Token to get a new accessToken after expiration time
 * @apiSuccess {Number} expiresIn Access Token's expiration time in milliseconds
 * 
 * @apiError (Bad Request 400) ValidationError Some parameters may contain invalid values
 * @apiError (Unauthorized 401) Unauthorized Incorrect access_token
 */
router.route('/facebook')
  .post(validate(rules.oAuth), oAuthLogin('facebook'), controller.oAuth);

  /**
 * @api {post} /auth/google Google Login
 * @apiDescription Login with google. Creates a new user if it does not exist
 * @apiGroup Auth
 * @apiPermission public
 * 
 * @apiSuccess {String} tokenType Access Token's type
 * @apiSuccess {String} accessToken Authorization Token
 * @apiSuccess {String} refreshToken Token to get a new accessToken after expiration time
 * @apiSuccess {Number} expiresIn Access Token's expiration time in milliseconds
 * 
 * @apiError (Bad Request 400) ValidationError Some parameters may contain invalid values
 * @apiError (Unauthorized 401) Unauthorized Incorrect access_token
 */
router.route('/google')
  .post(validate(rules.oAuth), oAuthLogin('google'), controller.oAuth);

export default router;