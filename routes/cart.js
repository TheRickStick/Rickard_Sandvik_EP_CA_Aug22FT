const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken'); 
const db = require('../models/db');

// Retrieve cart for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'You must be logged in to view this' });
    }

    const cart = await db.Cart.findOne({
      where: { UserId: user.id },
      include: [
        {
          model: db.Item,
          through: { attributes: ['quantity'] },
        },
      ],
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.json(cart);
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: 'An error occurred while retrieving the cart' });
  }
});
    

// DELETE /cart/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log('User:', user);
    if (!user) {
      return res.status(401).json({ message: 'You must be logged in to view this' });
    }

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
