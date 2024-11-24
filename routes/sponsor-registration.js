const express = require('express');
const db = require('../model/db');
const router = express.Router();
const session = require('express-session');
const { v4: uuidv4} = require('uuid');

const sessionMiddleware = session({
  secret: 'thisismysecretcode484',
  resave: false,
  saveUninitialized: true,
});

router.use(sessionMiddleware);

router.get('/app/admin/sponsor-registration', (req, res) => {
  if (!req.session.userID) {
    return res.redirect('/');
  }

  db.get(
    `SELECT admin_users.*, roles.role AS user_role, schools.school_name AS user_school
        FROM admin_users
        JOIN roles ON admin_users.role = roles.role_id
        JOIN schools ON admin_users.school_id = schools.school_id
        WHERE admin_users.user_id = ?`,
    [req.session.userID],
    (err, users) => {
      if (err) {
        return res.status(500).send("Error fetching user's record");
      }

      if (!users) {
        return res.status(404).send("User not found");
      }

      const loginAdminSchoolID = users.school_id


    db.get('SELECT * FROM auth WHERE user_id = ?', [req.session.userID], (err, authRows) => {
      if (err) {
        return res.status(500).send("Error fetching auth record");
      }

      db.all('SELECT * FROM schools', (err, schools) => {
        if (err) {
          return res.status(500).send("Error fetching schools record");
        }

        db.all('SELECT * FROM juniorHighClasses', (err, juniors) => {
          if (err) {
            return res.status(500).send('Error fetching junior high classes record');
          }

          db.all('SELECT * FROM seniorHighClasses', (err, seniors) => {
            if (err) {
              return res.status(500).send('Error fetching senior high classes record');
            }

            // Fetch the role_id for "instructor"
            db.get('SELECT role_id FROM roles WHERE role = ?', ['Instructor'], (err, roleData) => {
              if (err) {
                return res.status(500).send('Error fetching role for instructor');
              }

              if (!roleData) {
                return res.status(404).send('Instructor role not found');
              }

              const instructorRoleId = roleData.role_id;

              // Fetch users where role matches "instructor"
              db.all('SELECT * FROM users WHERE role = ? AND school_id = ?', [instructorRoleId, loginAdminSchoolID], (err, instructorUsers) => {
                if (err) {
                  return res.status(500).send('Error fetching instructors');
                }

                // Render the page with instructor users
                res.render('sponsor', {
                  users,
                  userID: authRows,
                  schools,
                  juniors,
                  seniors,
                  instructorUsers // Include instructors in the render data
                });
              });
            });
          });
        });
      });
    });
  });
});

// Get instructors based on selected school
router.get('/get-instructors', (req, res) => {
  const { school_id } = req.query;

  if (!school_id) {
    return res.status(400).json({ error: 'School ID is required' });
  }

  db.all('SELECT * FROM users WHERE school_id = ? AND role = (SELECT role_id FROM roles WHERE role = "Instructor")', [school_id], (err, instructors) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching instructors' });
    }

    res.json(instructors);
  });
});


router.post('/sponsor-registration', (req, res) => {
  const {  division, level,  school, level1, instructor } = req.body;
  
  const sponsorLevel = division === 'junior-high' ? level1 : level;

  console.log(division);
  console.log(school);
  console.log(instructor);
  console.log(sponsorLevel);

  const sponsorID = uuidv4();

  db.run('INSERT INTO sponsors (sponsor_id, school_id, instructor_id, division, class) VALUES(?, ?, ?, ?, ?)', 
    [sponsorID, school, instructor, division, sponsorLevel],
    function (err) {
      if (err) {
        return res.status(500).send('There was an error inserting into sponsors table')
      }

      res.redirect('/app/admin/dashboard');
    }
  )

})

module.exports = router;
