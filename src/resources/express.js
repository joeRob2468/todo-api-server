'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import error from '../api/middlewares/error';
import routes from '../api/routes/v1';

/** 
 * Express instance
 * @public
*/
const app = new express();

// parse body params and attach them to req.body
app.use(bodyParser.json({ limit: process.env.BODY_LIMIT }));
app.use(bodyParser.urlencoded({ limit: process.env.BODY_LIMIT, extended: false }));

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// mount api v1 routes
app.use('/v1', routes);

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