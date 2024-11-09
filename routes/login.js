const express = require('express');
const db = require('../model/db');
const session = require('express-session');
const bcrypt = require('bcrypt');

const router = express.Router();

const sessionMiddleware = session({
  secret: 'thisismysecretcode484',
  resave: false,
  saveUninitialized: true
});

router.use(sessionMiddleware);

router.get('/login', (req, res) => {
  db.all('SELECT * FROM schools', (err, schools) => {
    if (err) {
      console.error('Error getting schools data:', err);
      return res.send('There was an error getting schools data');
    }

    res.render('login', { schools });
  });
});


router.post('/login', (req, res) => {
  const { username, password, school } = req.body;

  console.log('Login attempt:', { username, password, school });

  db.get('SELECT * FROM auth WHERE username = ?', [username], (err, users) => {
    if (err) {
      console.error('Error retrieving student data:', err);
      return res.send('There was an error retrieving student data');
    }

    if (!users) {
      return res.send('Invalid username or password');
    }

    db.get('SELECT * FROM schools WHERE school_id = ?', [school], (err, schoolData) => {
      if (err) {
        console.error('Error retrieving school data:', err);
        return res.status(500).send('There was an error retrieving school data');
      }

      if (!schoolData) {
        return res.status(404).send(`Invalid school. No school found with ID: ${school}`);
      }
      


      db.get('SELECT * FROM users WHERE school_id = ?', [school], (err, userDetails) => {
        if (err) {
          return res.status(500).send('There was an error getting user details');
        }

        if (!userDetails) {
          return res.status(404).send(`You are not eligible to login to ${schoolData.school_name}`);
        }

        bcrypt.compare(password, users.password, (err, isMatch) => {
          if (err) {
            console.error('Error comparing passwords:', err);
            return res.send('Error comparing passwords');
          }

          if (isMatch) {
            req.session.userID = users.user_id; 
            return res.redirect('/dashboard');
          } else {
            return res.send('Invalid username or password');
          }
        });
      });
    });
  });
});


module.exports = router;
