const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const router = express.Router();

// Use bodyParser to parse URL-encoded data
router.use(bodyParser.urlencoded({ extended: true }));

console.log(process.env.EMAIL_USER);
router.post('/feedback', (req, res) => {
 const { name, email, message } = req.body;

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
      return res.status(500).send('Error sending email.');
    } else {
      console.log('Email sent: ' + info.response);
      return res.status(200).send('Feedback sent successfully!');
    }
  });
});

module.exports = router;
