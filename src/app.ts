// @ts-ignore
import dotenv from 'dotenv';
// @ts-ignore
import express from 'express';
// @ts-ignore
// import logger from 'morgan';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
// @ts-ignore
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import schema from './graphql';

// change to current directory
process.chdir(__dirname);
dotenv.config();

// import routes from './routes';
import jwt from './_helpers/jwt';
import errorHandler from './_helpers/error-handler';
import routes from './routes';

const app = express();
app.disable('x-powered-by');

// app.use(logger('dev', {
// skip: () => app.get('env') === 'test'
// }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());

// file uploads
app.use(fileUpload());

// use JWT auth to secure the api
app.use(jwt());

// Routes
// app.use('/', routes);
// api routes
// app.use('/api', routes);
app.use('/', routes);

// The GraphQL endpoint
const server = new ApolloServer({
  schema,
  playground: {
    endpoint: '/graphql/play'
  },
  context: async ({req}) => {
    const { authorization } = req.headers;
    return {
        token: authorization && authorization.split(' ')[1]
    };
  }
});

server.applyMiddleware({
  app,
  path: '/graphql'
});

// global error handler
app.use(errorHandler);

export default app;
