const express = require('express');
const db = require('../model/db');

const router = express.Router();

router.get('/login', (req, res) => {
  res.render('login');
})


module.exports = router;