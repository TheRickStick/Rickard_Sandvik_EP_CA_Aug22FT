const request = require('supertest');
const app = require('../app.js');
const db = require('../models/db');

describe('API Endpoint Tests', () => {
  beforeAll(async () => {
    // Delete all existing data from the tables
    await db.Item.destroy({ where: {} });
    await db.Category.destroy({ where: {} });
    await db.Role.destroy({ where: {} });
    await db.User.destroy({ where: {} });
  });

  test('POST /setup should check if database is populated, make API call, and populate empty database', async () => {
    // Increase the timeout to 20 seconds (20000 milliseconds)
    jest.setTimeout(20000);

    // Make API call to check if database is populated
    const checkResponse = await request(app).post('/setup');
    expect(checkResponse.status).toBe(200);

    // Make API call to populate empty database
    const populateResponse = await request(app).post('/setup');
    expect(populateResponse.status).toBe(200);
  });
});