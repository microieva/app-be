export const CONSTANT = {
  USER_CREATED:
    'Congratulations!  An email has been sent to you to activate your account.',
  USER_EXISTS: 'User email already exists.',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  EMAIL_CONFIRM_SUCCESS:
    'Thank you for confirming your email.  Click here to log in.',
  INCORRECT_EMAIL: 'Incorrect email address or password .',
  INCORRECT_PASSWORD: 'Incorrect email address or password.',
};

export enum HttpStatusCode {
  OK = 200,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER = 500,
}
