/* src/controllers/profile.controller.ts */

import { Request, Response } from 'express';
import { check, matchedData, validationResult } from 'express-validator';
import { CONSTANT } from '../utils/constant';
import bcrypt from 'bcrypt';
// import moment from 'moment'
import AuthController from './auth.controller';
import { validationErrors } from '../functions';
import { UserInfo, CustomSessionData } from '../utils/interface';
import { UserRepository } from '../repositories';
import { Mail } from '../services';

/*
 * Controller to handle request to /users
 */
export class UserController {
  // validation rules
  static validate(name: string) {
    let returnArr = [];
    switch (name) {
      case 'signup':
        returnArr = [
          check('email')
            .isEmail()
            .withMessage('Invalid email address supplied')
            .trim(),
          check('notify_email')
            .isEmail()
            .withMessage('Invalid email address supplied')
            .trim()
            .optional(),
          check('base_url').optional(),
          check(
            'password',
            'Password must be at least 5 chars long and contain one number',
          )
            .isLength({ min: 6 })
            .matches(/\d/)
            .optional(),
          check('username', "Username can't be empty").isLength({ min: 2 }),
          check('firstname', "First name can't be empty").isLength({ min: 2 }),
          check('lastname', "Last name can't be empty").isLength({ min: 2 }),
          check('avatar').optional(),
          check('dob').not().isEmpty(),
          check('gender').isIn(['male', 'female']).optional(),
          check('street_address').optional(),
          check('city').optional(),
          check('state').optional(),
          check('zip').optional(),
          check('is_over_13').notEmpty().withMessage('is_over_13 is required.'),
          check('accept_terms')
            .notEmpty()
            .withMessage('Accept terms is required.'),
          check('school_group').notEmpty(),
          check('reward_points').optional(),
          check('mobile_number')
            .notEmpty()
            .withMessage('Mobile number is required.'),
          check('country_code')
            .notEmpty()
            .withMessage('Country code is required.'),
        ];
        break;
      case 'login':
        returnArr = [
          check('email')
            .isEmail()
            .withMessage('Invalid email address supplied')
            .trim()
            .custom(async (value, params) => {
              const req = params.req;
              req.session.user = null;
              const user = await UserRepository.findUserByEmail(value);

              if (user) {
                req.session.user = { ...user };
              }
              return null;
            }),
          check('password', 'Incorrect password').custom((value, params) => {
            const req = params.req;
            const session = req && (req.session as CustomSessionData);

            const user: UserInfo = session.user;
            if (!user) {
              // throw new Error('Incorrect user or password')
              return true;
            }
            if (!user.is_active) {
              throw new Error(
                'Your account is suspended. Please connect with support team.',
              );
            }

            if (user.blocked_till > new Date()) {
              throw new Error(
                'Your account is temporarily blocked. Please try after sometime.',
              );
            }

            if (!user.password) {
              throw new Error(
                "We couldn't retrieve your password. Please reset via forgot password.",
              );
            }
            return bcrypt.compare(value, user.password).then(async (res) => {
              if (res !== true) {
                await UserRepository.addLoginMessage(
                  user.email,
                  'failure',
                  CONSTANT.INCORRECT_EMAIL,
                  user._id,
                );
                throw new Error(CONSTANT.INCORRECT_PASSWORD);
              } else {
                await UserRepository.addLoginMessage(
                  user.email,
                  'success',
                  CONSTANT.LOGIN_SUCCESS,
                  user._id,
                );
              }
            });
          }),
        ];
        break;
      // case 'update-profile':
      //   returnArr = [
      //     check('email')
      //       .isEmail().withMessage('Invalid email address supplied')
      //       .trim()
      //       .optional({ nullable: true, checkFalsy: true }),

      //     check('username', 'Username can\'t be empty')
      //       .isLength({ min: 2 })
      //   ]
      //   break;
      // case 'update-consent':
      //   returnArr = [
      //     check('signature')
      //       .optional()
      //   ]
      //   break;
    }
    return returnArr;
  }

  static async signup(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(422)
          .json({ errors: validationErrors(errors.mapped()) });
      }
      console.log(req.body)
      const postData = matchedData(req);
      const user: UserInfo = await UserRepository.createUser(postData);

      const activationLink: string = 'http://localhost:4200';

      await Mail.sendMail(
        'vinodk@test.com',
        'Activate Your Account',
        `Hello ${user.firstname} \\n Click on the link below to activate your account:\n${activationLink}`,
      );
      return res.status(200).json({ success: true, data: null });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ success: false, errors: validationErrors(errors.mapped()) });
      }
      const session = req && (req.session as CustomSessionData);
      const user: UserInfo = session.user;
      const result = JSON.parse(JSON.stringify(AuthController.doLogin(user)));
      result['profile'] = {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        roles: user.roles,
        last_login_at: user.last_login_at,
        is_active: user.is_active,
      };
      const dataToUpdate = { last_login_at: new Date() };
      UserRepository.updateUser(user.id, dataToUpdate);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
