// import nodemailer from 'nodemailer'
import { validateEmail } from '../functions';
const AWS = require('aws-sdk');

const SES_CONFIG = {
  accessKeyId: process.env.SES_ACCESS_KEY,
  secretAccessKey: process.env.SES_SECRET_KEY,
  region: process.env.SES_REGION,
};

export class MailService {
  async sendMail(
    recipientEmail: string,
    subject: string,
    text: string,
    html: string,
  ) {
    if (!(await validateEmail(recipientEmail))) {
      return console.error(`Invalid email ${recipientEmail}`);
    }

    const AWS_SES = new AWS.SES(SES_CONFIG);

    const params = {
      Source: 'vinod@test.com',
      Destination: {
        ToAddresses: [recipientEmail],
      },
      ReplyToAddresses: [],
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: html,
          },
          Text: {
            Charset: 'UTF-8',
            Data: text,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
    };
    return AWS_SES.sendEmail(params).promise();
  }
}

export const Mail: MailService = new MailService();
