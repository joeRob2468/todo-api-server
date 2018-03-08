'use strict';

import Express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';

/** 
 * Express instance
 * @public
*/
const app = new Express();

// parse body params and attach them to req.body
app.use(bodyParser.json({ limit: process.env.BODY_LIMIT }));
app.use(bodyParser.urlencoded({ limit: process.env.BODY_LIMIT, extended: false }));

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

/**
* Exports express
* @public
*/
export default app;