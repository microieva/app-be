import { Application } from 'express';
import session from 'express-session';

export const configureSession = (app: Application) => {
  const sess = {
    secret: String(process.env.SESS_SECRET),
    saveUninitialized: true,
    resave: false,
    cookie: {
      secure: false,
    },
  };
  if (app.get('env') === 'production') {
    app.set('trust proxy', 1); // Trust first proxy
    sess.cookie.secure = true; // Serve secure cookies
  }

  app.use(session(sess));
};
