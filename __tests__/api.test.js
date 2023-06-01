const request = require('supertest');
const app = require('../app');
const db = require('../models/db');


describe('User Registration and Login', () => {
  let token;

  test('POST /signup - success', async () => {
    const user = {
      username: 'john_doe',
      password: 'P@ssword123',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    const response = await request(app)
      .post('/signup')
      .send(user)
      .expect(201)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('message', 'User successfully registered');
    expect(response.body).toHaveProperty('userId');
  });

  test('POST /login - success', async () => {
    const credentials = {
      username: 'john_doe',
      password: 'P@ssword123',
    };

    const response = await request(app)
      .post('/login')
      .send(credentials)
      .expect(200)
      .expect('Content-Type', /json/);

    const { data } = response.body;
    expect(data).toHaveProperty('token');
    token = data.token;
    console.log(token);
  });
});
