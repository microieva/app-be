import passport from 'passport';
import jwt from 'jsonwebtoken';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';   
import { dataSource } from './db.config';
import { User } from '../graphql/user/user.model';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "http://localhost:4000/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
  const userRepo = dataSource.getRepository(User)

  let user = await userRepo.findOne({ where: { email: profile.emails?.[0].value } });
  if (!user) {
    user = new User();
    user.email = profile.emails?.[0].value!;
    user.password = ''; 
    await userRepo.save(user);
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  done(null, { token });
  //done(null, { userId: user.id });
}));

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});
