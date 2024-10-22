const express = require('express');
const db = require('../model/db');

const router = express.Router();

router.get('/administrator-registration', (req, res) => {
 res.render('administrator-registration');
});

module.exports = router;