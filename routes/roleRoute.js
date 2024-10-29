const express = require('express');
const db = require('../model/db');
const bodyParser = require('body-parser');
const { v4: uuidv4} = require('uuid');

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.get('/role-registration', (req, res) => {
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
    
    db.all(`SELECT * FROM schools`, (err, schools) => { 
        if (err) {
            return res.status(500).send('There was an error getting schools data');
        }

        res.render('role', { schools, students,
            studentID: authRows,  });
    });
});
});
});

router.post('/role-registration', (req, res) => {
    const { school, role } = req.body; 
    
    const roleID = uuidv4();

    const query = 'INSERT INTO roles (role_id, role, school_id) VALUES (?, ?, ?)';
    db.run(query, [roleID, role, school], function(err) {
        if (err) {
            return res.status(500).send(`An error occurred while adding the role: ${err.message}`);
        }
        res.send(`Role ${role} added successfully for school with ID ${school}`); 
    });
});

module.exports = router;
