'use strict';

require('dotenv-safe').config();

// make bluebird default promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign
import app from './resources/express';
import mongoose from './resources/mongoose';
import logger from './resources/logger';

// listen for requests
app.listen(process.env.PORT, (err) => {
  if (!err) {
    logger.info(`Server is running on port ${process.env.PORT} (${process.env.NODE_ENV})`);
  }
});

mongoose.connect();

/**
* Exports express
* @public
*/
export default app;