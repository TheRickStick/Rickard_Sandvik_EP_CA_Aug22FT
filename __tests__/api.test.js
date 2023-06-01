const request = require('supertest');
const app = require('../app');
const db = require('../models/db');


describe('User Registration and Login', () => {
  let userToken;
  let adminToken;
  let categoryId;
  let itemId;
  let userId;

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
    userId = response.body.userId; // Assign userId here
  });
  
  
  test('POST /login - success (User)', async () => {
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
    userToken = data.token;
    console.log('User Token:', userToken);
  });

  test('POST /login - success (Admin)', async () => {
    const adminCredentials = {
      username: 'admin',
      password: 'P@ssword2023',
    };

    const response = await request(app)
      .post('/login')
      .send(adminCredentials)
      .expect(200)
      .expect('Content-Type', /json/);

    const { data } = response.body;
    expect(data).toHaveProperty('token');
    adminToken = data.token;
    console.log('Admin Token:', adminToken);
  });

  test('POST /category - create a new category with the name CAT_TEST', async () => {
    const category = {
      name: 'CAT_TEST',
    };
  
    const response = await request(app)
      .post('/category')
      .send(category)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201)
      .expect('Content-Type', /json/);
  
    expect(response.body).toHaveProperty('message', 'Category created successfully');
    expect(response.body).toHaveProperty('category');
    categoryId = response.body.category.id; // Assign categoryId here
  });

  test('POST /item - create a new item with the CAT_TEST category and the ITEM_TEST item name', async () => {
    const item = {
      name: 'ITEM_TEST',
      categoryId: 1,
      price: 999,
      stock: 100,
      sku: 'SKU_TEST', 
    };
  
    const response = await request(app)
      .post('/item')
      .send(item)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201)
      .expect('Content-Type', /json/);
  
    expect(response.body).toHaveProperty('message', 'Item created successfully');
    expect(response.body).toHaveProperty('item');
    itemId = response.body.item.id;
  });

  test('POST /search - search for items with the text “mart” in the item name', async () => {
    const searchQuery = {
      itemName: 'mart',
    };
  
    const response = await request(app)
      .post('/search')
      .send(searchQuery)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect('Content-Type', /json/);
  
    expect(response.body).toHaveProperty('items');
    expect(response.body.items.length).toEqual(3);
  });

  test('POST /search - search for items with the name “Laptop”', async () => {
    const searchQuery = {
      itemName: 'Laptop',
    };
  
    const response = await request(app)
      .post('/search')
      .send(searchQuery)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect('Content-Type', /json/);
  
    expect(response.body).toHaveProperty('items');
    expect(response.body.items.length).toEqual(1);
  });

  test('DELETE /user/:id - delete the user', async () => {
    await request(app)
      .delete(`/user/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
  
  test('DELETE /item/:id - delete the item', async () => {
    await request(app)
      .delete(`/item/${itemId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
  
  test('DELETE /category/:id - delete the category', async () => {
    await request(app)
      .delete(`/category/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  test('POST /setup - Database already populated', async () => {
    const response = await request(app)
      .post('/setup')
      .expect(409)  
      .expect('Content-Type', /json/);
  
    expect(response.body).toHaveProperty('message', 'Database already populated');
  }, 30000);
});
