const express = require('express');
const db = require('../model/db');
const router = express.Router();
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

// Session middleware
const sessionMiddleware = session({
  secret: 'thisismysecretcode484',
  resave: false,
  saveUninitialized: true,
});

router.use(sessionMiddleware);

// GET /attendance
router.get('/attendance', (req, res) => {
  if (!req.session.userID) {
    return res.redirect('/');
  }

  const selectedClassId = req.query.classId || null; // Retrieve the selected class ID from query parameters

  db.get(
    `SELECT users.*, roles.role AS user_role
      FROM users
      JOIN roles ON users.role = roles.role_id
      WHERE users.user_id = ?`,
    [req.session.userID],
    (err, users) => {
      if (err) {
        return res.status(500).send("Error fetching user's record");
      }

      if (!users) {
        return res.status(404).send("User not found");
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

              const classFilterQuery = selectedClassId ? `AND users.class = ?` : '';

              db.all(
                `
                SELECT users.*, roles.role AS user_role, 
                       COALESCE(juniorHighClasses.class_name, seniorHighClasses.class_name) AS class_name
                FROM users
                LEFT JOIN juniorHighClasses ON users.class = juniorHighClasses.class_id
                LEFT JOIN seniorHighClasses ON users.class = seniorHighClasses.class_id
                JOIN roles ON users.role = roles.role_id
                WHERE users.school_id = ? AND roles.role = 'Student' ${classFilterQuery}
                `,
                selectedClassId ? [users.school_id, selectedClassId] : [users.school_id],
                (err, students) => {
                  if (err) {
                    return res.status(500).send('Error retrieving students');
                  }

                  const today = new Date();
                  const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Monday of the current week
                  const weekStartDate = weekStart.toISOString().split('T')[0];

                  db.all('SELECT * FROM attendance WHERE week_start_date = ?', [weekStartDate], (err, attendance) => {
                    if (err) {
                      console.error(err);
                      return res.status(500).send('Error retrieving attendance');
                    }

                    res.render('attendance', {
                      userID: authRows,
                      schools,
                      juniors,
                      seniors,
                      students,
                      attendance,
                      weekStartDate,
                      selectedClassId,
                      users
                    
                    });
                  });
                }
              );
            });
          });
        });
      });
    }
  );
});

// POST /attendance
router.post('/attendance', (req, res) => {
  const { date, attendance } = req.body;

  console.log(req.body);

  const weekStartDate = new Date(date);
  if (isNaN(weekStartDate)) {
    return res.status(400).send('Invalid date format');
  }

  const weekStart = new Date(weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay() + 1));
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const currentDay = new Date().getDay(); 
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const currentDayStr = daysOfWeek[(currentDay - 1 + 7) % 7];

  if (attendance[currentDayStr]) {
    Object.keys(attendance[currentDayStr]).forEach(studentId => {
      const status = attendance[currentDayStr][studentId];
      const statusMap = {
        Present: true,
        Absent: false,
        Late: null,
      };

      db.get('SELECT * FROM attendance WHERE student_id = ? AND week_start_date = ?', [studentId, weekStartStr], (err, existingAttendance) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error checking attendance');
        }

        if (existingAttendance) {
          const updateQuery = `UPDATE attendance SET ${currentDayStr} = ? WHERE id = ?`;
          db.run(updateQuery, [statusMap[status], existingAttendance.id], (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send('Error updating attendance');
            }
          });
        } else {
          const attendanceValues = {
            monday: currentDayStr === 'monday' ? statusMap[status] : null,
            tuesday: currentDayStr === 'tuesday' ? statusMap[status] : null,
            wednesday: currentDayStr === 'wednesday' ? statusMap[status] : null,
            thursday: currentDayStr === 'thursday' ? statusMap[status] : null,
            friday: currentDayStr === 'friday' ? statusMap[status] : null
          };

          const insertQuery = `INSERT INTO attendance (student_id, week_start_date, monday, tuesday, wednesday, thursday, friday)
                               VALUES (?, ?, ?, ?, ?, ?, ?)`;

          db.run(insertQuery, [studentId, weekStartStr, attendanceValues.monday, attendanceValues.tuesday, attendanceValues.wednesday, attendanceValues.thursday, attendanceValues.friday], (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send('Error inserting attendance');
            }
          });
        }
      });
    });
  }

  res.redirect('/attendance');
});

module.exports = router;
