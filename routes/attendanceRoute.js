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

  db.get('SELECT * FROM users WHERE user_id = ?', [req.session.userID], (err, users) => {
    if (err) {
      return res.status(500).send("Error fetching user's record");
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
                const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1)); 
                const weekStartDate = weekStart.toISOString().split('T')[0];

                db.all(`
                  SELECT users.*, positions.position AS user_position, roles.role AS user_role, auth.username,
                  COALESCE(juniorHighClasses.class_name, seniorHighClasses.class_name) AS class_name
                  FROM users
                  LEFT JOIN positions ON users.position = positions.position_id
                  JOIN roles ON users.role = roles.role_id
                  LEFT JOIN juniorHighClasses ON users.class = juniorHighClasses.class_id
                  LEFT JOIN seniorHighClasses ON users.class = seniorHighClasses.class_id
                  JOIN auth ON users.user_id = auth.user_id
                  WHERE school_id = ?
                `,[users.school_id], (err, allusers) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).send('Error retrieving students');
                  }

                  // Filter only students
                  const students = allusers.filter(user => user.user_role === "Student");

                 

                  // Query the attendance for the current week
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
                      instructorUsers,
                      attendance,
                      weekStartDate,
                      students,
                      users
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

router.post('/attendance', (req, res) => {
    const { date, attendance } = req.body;
  
    console.log(req.body); 
  
    const weekStartDate = new Date(date);
    if (isNaN(weekStartDate)) {
      return res.status(400).send('Invalid date format');
    }
  
    // Calculate the week start date (assumes Monday is the start of the week)
    const weekStart = new Date(weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay() + 1));
    const weekStartStr = weekStart.toISOString().split('T')[0];
  
    // Determine the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const currentDay = new Date().getDay(); // Sunday = 0, Monday = 1, etc.
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    // Get the current day string for comparison
    const currentDayStr = daysOfWeek[(currentDay - 1 + 7) % 7];  // Adjusts to consider Monday as start of the week
  
    // Only process the current day for attendance
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
            // Update existing attendance for the given day
            const updateQuery = `UPDATE attendance SET ${currentDayStr} = ? WHERE id = ?`;
            db.run(updateQuery, [statusMap[status], existingAttendance.id], (err) => {
              if (err) {
                console.error(err);
                return res.status(500).send('Error updating attendance');
              }
            });
          } else {
            // Insert new attendance, but only for the current day
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












// const express = require('express');
// const db = require('../model/db');
// const router = express.Router();
// const session = require('express-session');
// const { v4: uuidv4} = require('uuid');

// const sessionMiddleware = session({
//   secret: 'thisismysecretcode484',
//   resave: false,
//   saveUninitialized: true,
// });

// router.use(sessionMiddleware);

// router.get('/attendance', (req, res) => {
//   if (!req.session.userID) {
//     return res.redirect('/');
//   }

//   db.get('SELECT * FROM users WHERE user_id = ?', [req.session.userID], (err, users) => {
//     if (err) {
//       return res.status(500).send("Error fetching student's record");
//     }

//     db.get('SELECT * FROM auth WHERE user_id = ?', [req.session.userID], (err, authRows) => {
//       if (err) {
//         return res.status(500).send("Error fetching auth record");
//       }

//       db.all('SELECT * FROM schools', (err, schools) => {
//         if (err) {
//           return res.status(500).send("Error fetching schools record");
//         }

//         db.all('SELECT * FROM juniorHighClasses', (err, juniors) => {
//           if (err) {
//             return res.status(500).send('Error fetching junior high classes record');
//           }

//           db.all('SELECT * FROM seniorHighClasses', (err, seniors) => {
//             if (err) {
//               return res.status(500).send('Error fetching senior high classes record');
//             }

//             db.get('SELECT role_id FROM roles WHERE role = ?', ['Instructor'], (err, roleData) => {
//               if (err) {
//                 return res.status(500).send('Error fetching role for instructor');
//               }

//               if (!roleData) {
//                 return res.status(404).send('Instructor role not found');
//               }

//               const instructorRoleId = roleData.role_id;

//               db.all('SELECT * FROM users WHERE role = ?', [instructorRoleId], (err, instructorUsers) => {
//                 if (err) {
//                   return res.status(500).send('Error fetching instructors');
//                 }


//                 const today = new Date();
//                 const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Get Monday of the current week
//                 const weekStartDate = weekStart.toISOString().split('T')[0];
              
//                 // Query the students
//                 db.all(`SELECT users.*, positions.position AS user_position, roles.role AS user_role, auth.username,
//               COALESCE(juniorHighClasses.class_name, seniorHighClasses.class_name) AS class_name
//              FROM users
//              LEFT JOIN positions ON users.position = positions.position_id
//              JOIN roles ON users.role = roles.role_id
//              LEFT JOIN juniorHighClasses ON users.class = juniorHighClasses.class_id
//              LEFT JOIN seniorHighClasses ON users.class = seniorHighClasses.class_id
//              JOIN auth ON users.user_id = auth.user_id`, (err, allusers) => {
//                   if (err) {
//                     console.error(err);
//                     return res.status(500).send('Error retrieving students');
//                   }
              
//                   allusers = allusers.map((alluser) => {
//                     if (alluser.profile_picture) {
//                       alluser.profile_picture =
//                         alluser.profile_picture.toString("base64");
//                     }
//                     return alluser;
//                   });
      
//                   // Split users by their roles
//                   const students = allusers.filter(
//                     (user) => user.user_role === "Student"
//                   );

//                   // Query the attendance for the current week
//                   db.all('SELECT * FROM attendance WHERE week_start_date = ?', [weekStartDate], (err, attendance) => {
//                     if (err) {
//                       console.error(err);
//                       return res.status(500).send('Error retrieving attendance');
//                     }

                    
//                 res.render('attendance', {
//                   users,
//                   userID: authRows,
//                   schools,
//                   juniors,
//                   seniors,
//                   instructorUsers,
//                   attendance, weekStartDate,
//                   students
//                 });
//               });
//             });
//           });
//         });
//       });
//     });
//   });
// });
// });
// });


// router.post('/attendance', (req, res) => {
//     const { date, student, status } = req.body;
  
//     // Check if the attendance for the week exists
//     const weekStartDate = new Date(date);
//     const weekStart = new Date(weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay() + 1)); // Get Monday of the current week
//     const weekStartStr = weekStart.toISOString().split('T')[0];
  
//     // Check if attendance for the current week exists
//     db.get('SELECT * FROM attendance WHERE student_id = ? AND week_start_date = ?', [student, weekStartStr], (err, existingAttendance) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send('Error checking attendance');
//       }
  
//       const statusMap = {
//         Present: true,
//         Absent: false,
//         Late: null,  
//       };
  
//       if (existingAttendance) {
//         const updateQuery = `UPDATE attendance SET ${status.toLowerCase()} = ? WHERE id = ?`;
//         db.run(updateQuery, [true, existingAttendance.id], (err) => {
//           if (err) {
//             console.error(err);
//             return res.status(500).send('Error updating attendance');
//           }
//           res.redirect('/attendance');
//         });
//       } else {
//         const insertQuery = `INSERT INTO attendance (student_id, week_start_date, ${status.toLowerCase()})
//                              VALUES (?, ?, ?)`;
//         db.run(insertQuery, [student, weekStartStr, statusMap[status]], (err) => {
//           if (err) {
//             console.error(err);
//             return res.status(500).send('Error inserting attendance');
//           }
//           res.redirect('/attendance');
//         });
//       }
//     });
//   });
  

// module.exports = router;
