const express = require('express');
const db = require('../model/db');
const bodyParser = require('body-parser');
const { v4: uuidv4} = require('uuid');

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.get('/position-registration', (req, res) => {

    db.all(`SELECT * FROM schools`, (err, schools) => { 
        if (err) {
            return res.status(500).send('There was an error getting schools data');
        }

        res.render('position', { schools });
    });
});

router.post('/position-registration', (req, res) => {
    const { school, position } = req.body; 
    
    const positionID = uuidv4();

    const query = 'INSERT INTO positions (position_id, position, school_id) VALUES (?, ?, ?)';
    db.run(query, [positionID, position, school], function(err) {
        if (err) {
            return res.status(500).send(`An error occurred while adding the position: ${err.message}`);
        }
        res.send(`Position ${position} added successfully for school with ID ${school}`); 
    });
});

module.exports = router;
