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

router.get('/attendance', (req, res) => {
  if (!req.session.userID) {
    return res.redirect('/');
  }

  db.get('SELECT * FROM users WHERE user_id = ?', [req.session.userID], (err, users) => {
    if (err) {
      return res.status(500).send("Error fetching student's record");
    }

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

            db.get('SELECT role_id FROM roles WHERE role = ?', ['Instructor'], (err, roleData) => {
              if (err) {
                return res.status(500).send('Error fetching role for instructor');
              }

              if (!roleData) {
                return res.status(404).send('Instructor role not found');
              }

              const instructorRoleId = roleData.role_id;

              db.all('SELECT * FROM users WHERE role = ?', [instructorRoleId], (err, instructorUsers) => {
                if (err) {
                  return res.status(500).send('Error fetching instructors');
                }


                const today = new Date();
                const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Get Monday of the current week
                const weekStartDate = weekStart.toISOString().split('T')[0];
              
                // Query the students
                db.all('SELECT * FROM students', (err, students) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).send('Error retrieving students');
                  }
              
                  // Query the attendance for the current week
                  db.all('SELECT * FROM attendance WHERE week_start_date = ?', [weekStartDate], (err, attendance) => {
                    if (err) {
                      console.error(err);
                      return res.status(500).send('Error retrieving attendance');
                    }

                    
                res.render('attendance', {
                  users,
                  userID: authRows,
                  schools,
                  juniors,
                  seniors,
                  instructorUsers,
                  attendance, weekStartDate 
                });
              });
            });
          });
        });
      });
    });
  });
});
});
});


app.post('/attendance', (req, res) => {
    const { date, student, status } = req.body;
  
    // Check if the attendance for the week exists
    const weekStartDate = new Date(date);
    const weekStart = new Date(weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay() + 1)); // Get Monday of the current week
    const weekStartStr = weekStart.toISOString().split('T')[0];
  
    // Check if attendance for the current week exists
    db.get('SELECT * FROM attendance WHERE student_id = ? AND week_start_date = ?', [student, weekStartStr], (err, existingAttendance) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error checking attendance');
      }
  
      const statusMap = {
        Present: true,
        Absent: false,
        Late: null,  // This can be handled differently if needed
      };
  
      if (existingAttendance) {
        // Update attendance for that student for the selected day
        const updateQuery = `UPDATE attendance SET ${status.toLowerCase()} = ? WHERE id = ?`;
        db.run(updateQuery, [true, existingAttendance.id], (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error updating attendance');
          }
          res.redirect('/attendance');
        });
      } else {
        // Insert new attendance data for the student
        const insertQuery = `INSERT INTO attendance (student_id, week_start_date, ${status.toLowerCase()})
                             VALUES (?, ?, ?)`;
        db.run(insertQuery, [student, weekStartStr, statusMap[status]], (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error inserting attendance');
          }
          res.redirect('/attendance');
        });
      }
    });
  });
  

module.exports = router;
