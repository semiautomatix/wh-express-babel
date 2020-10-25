// @ts-ignore
import expressJwt from 'express-jwt';
import { } from 'dotenv/config';
import * as userService from '../services/users';

const jwt = () => {
  const secret = process.env.JWT_SECRET || '';
  return expressJwt({ secret, isRevoked }).unless({
    path: [
      // public routes that don't require authentication
      '/users/authenticate',
      '/users/register',
      '/graphql',
      '/graphql/play',
      '/graphiql'
    ]
  });
};

async function isRevoked(req, payload, done) {
  const user = await userService.getById(payload.sub);

  // revoke token if user no longer exists
  if (!user) {
    return done(undefined, true);
  }

  done();
}

export default jwt;