import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../utils/APIError';
import User from './user.model';

/** 
 * Todo Schema
 * @private
 */
const todoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  dueAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

 todoSchema.pre('save', async function save(next) {
  try {
    if (!this.isModified('user')) return next();

    try {
      let user;

      if (mongoose.Types.ObjectId.isValid(this.user)) {
        user = await User.findById(this.user).exec();
      }
      if (!user) {
        throw new APIError({
          message: 'User does not exist',
          status: httpStatus.NOT_FOUND
        });
      }
    } catch (error) {
      throw error;
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

 /**
 * Methods
 */

todoSchema.method({
  /** 
   * Transforms todo into a JSON friendly format
   * @returns {Object} todo - a pure object version of todo
   */
  transform() {
    const transformed = {};
    const fields = ['_id', 'user', 'title', 'description', 'completed', 'dueAt'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    // convert ObjectIDs to string before sending
    transformed._id = transformed._id.toString();
    transformed.user = transformed.user.toString();
    
    return transformed;
  }
});

/**
* Statics
*/
todoSchema.statics = {
  /**
   * Get todo
   * 
   * @param {ObjectID} id - the objectID of todo
   * @returns {Promise<Todo, Error>}
   */
  async get(userId, id) {
    try {
      let todo;
      let user;

      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId).exec();
      }

      if (mongoose.Types.ObjectId.isValid(id)) {
        todo = await this.findById(id).exec();
      }

      if (!user)
      {
        throw new APIError({
          message: 'User does not exist',
          status: httpStatus.NOT_FOUND
        });
      }
      
      if (todo) {
        return todo;
      }

      throw new APIError({
        message: 'Todo does not exist',
        status: httpStatus.NOT_FOUND
      });
    } catch (error) {
      throw error;
    }
  },

  /** 
   * List todos in descending order of 'dueAt' timestamp.
   * 
   * @param {number} skip - Number of todos to be skipped.
   * @param {number} limit - Limit number of todos to be returned.
   * @param {String} [title] - The title to filter by
   * @param {String} [description] - The description to filter by
   * @returns {Promise<Todo[]>}
   */
  async list({ page = 1, perPage = 500, user, title, description}) {
    try {
      let dbUser;
      if (mongoose.Types.ObjectId.isValid(user)) {
        dbUser = await User.findById(user).exec();
      }
      if (!dbUser) {
        throw new APIError({
          message: 'User does not exist',
          status: httpStatus.NOT_FOUND
        });
      }

      const options = { title, description, user };
      // remove undefined properties from options
      Object.keys(options).forEach((key) => {
        if (options[key] === null || options[key] === undefined) delete options[key];
      });

      return this.find(options)
        .sort({dueAt: -1})
        .skip(perPage * (page - 1))
        .limit(perPage)
        .exec();
    } catch (error) {
      throw error;
    }
  }
};

/**
 * @typedef Todo
 */
export default mongoose.model('Todo', todoSchema);