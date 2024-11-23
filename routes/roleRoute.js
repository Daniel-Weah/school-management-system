const express = require('express');
const db = require('../model/db');
const bodyParser = require('body-parser');
const { v4: uuidv4} = require('uuid');

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.get('/app/admin/role-registration', (req, res) => {
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
    
  
        db.all('SELECT * FROM roles', (err, roles) => {
          if (err) {
            return res.status(500).send('There was an error getting roles data');
          }
          
          res.render('role', { users,
            userID: authRows, roles });
          });
        });
});
});

router.post('/role-registration', (req, res) => {
    const { role } = req.body; 
    
    const roleID = uuidv4();

    const query = 'INSERT INTO roles (role_id, role) VALUES (?, ?)';
    db.run(query, [roleID, role], function(err) {
        if (err) {
            return res.status(500).send(`An error occurred while adding the role: ${err.message}`);
        }
        res.send(`Role ${role} added successfully `); 
    });
});

module.exports = router;
