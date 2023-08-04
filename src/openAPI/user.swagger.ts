import { responses } from './config';

const createUser = {
  tags: ['Users'],
  description: 'Create user',
  operationId: 'createUser',
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

const getUsers = {
  tags: ['Users'],
  description: 'Returns all users from the system that the user has access to',
  operationId: 'getUsers',
  security: [
    {
      bearerAuth: [],
    },
  ],
  responses: {
    200: {
      description: 'A list of users.',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/User',
            },
          },
        },
      },
    },
    default: responses.post.default,
  },
};

const getSingleUser = {
  tags: ['Users'],
  description: 'Returns single user by id',
  operationId: 'getSingleUser',
  security: [
    {
      bearerAuth: [],
    },
  ],
  parameters: [
    {
      name: 'userId',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  responses: {
    200: {
      description: 'Single user.',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            $ref: '#/components/schemas/User',
          },
        },
      },
    },
    default: responses.post.default,
  },
};

const updateUser = {
  tags: ['Users'],
  description: 'Update user by id',
  operationId: 'updateUser',
  security: [
    {
      bearerAuth: [],
    },
  ],
  parameters: [
    {
      name: 'userId',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
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

const patchUser = {
  tags: ['Users'],
  description: 'Update user satus by id',
  operationId: 'patchUser',
  security: [
    {
      bearerAuth: [],
    },
  ],
  parameters: [
    {
      name: 'userId',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
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
            is_active: {
              type: 'boolean',
              enum: [true, false],
            },
          },
        },
      },
    },
  },
  responses: responses.put,
};

const deleteUser = {
  tags: ['Users'],
  description: 'Delete user by id',
  operationId: 'deleteUser',
  security: [
    {
      bearerAuth: [],
    },
  ],
  parameters: [
    {
      name: 'userId',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  responses: responses.delete,
};

export {
  createUser,
  updateUser,
  patchUser,
  deleteUser,
  getUsers,
  getSingleUser,
};
