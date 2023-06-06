const express = require('express');
const router = express.Router();
const db = require('../models/db');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log('User:', user);
    if (!user) {
      return res.status(401).json({ message: 'You must be logged in to view this' });
    }

    const { itemId, purchasePrice } = req.body;
    console.log('Request Body:', req.body);

    // Find the item by itemId
    const item = await db.Item.findByPk(itemId);
    console.log('Item:', item);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if the user already has a cart
    const cart = await db.Cart.findOne({
      where: { UserId: user.id },
    });

    if (!cart) {
      // User does not have a cart, create a new cart
      const newCart = await db.Cart.create({
        UserId: user.id,
      });

      // Create a new cart item
      const cartItem = await db.CartItem.create({
        CartId: newCart.id,
        ItemId: item.id,
        purchasePrice: item.price,
        quantity: req.body.quantity || 1, // Default 1
      });

      console.log('Cart Item:', cartItem);
      return res.status(201).json(cartItem);
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

    // Check if the item already exists in the cart
    const existingCartItem = await db.CartItem.findOne({
      where: {
        CartId: cart.id,
        ItemId: item.id,
      },
    });

    if (existingCartItem) {
      // Item  exists in cart, update the quantity 
      const newQuantity = existingCartItem.quantity + (req.body.quantity || 1);

      // Check the updated quantity exceeds stock
      if (newQuantity > item.stock) {
        return res
          .status(400)
          .json({ message: 'Not enough stock available', availableStock: item.stock });
      }

      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();

      console.log('Updated Cart Item:', existingCartItem);
      return res.status(200).json(existingCartItem);
    }

    // Create a new cart item
    const cartItem = await db.CartItem.create({
      CartId: cart.id,
      ItemId: item.id,
      purchasePrice: item.price,
      quantity: req.body.quantity || 1, // Default 1
    });


    console.log('Cart Item:', cartItem);
    res.status(201).json(cartItem);
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: err.message });
  }
});



router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log('User:', user);
    if (!user) {
      return res.status(401).json({ message: 'You must be logged in to view this' });
    }

    const { id } = req.params;
    console.log('Cart Item ID:', id);

    const { itemId, quantity } = req.body;
    console.log('Request Body:', req.body);

    // Find the cart item by id and item ID
    const cartItem = await db.CartItem.findOne({
      where: { ItemId: itemId },
    });
    console.log('Cart Item:', cartItem);

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Check if the cart item belongs to the user's cart and has the correct item ID
    const cart = await db.Cart.findOne({
      where: { UserId: user.id, id: cartItem.CartId },
    });

    if (!cart) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if the new quantity is greater than the item's stock
    const item = await db.Item.findByPk(itemId);
    console.log('Item:', item);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }


    // Update the itemId and quantity of the cart item
    cartItem.ItemId = itemId;
    cartItem.quantity = quantity;
    await cartItem.save();

    res.json(cartItem);
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: err.message });
  }
});


// DELETE /cart_item/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log('User:', user);
    if (!user) {
      return res.status(401).json({ message: 'You must be logged in to view this' });
    }

    const { id } = req.params;
    console.log('Cart Item ID:', id);

    // Find the cart item by item ID
    const cartItem = await db.CartItem.findOne({
      where: { ItemId: id },
      include: {
        model: db.Cart,
        where: { UserId: user.id },
      },
    });
    console.log('Cart Item:', cartItem);

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Get the item associated with the cart item
    const item = await db.Item.findByPk(cartItem.ItemId);

    // Transfer the quantity of the cart item back to stock
    item.stock += cartItem.quantity;
    await item.save();

    // Delete the cart item
    await cartItem.destroy();

    res.json({ message: 'Cart item deleted' });
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: err.message });
  }
});





module.exports = router;
