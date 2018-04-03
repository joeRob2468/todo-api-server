/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-expressions */
import request from 'supertest';
import httpStatus from 'http-status';
import { expect } from 'chai';
import sinon from 'sinon';
import app from '../../../index';
import User from '../../models/user.model';
import RefreshToken from '../../models/refreshToken.model';
import authProviders from '../../services/authProviders';

const sandbox = sinon.createSandbox();

const fakeOAuthRequest = () => Promise.resolve({
  service: 'facebook',
  id: '123',
  name: 'user',
  email: 'test@test.com',
  picture: 'test.jpg'
});

describe('Authentication API', () => {
  let dbUser;
  let user;
  let refreshToken;

  beforeEach(async () => {
    dbUser = {
      email: 'jimmyfallon@gmail.com',
      password: 'mypassword',
      name: 'Jimmy Fallon',
      role: 'admin'
    };

    user = {
      email: 'jayleno@gmail.com',
      password: '1234567',
      name: 'Jay Leno'
    };

    refreshToken = {
      token: '5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d',
      userId: '5947397b323ae82d8c3a333b',
      userEmail: dbUser.email,
      expires: new Date()
    };

    await User.remove({});
    await User.create(dbUser);
    await RefreshToken.remove({});
  });

  afterEach(() => sandbox.restore());

  describe('POST /v1/auth/register', () => {
    it('should register a new user when request is ok', () => {
      return request(app)
        .post('/v1/auth/register')
        .send(user)
        .expect(httpStatus.CREATED)
        .then((res) => {
          delete user.password;
          expect(res.body.token).to.have.a.property('accessToken');
          expect(res.body.token).to.have.a.property('refreshToken');
          expect(res.body.token).to.have.a.property('expiresIn');
          expect(res.body.user).to.include(user);
        });
    });

    it('should report error when email already exists', () => {
      return request(app)
      .post('/v1/auth/register')
      .send(dbUser)
      .expect(httpStatus.CONFLICT)
      .then((res) => {
        const { field, location, message } = res.body.errors[0];
        expect(field).to.be.equal('email');
        expect(location).to.be.equal('body');
        expect(message).to.include('"email" already exists');
      });
    });

    it('should report error when the email provided is not valid', () => {
      user.email = 'this_is_not_an_email';
      
      return request(app)
        .post('/v1/auth/register')
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field, location, messages } = res.body.errors[0];
          expect(field).to.deep.include('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" must be a valid email');
        });
    });
  });
});