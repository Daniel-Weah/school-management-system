const express = require('express');
const db = require('../model/db');

const router = express.Router();

router.get('/registration', (req, res) => {
 res.render('instructor-registration');
});

module.exports = router;