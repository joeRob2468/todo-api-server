'use strict';

import Express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';

// initialize the express app
const app = new Express();
app.use(cors());

// connect to database

// apply body parser and server public assets and routes
app.use(bodyParser.json({ limit: process.env.BODY_LIMIT }));
app.use(bodyParser.urlencoded({ limit: process.env.BODY_LIMIT, extended: false }));

// start app
app.listen(process.env.PORT, (err) => {
  if (!err) {
    console.log(`Server is running on port ${process.env.PORT}.`);
  }
});

export default app;