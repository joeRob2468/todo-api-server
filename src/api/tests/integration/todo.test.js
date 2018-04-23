/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-expressions */
import request from 'supertest';
import httpStatus from 'http-status';
import { expect } from 'chai';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import app from '../../../index';
import Todo from '../../models/todo.model';
import User from '../../models/user.model';
import RefreshToken from '../../models/refreshToken.model';

/**
 * root level hooks
 */

async function format(todo) {
  const formatted = todo;

  // get todo from database. Uses title as key, so don't change that in the tests (adjust the description instead);
  const dbTodo = (await Todo.findOne({ title: todo.title })).transform();

  // remove null and undefined properties
  Object.keys(dbTodo).forEach((key) => (dbTodo[key] == null) && delete dbTodo[key]);

  return dbTodo;
}

describe('Todo API', async () => {
  let user;
  let admin;
  let userAccessToken;
  let adminAccessToken;

  const password = '1234567';
  const passwordHashed = bcrypt.hashSync(password, 1);

  let dbTodos;
  let todo;
  const dueAt = new Date(+new Date() + 2*60*60*1000).toISOString(); // 2 hours in the future, formatted as ISO-8601

  beforeEach(async () => {
    admin = {
      email: 'adminuser@example.com',
      password: passwordHashed,
      name: 'Admin User',
      role: 'admin'
    };

    user = {
      email: 'testuser@example.com',
      password: passwordHashed,
      name: 'Test User'
    };

    dbTodos = {
      first: {
        user: '',
        title: 'Finalize Draft',
        description: 'Submit to Mindy',
        dueAt: dueAt
      },
      second: {
        user: '',
        title: 'Make Food',
        description: 'Chicken and potatoes',
        dueAt: dueAt
      }
    };

    todo = {
      title: 'Write Tests',
      description: 'Make them easy',
      dueAt: dueAt
    };
    await User.remove({});
    await User.insertMany([user, admin]);

    user.password = password;
    admin.password = password;

    dbTodos.first.user = (await User.findOne({ email: user.email }))._id;
    dbTodos.second.user = (await User.findOne({ email: admin.email }))._id;

    await Todo.remove({});
    await Todo.insertMany([dbTodos.first, dbTodos.second]);

    userAccessToken = (await User.findAndGenerateToken(user)).accessToken;
    adminAccessToken = (await User.findAndGenerateToken(admin)).accessToken;
  });

  describe('POST /v1/todos', () => {
    it('should create a new todo when request is ok', async () => {
      const userId = (await User.findOne({email: user.email}))._id;

      return request(app)
        .post(`/v1/users/${userId}/todos`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(todo)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body).to.include(todo);
        });
    });
  });
});

//     it('should report error when title is not provided', () => {
//       delete todo.title;

//       return request(app)
//         .post('/v1/todos')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(todo)
//         .expect(httpStatus.BAD_REQUEST)
//         .then((res) => {
//           const { field, location, messages } = res.body.errors[0];
//           expect(field).to.deep.include('title');
//           expect(location).to.be.equal('body');
//           expect(messages).to.include('"title" is required');
//         });
//     });

//     it('should report error when dueAt is not provided', () => {
//       delete todo.dueAt;

//       return request(app)
//         .post('/v1/todos')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(todo)
//         .expect(httpStatus.BAD_REQUEST)
//         .then((res) => {
//           const { field, location, messages } = res.body.errors[0];
//           expect(field).to.deep.include('dueAt');
//           expect(location).to.be.equal('body');
//           expect(messages).to.include('"dueAt" is required');
//         });
//     });
//   });

//   describe('GET /v1/todos', () => {
//     it('should get all todos', () => {
//       return request(app)
//         .get('/v1/todos')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .expect(httpStatus.OK)
//         .then(async (res) => {
//           // get todos from database (so we have IDs)
//           const first = await format(dbTodos.first);
//           const second = await format(dbTodos.second);

//           // before comparing, it is necessary to convert String to Date.
//           res.body[0].dueAt = new Date(res.body[0].dueAt);
//           res.body[1].dueAt = new Date(res.body[1].dueAt);

//           expect(res.body).to.be.an('array');
//           expect(res.body).to.have.lengthOf(2);
//           expect(res.body).to.deep.include.members([first, second]);
//         });
//     });

//     it('should get all todos with pagination', () => {
//       return request(app)
//         .get('/v1/todos')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ page: 2, perPage: 1 })
//         .expect(httpStatus.OK)
//         .then(async (res) => {
//           expect(res.body).to.be.an('array');
//           expect(res.body).to.have.lengthOf(1);
//         });
//     });

