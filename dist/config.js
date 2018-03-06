'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var config = {
  mongoURL: process.env.MONGO_URL || 'mongodb://localhost:27017/todo-api',
  port: process.env.PORT || 8080
};

exports.default = config;