'use strict';

import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import passport from 'passport';
import error from '../api/middlewares/error';
import routes from '../api/routes/v1';
import * as strategies from './passport';

/** 
 * Express instance
 * @public
*/
const app = new express();

// set logging format.
// also log errors to separate stream
app.use(morgan((process.env.NODE_ENV === 'production' ? 'combined' : 'dev'), {
  skip: function(req, res) {
    return res.statusCode < 400;
  }, stream: process.stderr
}));
app.use(morgan((process.env.NODE_ENV === 'production' ? 'combined' : 'dev'), {
  skip: function(req, res) {
    return res.statusCode >= 400;
  }, stream: process.stdout
}));

// parse body params and attach them to req.body
app.use(bodyParser.json({ limit: process.env.BODY_LIMIT }));
app.use(bodyParser.urlencoded({ limit: process.env.BODY_LIMIT, extended: false }));

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// mount api v1 routes
app.use('/v1', routes);

// enable authentication
app.use(passport.initialize());
passport.use('jwt', strategies.jwt);
passport.use('facebook', strategies.facebook);
passport.use('google', strategies.google);

// if error is not an instanceOf APIError, convert it.
app.use(error.converter);

// catch 404 and forward to error handler
app.use(error.notFound);

// error handler, send stacktrace only during development
app.use(error.handler);

/**
* Exports express
* @public
*/
export default app;