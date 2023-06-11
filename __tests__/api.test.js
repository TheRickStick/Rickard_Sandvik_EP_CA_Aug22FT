const request = require('supertest');
const app = require('../app');
const db = require('../models/db');

beforeAll(async () => {
  await db.sequelize.sync();
});


afterAll(async () => {
  await db.sequelize.close();
});


describe('POST /setup', () => {
  beforeEach(async () => {
    await db.sequelize.sync();
  });

  test('Checks if database is populated, makes API call to Noroff API, and populates empty database', async () => {
    const response = await request(app).post('/setup');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'Database successfully populated' });
  });

  test('Checks if database is populated, if populated return', async () => {


    const response = await request(app).post('/setup');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(response.statusCode).toBe(409);
    expect(response.body).toEqual({ message: 'Database already populated' });
  });
});


describe('User Registration and Login', () => {
  let userToken;
  let adminToken;
  let categoryId;
  let itemId;
  let userId;


  test('POST /signup - success', async () => {
    const user = {
      username: 'MistenkeligRepeterendeHippi',
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
    userId = response.body.userId;
  });


  test('POST /login - success (User)', async () => {
    const credentials = {
      username: 'MistenkeligRepeterendeHippi',
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

  describe('Category and Item Creation', () => {
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
      categoryId = response.body.category.id;
    });



    test('POST /item - create a new item with the CAT_TEST category and the ITEM_TEST item name', async () => {
      const item = {
        name: 'ITEM_TEST',
        categoryId: 1,
        price: 999,
        stock: 100,
        sku: 'SKU_TEST',
        img_url: 'https://example.com/item.png',
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
  });

  describe('Search', () => {
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
  });

  describe('Using User on Admin Endpoints', () => {
    let userToken;
    let itemId;
    let orderId;

    beforeAll(async () => {
      const credentials = {
        username: 'MistenkeligRepeterendeHippi',
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

    describe('PUT /item/:id', () => {
      test('Update item (forbidden)', async () => {
        const updatedItem = {
          name: 'Updated Item',
          sku: 'UPDATED_SKU',
          price: 999,
          stock: 50,
          img_url: 'https://example.com/updated_item.png',
          categoryId: 1,
        };

        const response = await request(app)
          .put(`/item/${itemId}`)
          .send(updatedItem)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403)
          .expect('Content-Type', /json/);

        const { message } = response.body;
        expect(message).toBe('Only admin can perform this action');
      });
    });

    describe('PUT /order/:id', () => {
      test('Update order (forbidden)', async () => {
        const updatedOrder = {
          status: 'Complete',
        };

        const response = await request(app)
          .put(`/order/${orderId}`)
          .send(updatedOrder)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403)
          .expect('Content-Type', /json/);

        const { message } = response.body;
        expect(message).toBe('Only admin can perform this action');
      });
    });

    describe('GET /allcarts', () => {
      test('Access allcarts as a regular user (forbidden)', async () => {
        const response = await request(app)
          .get('/allcarts')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403)
          .expect('Content-Type', /json/);

        const { message } = response.body;
        expect(message).toBe('Only admin can perform this action');
      });
    });
  });


  describe('Deletion', () => {
    test('DELETE /user/:id - delete the user', async () => {
      await request(app)
        .delete(`/user/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe(`User with ID ${userId} has been successfully deleted`);
        });
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
  });

  describe('Database Already Populated', () => {
    test('POST /setup - Database already populated', async () => {
      const response = await request(app)
        .post('/setup')
        .expect(409)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', 'Database already populated');
    }, 30000);
  });
});


