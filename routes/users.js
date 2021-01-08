const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const checkphone = require('phone');
// Load User model
const User = require('../models/User');
const Csv = require('../models/Csv');

const { forwardAuthenticated, ensureAuthenticated } = require('../config/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register
router.post('/register', (req, res) => {
  const { name, email, phone, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !phone || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }
  var result = checkphone(phone);
  console.log(result);

  if (Array.isArray(result) && result.length === 0) {
    errors.push({ msg: 'Phone Number Not Valid' });
  }
  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }
  console.log(errors);
  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      phone,
      password,
      password2
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          phone,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name,
          email,
          phone,
          password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                res.redirect('/users/login');

              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});


//userlist

router.get('/list', ensureAuthenticated, (req, res) =>
  Csv.find({}).then(list => res.render('userslist', {
    user: req.user,
    userdata: list
  }))

);
module.exports = router;
