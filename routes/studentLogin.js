const express = require('express');
const db = require('../model/db');
const session = require('express-session');
const bcrypt = require('bcrypt');  // Import bcrypt

const router = express.Router();

const sessionMiddleware = session({
  secret: 'thisismysecretcode484',
  resave: false,
  saveUninitialized: true
});

router.get('/student-login', (req, res) => {
  db.all('SELECT * FROM schools', (err, schools) => {
    if (err) {
      return res.send('There was an error getting schools data');
    }

    res.render('student-login', { schools });
  });
});

router.post('/student-login', (req, res) => {
  const { studentID, password } = req.body;

  db.get('SELECT * FROM auth WHERE studentID = ?', [studentID], (err, student) => {
    if (err) {
      return res.send('There was an error retrieving student data');
    }

    if (!student) {
      return res.send('Invalid student ID or password');
    }

    bcrypt.compare(password, student.password, (err, isMatch) => {
      if (err) {
        return res.send('Error comparing passwords');
      }

      if (isMatch) {
        
        req.session.sid = student.student_id;

        res.redirect('/dashboard');

      } else {
        res.send('Invalid student ID or password');
      }
    });
  });
});

module.exports = router;
