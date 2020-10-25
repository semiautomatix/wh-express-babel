// @ts-ignore
import mongoose from 'mongoose';
import Users from '../models/users';

mongoose.connect(process.env.CONNECTION_STRING || '', { useNewUrlParser: true });
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
(<any>mongoose).Promise = global.Promise;

export {
  Users
};