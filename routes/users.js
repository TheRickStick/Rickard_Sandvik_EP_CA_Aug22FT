const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../models/db'); 
const jwt = require('jsonwebtoken');


// User registration
router.post('/signup', async (req, res) => {
  const { username, password, email, firstName, lastName } = req.body;
  const missingFields = [];

  // Check if each required field is provided
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

  // If any field is missing, return an error with the list of missing fields
  if (missingFields.length > 0) {
    return res.status(400).json({ message: "Missing required fields", missingFields });
  }

  // Check if username is unique
  const user = await db.User.findOne({ where: { username } });
  if (user) {
    return res.status(400).json({ message: "Username already exists" });
  }

  // Check email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
 // Find the "User" role
 const userRole = await db.Role.findOne({ where: { name: "User" } });
 console.log('UserRole:', userRole);

 // Create new user with the "User" role
 const newUser = await db.User.create({ username, password: hashedPassword, email, firstName, lastName, RoleId: userRole.id });

  return res.status(201).json({ message: "User successfully registered", userId: newUser.id });
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(email);
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

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
router.delete('/user/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await db.User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();

    return res.status(200).json(); 
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while deleting the user' });
  }
});

module.exports = router;
