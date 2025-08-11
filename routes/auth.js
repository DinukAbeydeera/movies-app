const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// GET register
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

// POST register
router.post('/register', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  const { username, email, password } = req.body;

  if (!errors.isEmpty()) {
    return res.status(400).render('auth/register', {
      title: 'Register',
      errors: errors.array(),
      old: { username, email }
    });
  }

  try {
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      req.flash('error', 'Username or email already in use');
      return res.redirect('/register');
    }
    const user = new User({ username, email, password });
    await user.save();
    req.flash('success', 'Registered! Please log in.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Registration failed');
    res.redirect('/register');
  }
});

// GET login
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

// POST login
router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  })
);

// GET logout
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash('success', 'Logged out');
    res.redirect('/login');
  });
});

module.exports = router;
