const express = require('express');
const db = require('../model/db');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); 

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/school-registration', (req, res) => {
  res.render('school');
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
