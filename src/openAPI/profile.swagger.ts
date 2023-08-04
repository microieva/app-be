import { responses } from './config';

const signup = {
  tags: ['Profile'],
  description: 'Signup user',
  operationId: 'signup',
  security: [
    {
      bearerAuth: [],
    },
  ],
  requestBody: {
    description: 'Optional description in *Markdown*',
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          $ref: '#/components/schemas/User',
        },
      },
    },
  },
  responses: responses.post,
};

const login = {
  tags: ['Profile'],
  description: 'Login api',
  operationId: 'login',
  security: [
    {
      basicAuth: [],
    },
  ],
  requestBody: {
    description: 'Optional description in *Markdown*',
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'rsethi@yopmail.com',
            },
            password: {
              type: 'string',
              example: 'RSeth2',
            },
          },
          required: ['email', 'password'],
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Logged-in',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
              },
              data: {
                type: 'object',
                properties: {
                  user: {
                    type: 'string',
                  },
                  token: {
                    type: 'string',
                  },
                  expires: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
    default: responses.post.default,
  },
};

const getProfile = {
  tags: ['Profile'],
  description: 'Returns logged-in user profile',
  operationId: 'getProfile',
  security: [
    {
      bearerAuth: [],
    },
  ],
  responses: {
    200: {
      description: 'User profile.',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/User',
          },
        },
      },
    },
    default: responses.post.default,
  },
};

const updateProfile = {
  tags: ['Profile'],
  description: 'Update logged-in user profile',
  operationId: 'updateProfile',
  security: [
    {
      bearerAuth: [],
    },
  ],
  requestBody: {
    description: 'Optional description in *Markdown*',
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          $ref: '#/components/schemas/User',
        },
      },
    },
  },
  responses: responses.put,
};

export { signup, login, getProfile, updateProfile };
