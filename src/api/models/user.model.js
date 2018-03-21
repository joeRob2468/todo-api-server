import mongoose from 'mongoose';
import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import moment from 'moment-timezone';
import jwt from 'jwt-simple';
import uuidv4 from 'uuid/v4';
import APIError from '../utils/APIError';

/** 
 * User Roles
 */

const roles = ['user', 'admin'];

/** 
 * User Schema
 * @private
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,
    trim: true, 
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 128
  },
  name: {
    type: String,
    maxlength: 128,
    index: true,
    trim: true
  },
  services: {
    facebook: String,
    google: String
  },
  role: {
    type: String,
    enum: roles,
    default: 'user'
  },
  picture: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
userSchema.pre('save', async function save(next) {
  try {
    if (!this.isModified('password')) return next();

    const rounds = process.env.NODE_ENV === 'test' ? 1 : 10;
    const hash = await bcrypt.hash(this.password, rounds);
    this.password = hash;

    return next();
  } catch (error) {
    return next(error);
  }
});

 /**
 * Methods
 */
userSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id', 'name', 'email', 'picture', 'role', 'createdAt'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },

  token() {
    const payload = {
      exp: moment().add(process.env.JWT_EXPIRATION_MINUTES, 'minutes').unix(),
      iat: moment().unix(),
      sub: this._id
    };

    return jwt.encode(payload, process.env.JWT_SECRET);
  },

  async passwordMatches(password) {
    return bcrypt.compare(password, this.password);
  }
});

/**
 * Statics
 */
userSchema.statics = {
  roles,

  /**
   * Get user
   * 
   * @param {ObjectId} id - The objectId of user
   * @returns {Promise<User, APIError>}
   */
  async get(id) {
    try {
      let user;

      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await this.findById(id).exec();
      }
      if (user) {
        return user;
      }

      throw new APIError({
        message: 'User does not exist',
        status: httpStatus.NOT_FOUND
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find user by email and tries to generate a JWT token
   * 
   * @param options - Information about the user
   * @param options.email - The user email
   * @param options.[password] - The user password
   * @param options.[refreshObject] - The refresh object
   * @returns {Promise<User, APIError>}
   */
  async findAndGenerateToken(options) {
    const { email, password, refreshObject } = options;
    if (!email) throw new APIError({ message: 'An email is required to generate a token' });

    const user = await this.findOne({ email }).exec();
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true
    };

    if (password) {
      if (user && await user.passwordMatches(password)) {
        return { user, accessToken: user.token() };
      }
      err.message = 'Incorrect email or password';
    } else if (refreshObject && refreshObject.userEmail === email) {
      return { user, accessToken: user.token() };
    } else {
      err.message = 'Incorrect email or refreshToken';
    }
    throw new APIError(err);
  }, 

  /**
   * List users in descending order of 'createdAt' timestamp.
   * 
   * @param {Number} skip - Number of users to be skipped. Default 0
   * @param {Number} limit - Limit number of users to be returned. Default 30
   * @param {String} [name] - The user name to filter by
   * @param {String} [email] - The email to filter by
   * @param {String} [role] - The role to filter by
   * 
   * @returns {Promise<User[]>}
   */
  list({
    skip = 0, limit = 30, name, email, role
  }) {

    const options = { name, email, role };
    // remove undefined properties from options
    Object.keys(options).forEach((key) => {
      if (options[key] === null) delete options[key];
    });

    return this.find(options)
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .exec();
  },

  /**
   * Return new validation error if error is a mongoose duplicate key error
   * 
   * @param {Error} error
   * @returns {Error | APIError}
   */
  checkDuplicateEmail(error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      return new APIError({
        message: 'Validation Error',
        errors: [{
          field: 'email',
          location: 'body',
          message: ['"email" already exists']
        }],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack
      });
    }

    return error;
  },

  async oAuthLogin({
    service, id, email, name, picture
  }) {
    const user = await this.findOne({$or: [
      { [`services.${service}`]: id }, 
      { email } 
    ]});

    // if the user exists, update it.
    if (user) {
      user.services[service] = id;
      if (!user.name) user.name = name;
      if (!user.picture) user.picture = picture;
      return user.save();
    }

    // otherwise, create it.
    const password = uuidv4();
    return this.create({
      services: { [service]: id }, email, password, name, picture
    });
  }
};

/** 
 * @typedef User
 */
export default mongoose.model('User', userSchema);