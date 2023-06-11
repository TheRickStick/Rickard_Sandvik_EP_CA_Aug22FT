const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const db = require('../models/db');
const isAdmin = require('../middleware/isAdmin');

//POST order
router.post('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.authError) {
      return res.status(401).json({ message: req.authError });
    }
    const user = req.user;
    const itemId = req.params.id;

    const cart = await db.Cart.findOne({
      where: { UserId: user.id },
      include: [db.User],
    });

    if (!cart) {
      return res.status(404).json({ message: 'Please place an item in the cart first' });
    }

    const cartItem = await db.CartItem.findOne({
      where: { CartId: cart.id, ItemId: itemId },
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const quantity = cartItem.quantity;

    const item = await db.Item.findByPk(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.stock === 0) {
      return res.status(400).json({ message: 'Item is out of stock' });
    }

    if (quantity > item.stock) {
      return res
        .status(400)
        .json({ message: 'Not enough stock available', availableStock: item.stock });
    }

    const purchasePrice = cartItem.purchasePrice;

    const totalPrice = purchasePrice * quantity;

    const order = await db.Order.create({
      UserId: user.id,
      status: 'In Process',
    });

    const orderItem = await db.OrderItem.create({
      OrderId: order.id,
      ItemId: item.id,
      purchasePrice: purchasePrice,
      quantity: quantity,
      totalPrice: totalPrice,
    });

    await cartItem.destroy();

    item.stock -= quantity;
    await item.save();

    res.status(201).json({ orderItem, price: totalPrice });
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: 'An error occurred while processing the order' });
  }
});


// PUT /order/:id 
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (req.authError) {
      return res.status(401).json({ message: req.authError });
    }

    const orderId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['In Process', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Please use In Process, Complete, or Cancelled' });
    }

    const order = await db.Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot change status of a cancelled order' });
    }

    if (status === 'Cancelled') {
      order.status = status;
      await order.save();

      const orderItems = await db.OrderItem.findAll({ where: { OrderId: orderId } });

      for (const orderItem of orderItems) {
        const item = await db.Item.findByPk(orderItem.ItemId);
        item.stock += orderItem.quantity;
        await item.save();
      }

      return res.status(200).json({ message: 'Order cancelled successfully. Items returned to stock.', order });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: err.message });
  }
});





module.exports = router;

