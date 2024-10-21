const express = require('express');
const db = require('../model/db');
const router = express.Router();

router.get('/dashboard', (req, res) => {
 res.render('Dashboard');
})

module.exports = router;