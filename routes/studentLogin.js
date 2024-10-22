const express = require('express');
const db = require('../model/db');

const router = express.Router();

router.get('/student-login', (req, res) => {
  res.render('student-login');
})


module.exports = router;