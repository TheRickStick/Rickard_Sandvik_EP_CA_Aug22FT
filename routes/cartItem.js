const express = require('express');
const router = express.Router();
const db = require('../models/db');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin');

// POST /cartItem
router.post('/', authenticateToken, async (req, res) => {
  if (req.authError) {
    return res.status(401).json({ message: req.authError });
  }

  const { itemId } = req.body;

  if (!itemId) {
    return res.status(400).json({ message: 'itemId is a required field.' });
  }

  try {
    const user = req.user;
    const { itemId } = req.body;
    const item = await db.Item.findByPk(itemId);

    if (!item) {
      return res.status(404).json({ message: `The requested item with ID ${itemId} was not found` });
    }

    const cart = await db.Cart.findOne({
      where: { UserId: user.id },
    });

    if (!cart) {
      const newCart = await db.Cart.create({
        UserId: user.id,
      });

      const email = user.email;
      const usersWithSameEmail = await db.User.count({ where: { email } });
      let discount = 0;

      if (usersWithSameEmail === 2) {
        discount = 0.1;
      } else if (usersWithSameEmail === 3) {
        discount = 0.3;
      } else if (usersWithSameEmail >= 4) {
        discount = 0.4;
      }

      const quantity = req.body.quantity || 1;
      const originalPrice = item.price;
      const purchasePrice = originalPrice * (1 - discount);
      const totalPrice = purchasePrice * quantity;
      const moneySaved = originalPrice - purchasePrice;

      const cartItem = await db.CartItem.create({
        CartId: newCart.id,
        ItemId: item.id,
        quantity: quantity,
        originalPrice: originalPrice,
        purchasePrice: purchasePrice,
        totalPrice: totalPrice,
        moneySaved: moneySaved,
      });

      return res.status(201).json(cartItem);
    }

    if (item.stock === 0) {
      return res.status(400).json({ message: 'Item is out of stock' });
    }

    if (req.body.quantity > item.stock) {
      return res
        .status(400)
        .json({ message: 'Not enough stock available', availableStock: item.stock });
    }

    const existingCartItem = await db.CartItem.findOne({
      where: {
        CartId: cart.id,
        ItemId: item.id,
      },
    });

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + (req.body.quantity || 1);

      if (newQuantity > item.stock) {
        return res
          .status(400)
          .json({ message: 'Not enough stock available', availableStock: item.stock });
      }

      existingCartItem.quantity = newQuantity;
      existingCartItem.totalPrice = existingCartItem.purchasePrice * newQuantity;
      existingCartItem.moneySaved = existingCartItem.originalPrice - existingCartItem.totalPrice;

      await existingCartItem.save();

      return res.status(200).json(existingCartItem);
    }

    const email = user.email;
    const usersWithSameEmail = await db.User.count({ where: { email } });
    let discount = 0;

    if (usersWithSameEmail === 2) {
      discount = 0.1;
    } else if (usersWithSameEmail === 3) {
      discount = 0.3;
    } else if (usersWithSameEmail >= 4) {
      discount = 0.4;
    }

    const quantity = req.body.quantity || 1;
    const originalPrice = item.price;
    const purchasePrice = originalPrice * (1 - discount);
    const totalPrice = purchasePrice * quantity;
    const moneySaved = originalPrice - purchasePrice;

    const cartItem = await db.CartItem.create({
      CartId: cart.id,
      ItemId: item.id,
      quantity: quantity,
      originalPrice: originalPrice,
      purchasePrice: purchasePrice,
      totalPrice: totalPrice,
      moneySaved: moneySaved,
    });

    res.status(201).json(cartItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//PUT /cart_item/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.authError) {
      return res.status(401).json({ message: req.authError });
    }

    const { itemId, quantity } = req.body;

    if (!itemId || !quantity) {
      return res.status(400).json({ message: 'itemId and quantity are required.' });
    }

    const cartItem = await db.CartItem.findOne({
      where: { ItemId: itemId },
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    const item = await db.Item.findByPk(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const availableStock = item.stock;


    if (quantity > availableStock) {
      return res
        .status(400)
        .json({ message: 'Not enough stock available', availableStock });
    }

    cartItem.ItemId = itemId;
    cartItem.quantity = quantity;
    await cartItem.save();

    res.json(cartItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// DELETE /cart_item/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.authError) {
      return res.status(401).json({ message: req.authError });
    }

    const { id } = req.params;
    const user = req.user;

    const cart = await db.Cart.findOne({
      where: { UserId: user.id },
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const cartItem = await db.CartItem.findOne({
      where: { ItemId: id, CartId: cart.id },
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    const item = await db.Item.findByPk(cartItem.ItemId);

    item.stock += cartItem.quantity;
    await item.save();

    await cartItem.destroy();

    res.json({ message: 'Cart item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
