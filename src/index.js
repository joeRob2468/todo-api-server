'use strict';

require('dotenv').config();

import app from './resources/express';
import mongoose from './resources/mongoose';

// listen for requests
app.listen(process.env.PORT, (err) => {
  if (!err) {
    console.info(`Server is running on port ${process.env.PORT} (${process.env.NODE_ENV})`);
  }
});

mongoose.connect();

/**
* Exports express
* @public
*/
export default app;