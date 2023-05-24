var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var db = require('../models/db'); 
var jwt = require('jsonwebtoken');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

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

 // Create new user with the "User" role
 const newUser = await db.User.create({ username, password: hashedPassword, email, firstName, lastName, RoleId: userRole.id });

  return res.status(201).json({ message: "User successfully registered", userId: newUser.id });
});

function isValidEmail(email) {
  // Regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(email);
}


// User login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Find user
  const user = await db.User.findOne({ where: { username } });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check password
const match = await bcrypt.compare(password, user.password);
if (!match) {
    return res.status(400).json({ message: "Incorrect password" });
}

// Generate a token
const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

return res.status(200).json({ message: "User successfully logged in", token });

});

module.exports = router;
