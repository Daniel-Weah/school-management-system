const express = require('express');
const db = require('../model/db');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); 

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/school-registration', (req, res) => {
  if (!req.session.sid) {
    return res.redirect('/');
  }

  db.get('SELECT * FROM students WHERE student_id = ?', [req.session.sid], (err, students) => {
    if (err) {
      return res.status(500).send("Error fetching student's record");
    }

    db.get('SELECT * FROM auth WHERE student_id = ?', [req.session.sid], (err, authRows) => {
      if (err) {
        return res.status(500).send("Error fetching auth record");
      }
      
  res.render('school', { students,
    studentID: authRows,});
});
});
});

router.post('/school-registration', (req, res) => {
  const { school } = req.body;
  const schoolID = uuidv4(); 

  const query = 'INSERT INTO schools(school_id, school_name) VALUES(?, ?)';

  db.run(query, [schoolID, school], function(err) {
    if (err) {
      return res.status(500).send(`An error occurred in adding school name ${school}: ${err.message}`);
    }
    res.send(`School ${school} added successfully with ID ${schoolID}`);
  });
});

module.exports = router;
