var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var db = require('../models/db');

router.post('/', async function (req, res) {

  console.log('Before itemsExist check');
  const itemsExist = await db.Item.count();
  console.log('Items exist:', itemsExist);

  if (itemsExist > 0) {
    return res.status(409).json({ message: "Database already populated" });
  }

  try {
    // Fetch Noroff API
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://143.42.108.232:8888/items/stock');
    const data = await response.json();

    console.log("Data from API: ", data); 

    const items = data.data; 

// Check array 
if (Array.isArray(items)) {
  // Populate 
  for (let item of items) {
    const mappedItem = {
      name: item.item_name, 
      sku: item.sku, 
      price: item.price, 
      stock: item.stock_quantity,
      img_url: item.img_url, 
    };

    const [category] = await db.Category.findOrCreate({ where: { name: item.category } });
    await db.Item.create({ ...mappedItem, CategoryId: category.id });
  }
} else {
  return res.status(500).json({ message: "Invalid data from API", data: data });
}

   // Populate roles
const roles = ["Admin", "User"];
for (let role of roles) {
  await db.Role.findOrCreate({ where: { name: role } });
}

// Create Admin if not exist
const hashedPassword = await bcrypt.hash('P@ssword2023', 10);
const [adminRole] = await db.Role.findOrCreate({ where: { name: 'Admin' } });

// Check if Admin user exists or create one.
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


  } catch (error) {
    return res.status(500).json({ message: "An error occurred", error: error.message });
  }
});

module.exports = router;
