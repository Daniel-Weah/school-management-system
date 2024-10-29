const express = require('express');
const db = require('../model/db');
const router = express.Router();
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

const sessionMiddleware = session({
 secret: 'thisismysecretcode484',
 resave: false,
 saveUninitialized: true
});

router.use(sessionMiddleware);

router.get('/class-registration', (req, res) => {
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

   
   res.render('class', { students, studentID: authRows});
  })
 })
 })

 router.post('/juniorhighclass-registration', (req, res) => {
  
  const { className } = req.body;

  console.log(className);

  const classID = uuidv4();

  
  db.run('INSERT INTO juniorHighClasses (class_id, class_name) VALUES(?,?)', [classID, className], 
   function (err) {
    if (err) {
     return res.send('There was an error inserting into the classes table');
    }
    res.send('Class Added Successfully');
   }
   )
 })
 router.post('/seniorhighclass-registration', (req, res) => {
  
  const { className } = req.body;

  console.log(className);

  const classID = uuidv4();

  
  db.run('INSERT INTO seniorHighClasses (class_id, class_name) VALUES(?,?)', [classID, className], 
   function (err) {
    if (err) {
     return res.send('There was an error inserting into the classes table');
    }
    res.send('Class Added Successfully');
   }
   )
 })



module.exports = router;