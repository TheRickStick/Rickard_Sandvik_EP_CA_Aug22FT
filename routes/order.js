const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const db = require('../models/db');

// POST /order/:id - Place an order for a specific item
router.post('/:id', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      const itemId = req.params.id;
  
      // Check if the user already has a cart
      const cart = await db.Cart.findOne({
        where: { UserId: user.id },
      });
  
      // Check if the cart exists
      if (!cart) {
        return res.status(404).json({ message: 'Please place an item in the cart first' });
      }
  
      // Check if the item exists in the user's cart
      const cartItem = await db.CartItem.findOne({
        where: { CartId: cart.id, ItemId: itemId },
      });
  
      if (!cartItem) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }
  
      // Find the item by itemId
      const item = await db.Item.findByPk(itemId);
  
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
  
      // Check if the item is out of stock
      if (item.stock === 0) {
        return res.status(400).json({ message: 'Item is out of stock' });
      }
  
      // Check if the requested quantity exceeds the available stock
      if (req.body.quantity > item.stock) {
        return res
          .status(400)
          .json({ message: 'Not enough stock available', availableStock: item.stock });
      }
  
      // Create a new order
      const order = await db.Order.create({
        UserId: user.id,
        status: 'In Process',
      });
  
      // Create a new order item
      const orderItem = await db.OrderItem.create({
        OrderId: order.id,
        ItemId: item.id,
        purchasePrice: item.price,
        quantity: req.body.quantity || 1, // Default quantity is 1
      });
  
      // Update the stock of the item in the items table
      item.stock -= req.body.quantity;
      await item.save();
  
      res.status(201).json({ order, orderItem });
    } catch (err) {
      console.log('Error:', err);
      res.status(500).json({ message: 'An error occurred while processing the order' });
    }
  });
  
  
  // PUT /order/:id - Update order status (accessible only to Admin User)
  router.put('/:id', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      const orderId = req.params.id;
      const { status } = req.body;
  
      if (user.Role.name !== 'Admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      // Find the order by orderId
      const order = await db.Order.findByPk(orderId);
  
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      // Update the order status
      order.status = status;
      await order.save();
  
      res.json(order);
    } catch (err) {
      console.log('Error:', err);
      res.status(500).json({ message: err.message });
    }
  });
  
  module.exports = router;
  