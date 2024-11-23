const express = require('express');
const db = require('../model/db');
const bodyParser = require('body-parser');
const { v4: uuidv4} = require('uuid');

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.get('/app/admin/position-registration', (req, res) => {
    if (!req.session.userID) {
        return res.redirect('/');
      }
    
      db.get('SELECT * FROM users WHERE user_id = ?', [req.session.userID], (err, users) => {
        if (err) {
          return res.status(500).send("Error fetching student's record");
        }
    
        db.get('SELECT * FROM auth WHERE user_id = ?', [req.session.userID

        ], (err, authRows) => {
          if (err) {
            return res.status(500).send("Error fetching auth record");
          }

    db.all(`SELECT * FROM schools`, (err, schools) => { 
        if (err) {
            return res.status(500).send('There was an error getting schools data');
        }
        db.all(`SELECT * FROM positions 
          ORDER BY positions.position ASC
          `,
           (err, positions) => {
          if (err) {
            return res.status(500).send('There was an error getting positions data');
          }

        res.render('position', { schools, users,
            userID: authRows, positions });
    });
});
});
});
});

router.post('/position-registration', (req, res) => {
    const {  position } = req.body; 
    
    const positionID = uuidv4();

    const query = 'INSERT INTO positions (position_id, position) VALUES (?, ?)';
    db.run(query, [positionID, position], function(err) {
        if (err) {
            return res.status(500).send(`An error occurred while adding the position: ${err.message}`);
        }
        res.send(`Position ${position} added successfully`); 
    });
});

module.exports = router;
