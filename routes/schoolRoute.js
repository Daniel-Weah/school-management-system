const express = require('express');
const db = require('../model/db');

const router = express.Router();

router.get('/school-registration', (req, res) => {
  res.render('school');
})


module.exports = router;