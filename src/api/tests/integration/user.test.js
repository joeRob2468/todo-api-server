/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-expressions */
import request from 'supertest';
import httpStatus from 'http-status';
import { expect } from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import app from '../../../index';
import User from '../../models/user.model';

/** 
 * root level hooks
 */

async function format(user) {
  const formatted = user;

  // delete password
  delete formatted.password;

  // get from database
  const dbUser = (await User.findOne({ email: user.email })).transform();

  // remove null and undefined properties
  Object.keys(dbUser).forEach((key) => (dbUser[key] == null) && delete dbUser[key]);

  return dbUser;
}

describe('Users API', async () => {
  let adminAccessToken;
  let userAccessToken;
  let dbUsers;
  let user;
  let admin;

  const password = '1234567';
  const passwordHashed = bcrypt.hashSync(password, 1);

  beforeEach(async () => {
    dbUsers = {
      first: {
        email: 'jimmyfallon@gmail.com',
        password: passwordHashed,
        name: 'Jimmy Fallon',
        role: 'admin'
      },
      second: {
        email: 'jayleno@gmail.com',
        password: passwordHashed,
        name: 'Jay Leno'
      }
    };

    user = {
      email: 'testuser@example.com',
      password,
      name: 'Test User'
    };

    admin = {
      email: 'testuser@example.com',
      password,
      name: 'Admin User',
      role: 'admin'
    };

    await User.remove({});
    await User.insertMany([dbUsers.first, dbUsers.second]);
    dbUsers.first.password = password;
    dbUsers.second.password = password;
    adminAccessToken = (await User.findAndGenerateToken(dbUsers.first)).accessToken;
    userAccessToken = (await User.findAndGenerateToken(dbUsers.second)).accessToken;
  });

  describe('POST /v1/users', () => {
    it('should create a new user when request is ok', () => {
      return request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(admin)
        .expect(httpStatus.CREATED)
        .then((res) => {
          delete admin.password;
          expect(res.body).to.include(admin);
        });
    });

    it('should create a new user and set default role to "user"', () => {
      return request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(user)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body.role).to.be.equal('user');
        });
    });

    it('should report error when email already exists', () => {
      user.email = dbUsers.first.email;

      return request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(user)
        .expect(httpStatus.CONFLICT)
        .then((res) => {
          const { field, location, message } = res.body.errors[0];
          expect(field).to.be.equal('email');
          expect(location).to.be.equal('body');
          expect(message).to.include('"email" already exists');
        });
    });

    it('should report error when password length is less than 6', () => {
      user.password = '12345';

      return request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field, location, messages } = res.body.errors[0];
          expect(field).to.deep.include('password');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"password" length must be at least 6 characters long');
        });
    });

    it('should report error when logged user is not an admin', () => {
      return request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(user)
        .expect(httpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal('Forbidden');
        });
    });
  });

  describe('GET /v1/users', () => {
    it('should get all users', () => {
      return request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK)
        .then(async (res) => {
          const first = await format(dbUsers.first);
          const second = await format(dbUsers.second);

          // must convert dates to Date objects before comparison
          res.body[0].createdAt = new Date(res.body[0].createdAt);
          res.body[1].createdAt = new Date(res.body[1].createdAt);

          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(2);
          expect(res.body).to.deep.include(first);
          expect(res.body).to.deep.include(second);
        });
    });

    it('should get all users with limit and skip pagination', () => {
      return request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ skip: 1, limit: 1})
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(1);
          expect(res.body[0]).to.include.keys('email');
        });
    });

    it('should filter users', () => {
      return request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ email: dbUsers.first.email })
        .expect(httpStatus.OK)
        .then(async (res) => {
          delete dbUsers.first.password;
          const first = await format(dbUsers.first);

          // must convert dates to Date objects before comparison
          res.body[0].createdAt = new Date(res.body[0].createdAt);

          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(1);
          expect(res.body).to.deep.include.members([first]);
        });
    });

    it('should report error when limit or skip pagination parameters are not a number', () => {
      return request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ skip: '?', limit: 'invalid' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field, location, messages } = res.body.errors[0];
          expect(field).to.deep.include('skip');
          expect(location).to.be.equal('query');
          expect(messages).to.include('"skip" must be a number');
          return Promise.resolve(res);
        })
        .then((res) => {
          const { field, location, messages } = res.body.errors[1];
          expect(field).to.deep.include('limit');
          expect(location).to.be.equal('query');
          expect(messages).to.include('"limit" must be a number');
        });
    });

    it('should report error if logged user is not an admin', () => {
      return request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal('Forbidden');
        });
    });
  });

  describe('GET /v1/users/:userId', () => {
    it('should get user', async () => {
      delete dbUsers.first.password;
      const id = (await User.findOne(dbUsers.first))._id;

      return request(app)
        .get(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.include(dbUsers.first);
        });
    });

    it('should report error "User does not exist" when user does not exist', () => {
      return request(app)
        .get(`/v1/users/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });

    it('should report error "User does not exist" when id is not a valid ObjectID', () => {
      return request(app)
        .get('/v1/users/notanid')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });

    it('should report error when logged user is not the same as the requested one', async () => {
      const id = (await User.findOne({ email: dbUsers.first.email }))._id;

      return request(app)
        .get(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal('Forbidden');
        });
    });
  });

  describe('PUT /v1/users/:userId', () => {
    it('should replace user', async () => {
      delete dbUsers.first.password;

      const id = (await User.findOne(dbUsers.first))._id;
      return request(app)
        .put(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(user)
        .expect(httpStatus.OK)
        .then((res) => {
          delete user.password;
          expect(res.body).to.include(user);
          expect(res.body.role).to.be.equal('user');
        });
    });

    it('should report error when email is not provided', async () => {
      delete dbUsers.first.password;
      const id = (await User.findOne(dbUsers.first))._id;
      delete user.email;

      return request(app)
        .put(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field, location, messages } = res.body.errors[0];
          expect(field).to.deep.include('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" is required');
        });
    });

    it('should report error when user password length is less than 6', async () => {
      delete dbUsers.first.password;
      const id = (await User.findOne(dbUsers.first))._id;
      user.password = '12345';
      return request(app)
        .put(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field, location, messages } = res.body.errors[0];
          expect(field).to.deep.include('password');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"password" length must be at least 6 characters long');
        });
    });

    it('should report error "User does not exist" when user does not exist', () => {
      return request(app)
        .put(`/v1/users/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.NOT_FOUND);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });

    it('should report error when logged user is not the same as the requested one', async () => {
      const id = (await User.findOne({ email: dbUsers.first.email }))._id;

      return request(app)
        .put(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal('Forbidden');
        });
    });

    it('should not replace the role of the user (not admin)', async () => {
      const id = (await User.findOne({ email: dbUsers.second.email }))._id;
      const role = 'admin';

      return request(app)
        .put(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(admin)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.role).to.not.be.equal(role);
        });
    });
  });

  describe('PATCH /v1/users/:userId', () => {
    it('should update user', async () => {
      const id = (await User.findOne({ email: dbUsers.first.email }))._id;
      const { name } = user;

      return request(app)
        .patch(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.email).to.be.equal(dbUsers.first.email);
          expect(res.body.name).to.be.equal(name);
        });
    });

    it('should not update user when no parameters were given', async () => {
      delete dbUsers.first.password;
      const id = (await User.findOne(dbUsers.first))._id;

      return request(app)
        .patch(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.include(dbUsers.first);
        });
    });

    it('should report error "User does not exist" when user does not exist', () => {
      return request(app)
        .patch(`/v1/users/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.NOT_FOUND);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });

    it('should report error when logged user is not the same as the requested one', async () => {
      const id = (await User.findOne({ email: dbUsers.first.email }))._id;

      return request(app)
        .patch(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal('Forbidden');
        });
    });

    it('should not update the role of the user (not admin)', async () => {
      const id = (await User.findOne({ email: dbUsers.second.email }))._id;
      const role = 'admin';

      return request(app)
        .patch(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ role })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.role).to.not.be.equal(role);
        });
    });
  });

  describe('DELETE /v1/users/:userId', () => {
    it('should delete user', async () => {
      const id = (await User.findOne({}))._id;

      return request(app)
        .delete(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT)
        .then(async () => {
          const users = await User.find({});
          expect(users).to.have.lengthOf(1);
        });
    });

    it('should report error "User does not exist" when user does not exist', () => {
      return request(app)
        .delete(`/v1/users/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.NOT_FOUND);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });

    it('should report error when logged user is not the same as the requested one', async () => {
      const id = (await User.findOne({ email: dbUsers.first.email }))._id;

      return request(app)
        .delete(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal('Forbidden');
        });
    });
  });

  describe('GET /v1/users/profile', () => {
    it('should get the logged user\'s info', () => {
      delete dbUsers.second.password;

      return request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.include(dbUsers.second);
        });
    });

    it('should report error without stacktrace when accessToken is expired', async () => {
      // fake time
      const clock = sinon.useFakeTimers();
      const expiredAccessToken = (await User.findAndGenerateToken(dbUsers.first)).accessToken;

      // move clock forward by minutes set in config + 1 minute;
      clock.tick(Number.parseInt(process.env.JWT_EXPIRATION_MINUTES * 60000, 10) + 60000);

      return request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${expiredAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.code).to.be.equal(httpStatus.UNAUTHORIZED);
          expect(res.body.message).to.be.equal('jwt expired');
          expect(res.body).to.not.have.a.property('stack');
        });
    });
  });
});