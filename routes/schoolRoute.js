const express = require('express');
const db = require('../model/db');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); 

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/app/admin/school-registration', (req, res) => {
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

      db.all(`SELECT * FROM schools
        ORDER BY schools.school_name ASC
        `,
         (err, schools) => {
        if (err) {
          return res.status(500).send('There was an error getting positions data');
        }
      
  res.render('school', { users,
    userID: authRows, schools});
});
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
