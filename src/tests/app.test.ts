// Import required dependencies
import request from 'supertest';
import app from '../app';

// Mock the dataSource.initialize() function
jest.mock('../configurations/db.config', () => ({
  dataSource: {
    initialize: jest.fn(),
  },
}));

// Test suite for the App class
describe('App', () => {
  // Test case for the root route
  it('should respond with 200 OK for the root route', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Test case for the 404 route
  it('should respond with 404 Not Found for unknown routes', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Not Found.',
    });
  });

  it('should set the Access-Control-Allow-Origin header to "*"', async () => {
    const response = await request(app).get('/');
    expect(response.header['access-control-allow-origin']).toBe('*');
  });

});
