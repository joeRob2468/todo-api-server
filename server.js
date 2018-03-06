import Express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';

// initialize the express app
const app = new Express();
app.use(cors());

// import our config and routes
import serverConfig from './config';

// connect to database

// apply body parser and server public assets and routes
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: false}));

// start app
app.listen(serverConfig.port, (err) => {
  if (!err) {
    console.log(`Server is running on port ${serverConfig.port}.`);
  }
});

export default app;