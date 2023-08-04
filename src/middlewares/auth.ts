import { Request, Response, NextFunction } from 'express';
import AuthController from '../controllers/auth.controller';
import { roles } from '../configurations/roles.config';
// const { roles } = require('../roles')

export class Auth {
  static loadUser(req: Request, res: Response, next: NextFunction) {
    return AuthController.authenticate((err, user) => {
      if (err || !user) return next();

      return next();
    })(req, res, next);
  }

  static isLoggedin(req: Request, res: Response, next: NextFunction) {
    return AuthController.authenticate((err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        if (info.name === 'TokenExpiredError') {
          res
            .status(401)
            .json({
              message:
                'Your token has expired. Please re-enter your login details.',
            });
        } else {
          res.status(401).json({ message: info.message });
        }
        return null;
      }

      return next();
    })(req, res, next);
  }

  static isAdminLoggedin(req: Request, res: Response, next: NextFunction) {
    Auth.isLoggedin(req, res, () => {
      if (Auth.checkUserRole(AuthController.user, 'administrator')) {
        next();
      } else {
        res
          .status(403)
          .json({
            success: false,
            message: 'You are not authorized to perform this action.',
          });
      }
      return null;
    });
  }

  static checkUserRole(user: any, role: string) {
    try {
      const roles = user.roles;
      if (roles.indexOf('administrator') >= 0) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }

  static grantAccess(action, resource) {
    return async (req: Request, res: Response, next: NextFunction) => {
      Auth.isLoggedin(req, res, async (err) => {
        if (err) {
          return next(err);
        }
        try {
          const authorized = Auth.authorize(action, resource);
          if (!authorized) {
            res.status(403).json({
              message:
                "You don't have enough permission to perform this action.",
            });
          } else {
            next();
          }
        } catch (error) {
          next(error);
        }
      });
    };
  }

  static authorize(action, resource) {
    // allow administrator everything
    if (Auth.checkUserRole(AuthController.user, 'administrator')) {
      return true;
    }

    let authorized = false;
    for (let i = 0; i < AuthController.user.roles.length; i++) {
      const role = AuthController.user.roles[i];
      const permission = roles.can(role)[action](resource);
      authorized = permission.granted;
      if (authorized) break;
    }
    return authorized;
  }
}
