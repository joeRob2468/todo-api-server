/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-expressions */
import request from 'supertest';
import httpStatus from 'http-status';
import { expect } from 'chai';
import sinon from 'sinon';
import app from '../../../index';
import User from '../../models/user.model';
import RefreshToken from '../../models/refreshToken.model';
import * as authProviders from '../../services/authProviders';

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

  describe('POST /v1/auth/login', () => {
    it('should return an accessToken and a refreshToken when email and password matches', () => {
      return request(app)
        .post('/v1/auth/login')
        .send(dbUser)
        .expect(httpStatus.OK)
        .then((res) => {
          delete dbUser.password;
          expect(res.body.token).to.have.a.property('accessToken');
          expect(res.body.token).to.have.a.property('refreshToken');
          expect(res.body.token).to.have.a.property('expiresIn');
          expect(res.body.user).to.include(dbUser);
        });
    });

    it('should report error when email and password are not provided', () => {
      return request(app)
        .post('/v1/auth/login')
        .send({})
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field, location, messages } = res.body.errors[0];
          expect(field).to.deep.include('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" is required');
        });
    });

    it('should report error when email is not valid', () => {
      user.email = 'this_is_not_an_email';
      return request(app)
        .post('/v1/auth/login')
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field, location, messages } = res.body.errors[0];
          expect(field).to.deep.include('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" must be a valid email');
        });
    });

    it('should report error when email and password don\'t match', () => {
      dbUser.password = 'xxxxxx';
      return request(app)
        .post('/v1/auth/login')
        .send(dbUser)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          const { code, message } = res.body;
          expect(code).to.be.equal(401);
          expect(message).to.be.equal('Incorrect email or password');
        });
    });
  });

  describe('POST /v1/auth/facebook', () => {
    it('should create a new user and return an accessToken when user does not exist', () => {
      sandbox.stub(authProviders, 'facebook').callsFake(fakeOAuthRequest);
      return request(app)
        .post('/v1/auth/facebook')
        .send({ access_token: '123' })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.token).to.have.a.property('accessToken');
          expect(res.body.token).to.have.a.property('refreshToken');
          expect(res.body.token).to.have.a.property('expiresIn');
          expect(res.body.user).to.be.an('object');
        });
    });

    it('should return an accessToken when user already exists', async () => {
      dbUser.email = 'test@test.com';
      await User.create(dbUser);
      sandbox.stub(authProviders, 'facebook').callsFake(fakeOAuthRequest);
      return request(app)
        .post('/v1/auth/facebook')
        .send({ access_token: '123' })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.token).to.have.a.property('accessToken');
          expect(res.body.token).to.have.a.property('refreshToken');
          expect(res.body.token).to.have.a.property('expiresIn');
          expect(res.body.user).to.be.an('object');
        });
    });

    it('should return error when access_token is not provided', () => {
      return request(app)
        .post('/v1/auth/facebook')
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field, location, messages } = res.body.errors[0];
          expect(field).to.deep.include('access_token');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"access_token" is required');
        });
    });
  });

  describe('POST /v1/auth/google', () => {
    it('should create a new user and return an accessToken when user does not exist', () => {
      sandbox.stub(authProviders, 'google').callsFake(fakeOAuthRequest);
      return request(app)
        .post('/v1/auth/google')
        .send({ access_token: '123' })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.token).to.have.a.property('accessToken');
          expect(res.body.token).to.have.a.property('refreshToken');
          expect(res.body.token).to.have.a.property('expiresIn');
          expect(res.body.user).to.be.an('object');
        });
    });
    
    it('should return an accessToken when user already exists', async () => {
      dbUser.email = 'test@test.com';
      await User.create(dbUser);
      sandbox.stub(authProviders, 'google').callsFake(fakeOAuthRequest);
      return request(app)
        .post('/v1/auth/google')
        .send({ access_token: '123' })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.token).to.have.a.property('accessToken');
          expect(res.body.token).to.have.a.property('refreshToken');
          expect(res.body.token).to.have.a.property('expiresIn');
          expect(res.body.user).to.be.an('object');
        });
    });

    it('should return error when access_token is not provided', () => {
      return request(app)
        .post('/v1/auth/google')
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field, location, messages } = res.body.errors[0];
          expect(field).to.deep.include('access_token');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"access_token" is required');
        });
    });
  });

  describe('POST /v1/auth/refresh-token', () => {
    it('should return a new accessToken when refreshToken and email match', async() => {
      await RefreshToken.create(refreshToken);
      return request(app)
        .post('/v1/auth/refresh-token')
        .send({ email: dbUser.email, refreshToken: refreshToken.token })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.a.property('accessToken');
          expect(res.body).to.have.a.property('refreshToken');
          expect(res.body).to.have.a.property('expiresIn');
        });
    });

    it('should report error when email and refreshToken don\'t match', async () => {
      await RefreshToken.create(refreshToken);
      return request(app)
        .post('/v1/auth/refresh-token')
        .send({ email: user.email, refreshToken: refreshToken.token })
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          const { code, message } = res.body;
          expect(code).to.be.equal(401);
          expect(message).to.be.equal('Incorrect email or refreshToken'); 
        });
    });

    it('should report error when email and refreshToken are not provided', () => {
      return request(app)
        .post('/v1/auth/refresh-token')
        .send({})
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const { field: field1, location: location1, messages: messages1 } = res.body.errors[0];
          const { field: field2, location: location2, messages: messages2 } = res.body.errors[1];

          expect(field1).to.deep.include('email');
          expect(location1).to.be.equal('body');
          expect(messages1).to.include('"email" is required');

          expect(field2).to.deep.include('refreshToken');
          expect(location2).to.be.equal('body');
          expect(messages2).to.include('"refreshToken" is required');
        });
    });
  });
});