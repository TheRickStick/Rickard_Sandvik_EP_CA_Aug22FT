var express = require('express');
var router = express.Router();
var db = require('../models/db');
var authenticateToken = require('../middleware/authenticateToken'); 
// GET /cart
router.get('/cart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await db.Cart.findOne({
      where: { UserId: userId },
      include: [{ model: db.Item }],
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.json(cart);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /allcarts
router.get('/allcarts', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (user.Role.name !== 'Admin') {
      return res.status(403).json({ message: 'Only admin can access this endpoint' });
    }

    const carts = await db.Cart.findAll({
      include: [
        {
          model: db.User,
          attributes: ['firstName', 'lastName'],
        },
        {
          model: db.Item,
        },
      ],
    });

    res.json(carts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /cart_item
router.post('/cart_item', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, quantity, purchasePrice } = req.body;

    const item = await db.Item.findByPk(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const cart = await db.Cart.findOne({ where: { UserId: userId } });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await db.CartItem.create({
      CartId: cart.id,
      ItemId: itemId,
      quantity,
      purchasePrice,
    });

    res.status(201).json({ message: 'Item added to cart successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /cart_item/:id
router.put('/cart_item/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    const cartItem = await db.CartItem.findByPk(cartItemId, {
      include: [{ model: db.Cart, where: { UserId: userId } }],
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    const item = await db.Item.findByPk(cartItem.ItemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if there is enough stock for the desired quantity
    if (quantity > item.stock) {
      return res.status(400).json({ message: 'Insufficient stock for the desired quantity' });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({ message: 'Cart item quantity updated successfully' });
} catch (err) {
  console.log(err);
  res.status(500).json({ message: err.message });
}
});

// DELETE /cart_item/:id
router.delete('/cart_item/:id', authenticateToken, async (req, res) => {
try {
  const userId = req.user.id;
  const cartItemId = req.params.id;

  const cartItem = await db.CartItem.findOne({
    where: { id: cartItemId },
    include: [{ model: db.Cart, where: { UserId: userId } }],
  });

  if (!cartItem) {
    return res.status(404).json({ message: 'Cart item not found' });
  }

  await cartItem.destroy();

  res.json({ message: 'Cart item deleted successfully' });
} catch (err) {
  console.log(err);
  res.status(500).json({ message: err.message });
}
});

// DELETE /cart/:id
router.delete('/cart/:id', authenticateToken, async (req, res) => {
try {
  const userId = req.user.id;
  const cartId = req.params.id;

  const cart = await db.Cart.findOne({ where: { id: cartId, UserId: userId } });

  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  await cart.destroy();

  res.json({ message: 'Cart deleted successfully' });
} catch (err) {
  console.log(err);
  res.status(500).json({ message: err.message });
}
});

module.exports = router;