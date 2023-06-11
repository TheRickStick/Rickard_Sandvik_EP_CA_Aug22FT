const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const axios = require('axios');
const db = require('../models/db');

router.post('/', async (req, res) => {
  try {
    const itemsExist = await db.Item.count();

    if (itemsExist > 0) {
      return res.status(409).json({ message: "Database already populated" });
    }

    const apiUrl = 'http://143.42.108.232:8888/items/stock';

    const response = await axios.get(apiUrl);

    const jsonData = response.data;

    if (!Array.isArray(jsonData.data)) {
      return res.status(500).json({ message: "Invalid data from API", data: jsonData });
    }

    for (const item of jsonData.data) {
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

    const roles = ["Admin", "User"];
    for (const role of roles) {
      await db.Role.findOrCreate({ where: { name: role } });
    }

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

    if (created) {
      console.log("Admin user was created");
    } else {
      console.log("Admin user already exists");
    }

    return res.status(200).json({ message: "Database successfully populated" });

  } catch (error) {
    return res.status(500).json({ message: "An error occurred", error: error.message });
  }
});

module.exports = router;
