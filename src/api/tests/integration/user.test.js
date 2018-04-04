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
  });
});