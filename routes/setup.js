const express = require('express');
const http = require('http');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../models/db');

router.post('/', async function (req, res) {
  try {
    console.log('Before itemsExist check');
    const itemsExist = await db.Item.count();
    console.log('after itemsExist check');

    if (itemsExist > 0) {
      return res.status(409).json({ message: "Database already populated" });
    }

    const options = {
      hostname: '143.42.108.232',
      port: 8888,
      path: '/items/stock',
      method: 'GET'
    };

    const request = http.request(options, async (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', async () => {
        console.log("Data from API: ", data);
        const jsonData = JSON.parse(data);

        if (!Array.isArray(jsonData.data)) {
          return res.status(500).json({ message: "Invalid data from API", data: jsonData });
        }

        // Populate items
        for (let item of jsonData.data) {
          const [category] = await db.Category.findOrCreate({ where: { name: item.category } });
          await db.Item.create({
            name: item.item_name,
            sku: item.sku,
            price: item.price,
            stock: item.stock_quantity,
            img_url: item.img_url,
            CategoryId: category.id
          });
        }

        // Populate roles
        const roles = ["Admin", "User"];
        for (let role of roles) {
          await db.Role.findOrCreate({ where: { name: role } });
        }

        // Create Admin if not exist
        const hashedPassword = await bcrypt.hash('P@ssword2023', 10);
        const [adminRole] = await db.Role.findOrCreate({ where: { name: 'Admin' } });

        const [adminUser, created] = await db.User.findOrCreate({
          where: { username: 'admin' },
          defaults: {
            username: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            password: hashedPassword,
            discount: 0,
            RoleId: adminRole.id
          }
        });

        console.log("Admin User:", adminUser);
        console.log("Created:", created);

        if (created) {
          console.log("Admin user was created");
        } else {
          console.log("Admin user already exists");
        }

        return res.status(200).json({ message: "Database successfully populated" });
      });
    });

    request.on('error', (error) => {
      console.error(error);
      return res.status(500).json({ message: "An error occurred", error: error.message });
    });

    request.end();

  } catch (error) {
    return res.status(500).json({ message: "An error occurred", error: error.message });
  }
});

module.exports = router;
