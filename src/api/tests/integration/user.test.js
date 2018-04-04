/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-expressions */
import request from 'supertest';
import httpStatus from 'http-status';
import { expect } from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcryptjs';
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
  const passwordHashed = await bcrypt.hash(password, 1);

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
          expect(res.body).to.deep.include.members([first, second]);
        });
    });
  });
});