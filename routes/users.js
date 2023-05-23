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
  const { username, password, email } = req.body;

  // Check if username is unique
  const user = await db.User.findOne({ where: { username } });
  if (user) {
    return res.status(400).json({ message: "Username already exists" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = await db.User.create({ username, password: hashedPassword, email });

  return res.status(201).json({ message: "User successfully registered", userId: newUser.id });
});

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
