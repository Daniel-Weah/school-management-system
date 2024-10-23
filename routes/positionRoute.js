const express = require('express');
const db = require('../model/db');

const router = express.Router();

router.get('/position-registration', (req, res) => {
  res.render('position');
})


module.exports = router;