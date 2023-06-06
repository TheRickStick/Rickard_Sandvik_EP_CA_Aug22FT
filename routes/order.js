const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const db = require('../models/db');

router.post('/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const itemId = req.params.id;

    // Check if the user already has a cart
    const cart = await db.Cart.findOne({
      where: { UserId: user.id },
      include: [db.User], 
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

    const quantity = cartItem.quantity; 

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
    if (quantity > item.stock) {
      return res
        .status(400)
        .json({ message: 'Not enough stock available', availableStock: item.stock });
    }

    // Calculate the discount based on the number of users with the same email address
    const email = cart.User.email;
    const usersWithSameEmail = await db.User.count({ where: { email } });
    let discount = 0;

    if (usersWithSameEmail === 2) {
      discount = 0.1; 
    } else if (usersWithSameEmail === 3) {
      discount = 0.3; 
    } else if (usersWithSameEmail >= 4) {
      discount = 0.4; 
    }

    // Calculate the purchase price with discount
    const purchasePrice = item.price * (1 - discount);

    // Calculate total price
    const totalPrice = purchasePrice * quantity;

    // Create a new order
    const order = await db.Order.create({
      UserId: user.id,
      status: 'In Process',
    });

    // Create a new order item
    const orderItem = await db.OrderItem.create({
      OrderId: order.id,
      ItemId: item.id,
      purchasePrice: purchasePrice,
      quantity: quantity,
      discount: discount,
      totalPrice: totalPrice,
    });

     // Delete the cart item
     await cartItem.destroy();

    // Update the stock of the item in the items table
    item.stock -= quantity; 
    await item.save();

    res.status(201).json({ orderItem, price: totalPrice, discount: discount });
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: 'An error occurred while processing the order' });
  }
});

// PUT /order/:id - Update order status (only Admin User)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const orderId = req.params.id;
    const { status } = req.body;

    if (user.Role.name !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if the provided status is valid
    const validStatuses = ['In Process', 'Complete', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status, Please Use In Process, Complete or Cancelled' });
    }

    // Find the order by orderId
    const order = await db.Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update the order status
    order.status = status;
    await order.save();

    // If the order is cancelled, return the items to stock
    if (status === 'Cancelled') {
      const orderItems = await db.OrderItem.findAll({ where: { OrderId: orderId } });

      // Update the stock of each item in the order
      for (const orderItem of orderItems) {
        const item = await db.Item.findByPk(orderItem.ItemId);
        item.stock += orderItem.quantity;
        await item.save();
      }
    }

    res.json(order);
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;

