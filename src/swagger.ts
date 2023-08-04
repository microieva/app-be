import {
  signup,
  login,
  getProfile,
  updateProfile,
} from './openAPI/profile.swagger';

export const swaggerDocument = {
  openapi: '3.0.1',
  info: {
    version: '1.0.0',
    title: 'Node Swagger API',
    description:
      'Hello i am swagger. I am one step ahead of postman. My job is to provide API description.',
    termsOfService: '',
    contact: {
      name: '',
      email: '',
      url: 'https://',
    },
    license: {
      name: 'Apache 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
    },
  },
  servers: [
    {
      url: 'http://localhost:4242/api/v1',
      description: 'Local server',
    },
    {
      url: 'http://localhost:4242/api/v1',
      description: 'Development server',
    },
    {
      url: 'http://localhost:4242/api/v1',
      description: 'Production server',
    },
    // {
    //     url: 'https://api2.test.com/api/v1',
    //     description: 'Staging server'
    // },
    /* {
            "url": "https://{env}.gigantic-server.com:{port}/{basePath}",
            "description": "The production API server",
            "variables": {
                "env": {
                    "default": "app-dev",
                    "description": "DEV Environment"
                },
                "port": {
                    "enum": [
                        "8443",
                        "3000",
                        "443"
                    ],
                    "default": "8443"
                },
                "basePath": {
                    "default": "v1"
                }
            }
        } */
  ],
  components: {
    schemas: {
      User: {
        properties: {
          _id: {
            readOnly: true,
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          password: {
            type: 'string',
            format: 'password',
            writeOnly: true,
          },
          // roles: {
          //     type: 'array',
          //     items: {
          //         type: 'string',
          //         enum: ['standard', 'support', 'assistant', 'administrator']
          //     }
          // },
          username: {
            type: 'string',
          },
          avatar: {
            type: 'string',
            format: 'binary',
          },
          dob: {
            type: 'string',
            format: 'date',
          },
          gender: {
            type: 'string',
          },

          occupation: {
            type: 'string',
          },
          promoted_by: {
            type: 'string',
          },
          referred_by: {
            type: 'string',
          },
        },
        required: ['email', 'password', 'username', 'roles'],
      },
      Error: {
        properties: {
          success: {
            type: 'boolean',
            default: false,
          },
          message: {
            type: 'string',
          },
        },
        required: ['message'],
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic',
      },
    },
  },
  tags: [],
  paths: {
    '/signup': {
      post: signup,
    },
    '/login': {
      post: login,
    },
    '/profile': {
      get: getProfile,
      put: updateProfile,
    },
  },
};
