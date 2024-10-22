const express = require('express');
const db = require('../model/db');

const router = express.Router();

router.get('/student-registration', (req, res) => {
 res.render('student-registration');
});

module.exports = router;