const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken'); 
const db = require('../models/db');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log('User:', user);

    // Retrieve cart for logged-in user
    const cart = await db.Cart.findOne({
      where: { UserId: user.id },
      include: [
        {
          model: db.Item,
          through: { attributes: ['quantity'] } 
        }
      ]
    });
    console.log('Cart:', cart);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.json(cart);
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /cart/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log('User:', user);

    const { id } = req.params;
    console.log('Cart ID:', id);

    // Check if the cart exists
    const cart = await db.Cart.findOne({
      where: { id, UserId: user.id },
      include: {
        model: db.CartItem,
        include: { model: db.Item },
      },
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Transfer items back to stock
    for (const cartItem of cart.CartItems) {
      const { Item } = cartItem;

      // Transfer only the quantity of each cart item back to stock
      Item.stock += cartItem.quantity;
      await Item.save();
    }

    // Delete all cart items associated with the cart ID
    await db.CartItem.destroy({
      where: { CartId: id },
    });

    res.json({ message: 'Cart items deleted successfully' });
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
