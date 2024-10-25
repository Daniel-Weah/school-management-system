const express = require('express');
const db = require('../model/db');
const router = express.Router();
const session = require('express-session');

const sessionMiddleware = session({
  secret: 'thisismysecretcode484',
  resave: false,
  saveUninitialized: true
});

router.use(sessionMiddleware);

router.get('/dashboard', (req, res) => {
  if (!req.session.sid) {
    return res.redirect('/');
  }

  db.get('SELECT * FROM students WHERE student_id = ?', [req.session.sid], (err, students) => {
    if (err) {
      return res.status(500).send("Error fetching student's record");
    }

    db.get('SELECT * FROM auth WHERE student_id = ?', [req.session.sid], (err, authRows) => {
      if (err) {
        return res.status(500).send("Error fetching auth record");
      }

      db.get(
        `SELECT students.*, juniorHighClasses.class_name AS junior_class_name
         FROM students
         JOIN juniorHighClasses ON students.class = juniorHighClasses.class_id
         WHERE students.student_id = ?`,
        [req.session.sid],
        (err, juniorClassName) => {
          if (err) {
            return res.status(500).send('Error fetching Junior High class name');
          }

          db.get(
            `SELECT students.*, seniorHighClasses.class_name AS senior_class_name
             FROM students
             JOIN seniorHighClasses ON students.class = seniorHighClasses.class_id
             WHERE students.student_id = ?`,
            [req.session.sid],
            (err, seniorClassName) => {
              if (err) {
                return res.status(500).send('Error fetching Senior High class name');
              }

              res.render('Dashboard', {
                students,
                studentID: authRows,
                juniorClassName,
                seniorClassName
              });
            }
          );
        }
      );
    });
  });
});

module.exports = router;
