import { User } from '../entities/user';
import { UserLogin } from '../entities/userlogin';
import dataSource from '../configurations/db.config';
import bcrypt from 'bcrypt';
import { CONSTANT } from '../utils/constant';
import { APIError } from '../utils/errorhandler';
/* eslint-disable no-useless-catch */
export class UserRepository {
  static async createUser(user: any) {
    try {
      const repository = dataSource.getRepository(User);
      user.email = String(user.email).toLowerCase();
      if ('password' in user) {
        user.salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, user.salt);
      }
      if (typeof user.roles === 'undefined') {
        user.roles = [];
      }
      if (Array.isArray(user.roles) && user.roles.length === 0) {
        user.roles.push('standard');
      }
      const savedUser = await repository.save(user);
      return savedUser;
    } catch (error) {
      throw error; // Rethrow the error to be caught by the calling code
    }
  }

  static async findUserByEmail(email: string) {
    try {
      const repository = dataSource.getRepository(User);
      const user = await repository.findOne({
        select: {
          id: true,
          firstname: true,
          lastname: true,
          last_login_at: true,
          email: true,
          roles: true,
          password: true,
          salt: true,
          is_active: true,
          blocked_till: true,
        },
        where: {
          email,
        },
      });

      if (!user || !user.email) {
        await this.addLoginMessage(email, 'failure', CONSTANT.INCORRECT_EMAIL);
        throw new APIError(
          CONSTANT.INCORRECT_EMAIL,
          400,
          CONSTANT.INCORRECT_EMAIL,
          false,
        );
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async addLoginMessage(
    email: string,
    text: string,
    message: string,
    userId = null,
  ) {
    try {
      const repositoryLogin = dataSource.getRepository(UserLogin);
      await repositoryLogin.save({ email, login_type: text, message, userId });
    } catch (error) {
      throw error; // Rethrow the error to be caught by the calling code
    }
  }

  static async updateUser(userId, updateObj) {
    try {
      const repositoryLogin = dataSource.getRepository(User);
      await repositoryLogin.update({ id: userId }, updateObj);
    } catch (error) {
      throw error; // Rethrow the error to be caught by the calling code
    }
  }
}

/* eslint-enable no-useless-catch */
