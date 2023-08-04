export const responses = {
  post: {
    200: {
      description: 'Created',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
              },
              message: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    default: {
      description: 'Invalid request',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error',
          },
        },
      },
    },
  },
  put: {
    200: {
      description: 'Updated',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
              },
              message: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    default: {
      description: 'Invalid request',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error',
          },
        },
      },
    },
  },
  delete: {
    200: {
      description: 'Deleted',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
              },
            },
          },
        },
      },
    },
    default: {
      description: 'Invalid request',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error',
          },
        },
      },
    },
  },
};
