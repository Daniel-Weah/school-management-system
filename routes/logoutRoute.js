const express = require('express');
const db = require('../model/db');
const session = require('express-session');
const router = express.Router();

router.get('/logout', (req, res) => {
  if (!req.session.sid) {
    return res.redirect("/");
  }
  
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      return res.status(500).send("Failed to log out. Please try again.");
    }
    res.redirect('/'); 
  });
});

module.exports = router;
