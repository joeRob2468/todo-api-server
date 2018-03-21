import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import BearerStrategy from 'passport-http-bearer';
import * as authProviders from '../api/services/authProviders';
import User from '../api/models/user.model';

const jwtOptions = {
  secretOrKey: process.env.JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer')
};

const jwtCallback = async (payload, done) => {
  try {
    const user = await User.findById(payload.sub);
    if (user) return done(null, user);
  } catch (error) {
    return done(error, false);
  }
};

const oAuth = service => async (token, done) => {
  try {
    const userData = await authProviders[service](token);
    const user = await User.oAuthLogin(userData);
    return done(null, user);
  } catch (error) {
    return done(error);
  }
};

export const jwt = new JwtStrategy(jwtOptions, jwtCallback);
export const facebook = new BearerStrategy(oAuth('facebook'));
export const google = new BearerStrategy(oAuth('google'));