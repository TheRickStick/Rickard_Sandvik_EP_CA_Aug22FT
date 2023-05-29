var express = require('express');
var router = express.Router();
var db = require('../models/db');
var authenticateToken = require('../middleware/authenticateToken'); 

router.get('/', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
  
      if (user.isAdmin) {
        // Fetch all orders for the admin user
        const orders = await db.Order.findAll({
          include: [
            { model: db.User, attributes: ['firstName', 'lastName'] },
            { model: db.OrderItem, include: { model: db.Item } },
          ],
        });
  
        res.json(orders);
      } else {
        // Fetch orders for the logged-in user
        const orders = await db.Order.findAll({
          where: { UserId: user.id },
          include: [
            { model: db.User, attributes: ['firstName', 'lastName'] },
            { model: db.OrderItem, include: { model: db.Item } },
          ],
        });
  
        res.json(orders);
      }
    } catch (err) {
      console.log('Error:', err);
      res.status(500).json({ message: err.message });
    }
  });
  

module.exports = router;