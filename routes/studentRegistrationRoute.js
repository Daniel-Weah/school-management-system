const express = require('express');
const db = require('../model/db');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const session = require('express-session');

const sessionMiddleware = session({
 secret: 'thisismysecretcode484',
 resave: false,
 saveUninitialized: true
});
const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));


router.use(sessionMiddleware);


router.get('/student-registration', (req, res) => {
 if(!req.session.userID){
  return res.redirect('/');
  }

  db.all('SELECT * FROM schools', (err, schools) => {
    if (err) {
      res.send('There was an error getting schools data');
      return;
    }
    db.get('SELECT * FROM users WHERE user_id = ?', [req.session.userID], (err, users) => {
     if (err) {
      return res
        .status(500)
        .send("Error fetching student's record");
    }
   
    db.get('SELECT * FROM auth WHERE user_id = ?', [req.session.userID], (err, authRows) => {
     if (err) {
      return res.status(500).send("Error fetching auth record");
     }

     db.all('SELECT * FROM juniorHighClasses', (err, juniors) => {
      if (err) {
       return res.status(500).send("Error fetching junior high record");
      }

     db.all('SELECT * FROM seniorHighClasses', (err, seniors) => {
      if (err) {
       return res.status(500).send("Error fetching junior high record");
      }
      db.all('SELECT * FROM roles', (err, roles) => {
        if (err) {
          return res.status(500).send("Error fetching roles record");
        }
        
        res.render('student-registration', { schools, users, userID: authRows, juniors, seniors, roles });
      });
     });
  });
  });
  });
});
});

router.post('/student-registration', async (req, res) => {
  const { fullname, email, phone, location, dob, division, level, role, school, emergency_name, emergency_phone, emergency_relationship, username, password, level1 } = req.body;
  
  console.log(username);

  const studentLevel = division === 'junior-high' ? level1 : level;

  try {
    // Await bcrypt hash
    const hashedPassword = await bcrypt.hash(password, 10);
    const studentUUID = uuidv4();

    // Split the fullname to extract initials
    const nameParts = fullname.trim().split(' ');
    const firstInitial = nameParts[0] ? nameParts[0][0].toUpperCase() : '';
    const lastInitial = nameParts[1] ? nameParts[1][0].toUpperCase() : '';
    const initials = firstInitial + lastInitial;

    // Set initials as profile picture or a default
    const profilePicture = initials || 'Default Initials';

    db.get('SELECT * FROM auth WHERE username = ?', [username], (err, existingStudent) => {
      if (err) {
        res.send('Error occurred while checking studentID');
        return;
      }

      if (existingStudent) {
        res.send('username already exists');
      } else {
        db.run(
          'INSERT INTO users (user_id, fullName, email, phone, location, DOB, division, class, role, position, school_id, emergency_name, emergency_phone, emergency_relationship, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
          [studentUUID, fullname, email, phone, location, dob, division, studentLevel, role, 'none',school, emergency_name, emergency_phone, emergency_relationship, profilePicture], 
          function (err) {
            if (err) {
              console.error('Error inserting into students table:', err.message);
              res.send('There was an error inserting into the students table');
              return;
            }
            db.run(
              'INSERT INTO auth (auth_id, username, password, user_id) VALUES (?, ?, ?, ?)', 
              [uuidv4(), username, hashedPassword, studentUUID], 
              function (err) {
                if (err) {
                  console.error('Error inserting into auth table:', err.message);
                  res.send('There was an error inserting into the auth table');
                  return;
                }
                res.send('Student registration successful');
              }
            );
          }
        );
      }
    });
  } catch (error) {
    console.error('Error during registration:', error.message);
    res.send('There was an error during registration.');
  }
});

module.exports = router;
