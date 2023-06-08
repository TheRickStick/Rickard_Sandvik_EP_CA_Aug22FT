const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../models/db'); 
const jwt = require('jsonwebtoken');


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

  
  /* This could be added for strong password validation 
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ message: "Invalid password", errors: passwordValidation.errors });
  }
*/

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


/* This could be added for strong password validation
function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one digit");
  }

  if (!/[!@#$%^&*()\-_=+{};:,<.>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}*/


//POST login
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
