const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const db = require('../models/db');

// GET /cart
router.get('/', authenticateToken, async (req, res) => {
  if (req.authError) {
    return res.status(401).json({ message: req.authError });
  }

  try {
    const user = req.user;
    const cart = await db.Cart.findOne({
      where: { UserId: user.id },
      include: [
        {
          model: db.Item,
          through: {
            attributes: ['quantity', 'originalPrice', 'purchasePrice', 'totalPrice', 'moneySaved'],
          },
        },
      ],
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'An error occurred while retrieving the cart' });
  }
});



// DELETE /cart/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.authError) {
    return res.status(401).json({ message: req.authError });
  }

  try {
    const user = req.user;
    const { id } = req.params;

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
