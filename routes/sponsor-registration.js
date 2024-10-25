const express = require('express');
const db = require('../model/db');
const router = express.Router();
const session = require('express-session');

const sessionMiddleware = session({
 secret: 'thisismysecretcode484',
 resave: false,
 saveUninitialized: true
});

router.use(sessionMiddleware);

router.get('/sponsor-registration', (req, res) => {
 if(!req.session.sid){
 return res.redirect('/');
 }

 db.get('SELECT * FROM students WHERE student_id = ?', [req.session.sid], (err, students) => {
  if (err) {
   return res
     .status(500)
     .send("Error fetching student's record");
 }

 db.get('SELECT * FROM auth WHERE student_id = ?', [req.session.sid], (err, authRows) => {
  if (err) {
   return res.status(500).send("Error fetching auth record");
  }

  db.all('SELECT * FROM schools', (err, schools) => {

   if (err) {
    return res.status(500).send("Error fetching schools record");
   }
   
   res.render('Sponsor', { students, studentID: authRows, schools });
  })
 })
 })

})

module.exports = router;