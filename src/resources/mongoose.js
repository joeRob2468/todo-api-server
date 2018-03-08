import mongoose from 'mongoose';

// enable native es6 promises.
mongoose.Promise = global.Promise;

// log when initial connection is made
mongoose.connection.once('open', () => {
  console.info(`Connected to Mongoose at ${process.env.MONGO_URI}`);
});

// exit application on error
mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

// close the mongoose connection on app close
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.info('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});

// print mongoose logs in dev env
if (process.env.NODE_ENV === 'development')
{
  mongoose.set('debug', true);
}

/** 
 * Connect to Mongoose
 * @returns {object} Mongoose connection
 * @public
*/
function connect() {
  // connect to mongoose
  mongoose.connect(process.env.MONGO_URI, {
    keepAlive: 1
  });
  return mongoose.connection;
}

/** 
 * export Mongoose utilities
 * @public
 */
export default {
  connect: connect,
};