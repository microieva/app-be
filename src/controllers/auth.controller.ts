import jwt from 'jwt-simple';
import passport from 'passport';
import moment, { Moment } from 'moment';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserInfo } from '../utils/interface';

class Auth {
  private _user: any = null;

  public initialize = () => {
    passport.use('jwt', this.getStrategy());
    return passport.initialize();
  };

  public authenticate = (callback) =>
    passport.authenticate(
      'jwt',
      { session: false, failWithError: true },
      callback,
    );

  public doLogin = (user: UserInfo) => this.genToken(user);

  private genToken = (user: UserInfo): { token: string; expires: Moment } => {
    const expires = moment()
      .utc()
      .add({ minutes: 60 * 24 * 7 })
      .unix();
    const token = jwt.encode(
      {
        exp: expires,
        user: user._id,
      },
      process.env.JWT_SECRET,
    );

    return {
      token: `Bearer ${token}`,
      expires: moment.unix(expires).utc(),
    };
  };

  private getStrategy = (): Strategy => {
    const params = {
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
    };
    console.log(params);
    return null;
    // return new Strategy(params, (req, payload: any, done) => {
    //   User.findUserById(payload.user)
    //     .then((user) => {
    //       /* istanbul ignore next: passport response */
    //       if (user === null) {
    //         return done(null, false, { message: 'The user in the token was not found.' })
    //       }

    //       return done(null, user)
    //     })
    //     .catch((err) => done(err))
    // })
  };

  public get user() {
    return this._user;
  }

  public get userId() {
    if (this._user && this._user._id) {
      return this._user._id;
    } else {
      return null;
    }
  }
}

export default new Auth();
