import basicAuth from 'express-basic-auth';

export const BasicAuth = basicAuth({
  users: { admin: process.env.BASIC_AUTH_PASS },
  challenge: true,
  unauthorizedResponse: (req) =>
    req.auth
      ? `Credentials ${req.auth.user}:${req.auth.password} rejected`
      : 'No credentials provided',
});
