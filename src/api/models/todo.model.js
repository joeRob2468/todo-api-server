import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../util/APIError';

/** 
 * Todo Schema
 * @private
 */
const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
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

 /**
 * Methods
 */

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
  async get(id) {
    try {
      let todo;

      if (mongoose.Types.ObjectId.isValid(id)) {
        todo = await this.findById(id).exec();
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
   * @returns {Promise<Todo[]>}
   */
  list({ page = 1, perPage = 10 /*, name, email, role */}) {
    // const options = omitBy({ name, email, role }, isNil);
    // limit by those fields. Requires lodash.
    return this.find(/* options */)
      .sort({dueAt: -1})
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();  
  }
};

/**
 * @typedef Todo
 */
export default mongoose.Model('Todo', todoSchema);