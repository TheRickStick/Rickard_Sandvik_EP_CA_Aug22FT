const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../models/db');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin');

// POSST Signup
router.post('/signup', async (req, res) => {
  const { username, password, email, firstName, lastName } = req.body;
  const missingFields = [];

  if (!username) {
    missingFields.push('username');
  }
  if (!password) {
    missingFields.push('password');
  }
  if (!email) {
    missingFields.push('email');
  }
  if (!firstName) {
    missingFields.push('firstName');
  }
  if (!lastName) {
    missingFields.push('lastName');
  }

  if (missingFields.length > 0) {
    return res.status(400).json({ message: "Missing required fields", missingFields });
  }

  const user = await db.User.findOne({ where: { username } });
  if (user) {
    return res.status(400).json({ message: "Username already exists" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }


  const hashedPassword = await bcrypt.hash(password, 10);

  const userRole = await db.Role.findOne({ where: { name: "User" } });
  console.log('UserRole:', userRole);

  try {
    const newUser = await db.User.create({ username, password: hashedPassword, email, firstName, lastName, RoleId: userRole.id });
    return res.status(201).json({ message: "User successfully registered", userId: newUser.id });
  } catch (error) {
    console.error("Error creating new user:", error);
    return res.status(500).json({ message: "An error occurred while registering the user" });
  }
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


//POST login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required fields.' });
  }

  const user = await db.User.findOne({ where: { username } });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ message: "Incorrect password" });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });

  return res.status(200).json({ message: "User successfully logged in", data: { token } });


});

// DELETE /user/:id - delete a user
router.delete('/user/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await db.User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();

    return res.status(200).json({ message: `User with ID ${id} has been successfully deleted` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while deleting the user' });
  }
});

module.exports = router;
