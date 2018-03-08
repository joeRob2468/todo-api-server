'use strict';

import app from './resources/express';

// listen for requests
app.listen(process.env.PORT, (err) => {
  if (!err) {
    console.info(`Server is running on port ${process.env.PORT} (${process.env.NODE_ENV})`);
  }
});

/**
* Exports express
* @public
*/
export default app;