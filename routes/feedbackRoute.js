const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');

const router = express.Router();

// Set up multer to handle multipart/form-data
const upload = multer();

router.post('/feedback', upload.none(), (req, res) => {
  const { name, email, message } = req.body;

  // Log the received data for debugging
  console.log('Received Data:', { name, email, message });

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, message: 'All fields are required.' });
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
    subject: 'Feedback from ' + name,
    text: `You have received a new message from ${name} (${email}):\n\n${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ ok: false, message: 'Error sending email.' });
    } else {
      console.log('Email sent: ' + info.response);
      return res.status(200).json({ ok: true, message: 'Feedback sent successfully!' });
    }
  });
});

module.exports = router;
