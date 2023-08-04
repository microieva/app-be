const baseEnv = {
  'NODE_ENV': 'development',
  'HOST': '0.0.0.0',
  'PORT': '4242',
  'API_BASE': '/api/v1',
  'API_URL': 'http://localhost:4242/api/v1',
  'BASE_URL': 'http://localhost:4242/api/v1',
  'ADMIN_URL': 'http://localhost:4242/api/v',
  'VIDEOS_DIR': '/Web_Data/Videos/',
  'UPLOADS_DIR': '/Web_Data/Uploads/',

  'DEFAULT_TIMEZONE': 'Asia/Kolkata',
  'JWT_SECRET': 'p[V(<8^sp,$vyZ3kwKbu>9_#K',
  'SESS_SECRET': '8jdP]yZb*f"]x<T^65Us7pG%',
  'BASIC_AUTH_PASS': 'p@$$w0rd',

  'DB_HOST': 'localhost',
  'DB_PORT': '27017',
  'DB_AUTH': 'false',
  'DB_USER': 'rahul',
  'DB_PASS': 'RSeth2',
  'DB_NAME': 'tickets',

  'SMTP_HOST': 'smtp.mailgun.org',
  'SMTP_PORT': '587',
  'SMTP_USER': '',
  'SMTP_PASS': '',

  'S3_ACCESS_KEY': '',
  'S3_SECRET_KEY': '',
  'S3_BUCKET': 'climetsafety',
  'S3_REGION': 'us-east-1',

  'SES_ACCESS_KEY': '',
  'SES_SECRET_KEY': '+',
  'SES_REGION': 'ap-south-1',

  'FEEDBACK_EMAIL': ''
}

const baseEnvClone = Object.assign({}, baseEnv)
const prodEnv = Object.assign(baseEnvClone, {
  'NODE_ENV': 'production',
  'HOST': '0.0.0.0',
  'PORT': '8081',
  'API_BASE': '/api/v1',
  'API_URL': 'http://localhost:4242/api/v',
  'API_ENV': 'AWS',
  'ADMIN_URL': 'http://localhost:4242/api/v',
  'UPLOADS_DIR': '/Web_Data/Energized_Uploads/',

  'DEFAULT_TIMEZONE': 'Asia/Kolkata',
  'DB_HOST': 'localhost',
  'DB_PORT': '27017',
  'DB_AUTH': 'false',
  'DB_USER': 'xxxx',
  'DB_PASS': 'xxxx',
  'DB_NAME': 'safety climet'
})

module.exports = {
  apps: [{
    name: 'safety clemet',
    script: './dist/index.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    node_args: '--require dotenv/config',
    args: '',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: baseEnv,
    env_production: prodEnv
  }]
}
