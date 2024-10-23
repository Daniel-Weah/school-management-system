const express = require('express');
const db = require('../model/db');

const router = express.Router();

router.get('/role-registration', (req, res) => {
  res.render('role');
})


module.exports = router;