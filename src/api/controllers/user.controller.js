import httpStatus from 'http-status';
import User from '../models/user.model';
import { handler as errorHandler } from '../middlewares/error';

/** 
 * Load user and append to req.
 * @public
 */
export const load = async (req, res, next, id) => {
  try {
    const user = await User.get(id);
    req.locals = { user };
    return next();
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

/**
 * Get user
 * @public
 */
export const get = async (req, res) => res.json(req.locals.user.transform());

/**
 * Get logged in user info
 * @public
 */
export const loggedIn = (req, res) => res.json(req.user.transform());

/**
 * Create new user
 * @public
 */
export const create = async (req, res, next) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(httpStatus.CREATED);
    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Replace existing user (replaces logged-in user only, not by ID)
 * @public
 */
export const replace = async (req, res, next) => {
  try {
    const { user } = req.locals;
    const newUser = new User(req.body);

    // remove _id from new user, and remove role if the logged-in user is not an admin. 
    // prevents non-admin users from making themselves admins (security risk).
    const omitRole = user.role !== 'admin' ? 'role' : '';
    const { [omitRole]: role, _id, ...newUserObject } = newUser.toObject();
    
    const updated = await user.update(newUserObject, { override: true, upsert: true});
    const savedUser = await User.findById(user._id);
    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Update existing user
 * @public
 */
export const update = async (req, res, next) => {
  try {
    const { user } = req.locals;
    // remove _id from new user, and remove role if the logged-in user is not an admin. 
    // prevents non-admin users from making themselves admins (security risk).
    const omitRole = user.role !== 'admin' ? 'role' : '';

    const { [omitRole]: role, ...userData } = req.body;
    Object.assign(user, userData);

    const savedUser = await user.save();
    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/** 
 * Get user list
 * @public
 */
export const list = async (req, res, next) => {
  try {
    const users = await User.list(req.query);
    const transformedUsers = users.map(user => user.transform());
    res.json(transformedUsers);
  } catch (error) {
    next(error);
  }
};

/** 
 * Delete user
 * @public
 */
export const remove = async (req, res, next) => {
  try {
    const { user } = req.locals;
    
    await user.remove();
    res.status(httpStatus.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};