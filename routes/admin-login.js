const express = require('express');
const db = require('../model/db');
const session = require('express-session');
const bcrypt = require('bcrypt');

const router = express.Router();

// Session middleware
const sessionMiddleware = session({
  secret: 'thisismysecretcode484',
  resave: false,
  saveUninitialized: true
});

router.use(sessionMiddleware);

// Serve login page with schools
router.get('/app/admin/login', (req, res) => {
  db.all('SELECT * FROM schools', (err, schools) => {
    if (err) {
      console.error('Error getting schools data:', err);
      return res.send('There was an error getting schools data');
    }
    res.render('admin-login', { schools });
  });
});

// Handle login post request
router.post('/app/admin/login', (req, res) => {
  const { username, password, school } = req.body;

  console.log('Login attempt:', { username, password, school });

  // Step 1: Check if the user exists
  db.get('SELECT * FROM auth WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Error retrieving student data:', err);
      return res.send('There was an error retrieving student data');
    }

    if (!user) {
      return res.send('Invalid username or password');
    }

    // Step 2: Check if the school exists in the 'schools' table
    db.get('SELECT * FROM schools WHERE school_id = ?', [school], (err, schoolData) => {
      if (err) {
        console.error('Error retrieving school data:', err);
        return res.status(500).send('There was an error retrieving school data');
      }

      if (!schoolData) {
        return res.status(404).send(`Invalid school. No school found with ID: ${school}`);
      }

      // Step 3: Check if the user is eligible for the selected school
      db.get('SELECT * FROM admin_users WHERE user_id = ? AND school_id = ?', [user.user_id, school], (err, userDetails) => {
        if (err) {
          return res.status(500).send('There was an error getting user details');
        }

        if (!userDetails) {
          return res.status(404).send(`You are not eligible to log in to ${schoolData.school_name}`);
        }

        // Step 4: Compare the password with the hashed password stored in the database
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            console.error('Error comparing passwords:', err);
            return res.send('Error comparing passwords');
          }

          if (isMatch) {
            // If password matches, store user ID in the session
            req.session.userID = user.user_id;
            return res.redirect('/app/admin/dashboard');  // Redirect to the dashboard after successful login
          } else {
            return res.send('Invalid username or password');
          }
        });
      });
    });
  });
});

module.exports = router;
