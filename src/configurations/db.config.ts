import { DataSource } from 'typeorm';
import { User } from '../Entities/user';
import { UserLogin } from '../Entities/userlogin';

export const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  username:  process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
  logging: false,
  synchronize: true,
  entities: [User, UserLogin],
});
