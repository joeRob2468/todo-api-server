/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-expressions */
import request from 'supertest';
import httpStatus from 'http-status';
import { expect } from 'chai';
import bcrypt from 'bcryptjs';
import app from '../../../index';
import Todo from '../../models/todo.model';

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
  let dbTodos;
  let todo;
  const dueAt = new Date(+new Date() + 2*60*60*1000).toISOString(); // 2 hours in the future, formatted as ISO-8601

  beforeEach(async () => {
    dbTodos = {
      finalizeDraft: {
        title: 'Finalize Draft',
        description: 'Submit to Mindy',
        dueAt: dueAt
      },
      makeFood: {
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

    await Todo.remove({});
    await Todo.insertMany([dbTodos.finalizeDraft, dbTodos.makeFood]);
  });

  describe('POST /v1/todos', () => {
    it('should create a new todo when request is ok', () => {
      return request(app)
        .post('/v1/todos')
        .send(todo)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body).to.include(todo);
        });
    });
  });
});