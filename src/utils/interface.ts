import { Session } from 'express-session';
export interface UserInfo {
  id?: string;
  _id?: string;
  firstname: string;
  lastname: string;
  email: string;
  salt: string;
  password?: string;
  username?: string;
  roles?: string[];
  dob?: Date;
  gender?: string;
  consent_flag?: boolean;
  created_at?: Date;
  updated_at?: Date;
  is_active?: boolean;
  is_deleted?: boolean;
  school_group?: any[];
  __v?: number;
  blocked_till?: Date;
  last_login_at?: Date;
}

export interface Token {
  user_id: string;
  token_type: string;
  token: string;
}

export interface CustomSessionData extends Session {
  user: {
    id?: string;
    _id?: string;
    firstname: string;
    lastname: string;
    email: string;
    salt: string;
    password?: string;
    username?: string;
    roles?: string[];
    dob?: Date;
    gender?: string;
    consent_flag?: boolean;
    created_at?: Date;
    updated_at?: Date;
    is_active?: boolean;
    is_deleted?: boolean;
    school_group?: any[];
    __v?: number;
    blocked_till?: Date;
    last_login_at?: Date;
  };
}
