const express = require('express');
const multer = require('multer');
const db = require('../model/db');
const nodemailer = require('nodemailer');
require('dotenv').config();


const router = express.Router();

const upload = multer();
router.get('/request-transcript', (req, res) => {
  if (!req.session.userID) {
    return res.redirect('/');
  }

  db.get('SELECT * FROM users WHERE user_id = ?', [req.session.userID], (err, users) => {
    if (err) {
      return res.status(500).send("Error fetching student's record");
    }

    db.get('SELECT * FROM auth WHERE user_id = ?', [req.session.userID], (err, authRows) => {
      if (err) {
        return res.status(500).send("Error fetching auth record");
      }

 res.render('transcript', { users,
  userID: authRows,});
})
})
})

router.post('/request-transcript', upload.none(), (req, res) => {
  const { name, email, school, year, message } = req.body;
  const currentYear = new Date().getFullYear();

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
   return res.status(400).json({ ok: false, message: 'Name is required and must be valid.' });
 }
 
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 if (!email || !emailRegex.test(email)) {
   return res.status(400).json({ ok: false, message: 'A valid email is required.' });
 }
 
 if (!school || typeof school !== 'string' || school.trim().length === 0) {
   return res.status(400).json({ ok: false, message: 'School is required.' });
 }
 
 if (!year || isNaN(year) || year < 1990 || year > currentYear) {
   return res.status(400).json({ ok: false, message: `Year must be between 1990 and ${currentYear}.` });
 }
  

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
     user: process.env.EMAIL_USER,
     pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: email, 
    to: 'weahjrdanielk@gmail.com',
    subject: 'Transcript Request from ' + name,
    text: `You have just receive a transcript request from ${name} (${email}) \n\n School: ${school} \n\n Graduated: ${year} \n\n Purpose Requesting Transcript: \n\n ${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ ok: false, message: 'Error sending email.' });
    } else {
      console.log('Email sent: ' + info.response);
      return res.status(200).json({ ok: true, message: 'Transcript sent successfully!' });
    }
  });
});

module.exports = router;