//     it('should report error when pagination\'s parameters are not a number', () => {
//       return request(app)
//         .get('/v1/todos')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({page: '?', perPage: 'notANumber'})
//         .expect(httpStatus.BAD_REQUEST)
//         .then((res) => {
//           const { field, location, messages } = res.body.errors[0];
//           expect(field).to.deep.include('page');
//           expect(location).to.equal('query');
//           expect(messages).to.include('"page" must be a number');
//         });
//     });
//   });

//   describe('GET /v1/todos/:id', () => {
//     it('should get todo', async () => {
//       const id = (await Todo.findOne({ title: dbTodos.first.title }))._id;
//       dbTodos.first.user = dbTodos.first.user.toString();
      
//       return request(app)
//         .get(`/v1/todos/${id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .expect(httpStatus.OK)
//         .then((res) => {
//           expect(res.body).to.include(dbTodos.first);
//         });
//     });

//     it('should report error when todo does not exist', () => {
//       return request(app)
//         .get(`/v1/todos/${mongoose.Types.ObjectId()}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .expect(httpStatus.NOT_FOUND)
//         .then((res) => {
//           expect(res.body.code).to.be.equal(404);
//           expect(res.body.message).to.be.equal('Todo does not exist');
//         });
//     });

//     it('should report error when id is not a valid ObjectID', () => {
//       return request(app)
//         .get('/v1/todos/invalidid')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .expect(httpStatus.NOT_FOUND)
//         .then((res) => {
//           expect(res.body.code).to.be.equal(404);
//           expect(res.body.message).to.be.equal('Todo does not exist');
//         });
//     });
//   });

//   describe('PUT /v1/todos/:id', () => {
//     it('should replace todo', async () => {
//       const id = (await Todo.findOne({ title: dbTodos.first.title }))._id;

//       return request(app)
//         .put(`/v1/todos/${id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(todo)
//         .expect(httpStatus.OK)
//         .then((res) => {
//           expect(res.body).to.include(todo);
//         });
//     });

//     it('should report error when title is not provided', async () => {
//       const id = (await Todo.findOne({ title: dbTodos.first.title }))._id;
//       delete todo.title; 

//       return request(app)
//         .put(`/v1/todos/${id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(todo)
//         .expect(httpStatus.BAD_REQUEST)
//         .then((res) => {
//           const { field, location, messages } = res.body.errors[0];
//           expect(field).to.deep.include('title');
//           expect(location).to.be.equal('body');
//           expect(messages).to.include('"title" is required');
//         });
//     });

//     it('should report error "Todo does not exist" when todo does not exist', async () => {
//       return request(app)
//         .put(`/v1/todos/${mongoose.Types.ObjectId()}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(todo)
//         .expect(httpStatus.NOT_FOUND)
//         .then((res) => {
//           expect(res.body.code).to.be.equal(404);
//           expect(res.body.message).to.be.equal('Todo does not exist');
//         });
//     });
//   });

//   describe('PATCH /v1/todos/:id', () => {
//     it('should update todo', async () => {
//       const id = (await Todo.findOne(dbTodos.first))._id;
//       const { description } = todo;

//       return request(app)
//         .patch(`/v1/todos/${id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send({ description })
//         .expect(httpStatus.OK)
//         .then((res) => {
//           expect(res.body.description).to.be.equal(description);
//           expect(res.body.title).to.be.equal(dbTodos.first.title);
//         });
//     });

//     it('should not update todo when no parameters were given', async () => {
//       const id = (await Todo.findOne(dbTodos.first))._id;
//       dbTodos.first.user = dbTodos.first.user.toString();

//       return request(app)
//         .patch(`/v1/todos/${id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.OK)
//         .then((res) => {
//           expect(res.body).to.include(dbTodos.first);
//         });
//     });

//     it('should report error "Todo does not exist" when todo does not exist', () => {
//       return request(app)
//         .patch(`/v1/todos/${mongoose.Types.ObjectId()}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .expect(httpStatus.NOT_FOUND)
//         .then((res) => {
//           expect(res.body.code).to.be.equal(404);
//           expect(res.body.message).to.be.equal('Todo does not exist');
//         });
//     });
//   });

//   describe('DELETE /v1/todos/:id', () => {
//     it('should delete todo', async () => {
//       const id = (await Todo.findOne(dbTodos.first))._id;

//       return request(app)
//         .delete(`/v1/todos/${id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .expect(httpStatus.NO_CONTENT)
//         .then(async () => {
//           const todos = await Todo.find({});
//           expect(todos).to.have.lengthOf(1);
//         });
//     });

//     it('should report error "Todo does not exist" when todo does not exist', () => {
//       return request(app)
//         .delete(`/v1/todos/${mongoose.Types.ObjectId()}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .expect(httpStatus.NOT_FOUND)
//         .then((res) => {
//           expect(res.body.code).to.be.equal(404);
//           expect(res.body.message).to.be.equal("Todo does not exist");
//         });
//     });
//   });
// });