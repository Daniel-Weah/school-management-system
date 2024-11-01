const express = require("express");
const db = require("../model/db");
const router = express.Router();
const session = require("express-session");

const sessionMiddleware = session({
  secret: "thisismysecretcode484",
  resave: false,
  saveUninitialized: true,
});

router.use(sessionMiddleware);

router.get("/dashboard", (req, res) => {
  if (!req.session.sid) {
    return res.redirect("/");
  }

  const schoolId = req.query.school_id;

  db.get(
    `SELECT students.*, roles.role AS student_role
      FROM students
      JOIN roles ON students.role = roles.role_id
    WHERE students.student_id = ?`,
    [req.session.sid],
    (err, students) => {
      if (err) {
        return res.status(500).send("Error fetching student's record");
      }
      const studentSchoolID = students.school_id;

      db.get(
        "SELECT * FROM auth WHERE student_id = ?",
        [req.session.sid],
        (err, authRows) => {
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
                return res.status(500).send("Error fetching Junior High class name");
              }

              db.get(
                `SELECT students.*, seniorHighClasses.class_name AS senior_class_name
                 FROM students
                 JOIN seniorHighClasses ON students.class = seniorHighClasses.class_id
                 WHERE students.student_id = ?`,
                [req.session.sid],
                (err, seniorClassName) => {
                  if (err) {
                    return res.status(500).send("Error fetching Senior High class name");
                  }

                  db.all("SELECT * FROM notice WHERE school_id = ?", [studentSchoolID], (err, notices) => {
                    if (err) {
                      return res.send("There was an error getting notice data");
                    }

                    const noticeIMG = notices.map((notice) => {
                      if (notice.image) {
                        notice.image = notice.image.toString("base64");
                      }
                      return notice;
                    });

                    db.all("SELECT * FROM schools", (err, schools) => {
                      if (err) {
                        return res.status(500).send("There was an error getting schools data");
                      }

                   
                      const query = schoolId 
                        ? `SELECT students.*, auth.studentID AS student_id,
                              COALESCE(juniorHighClasses.class_name, seniorHighClasses.class_name) AS class_name
                           FROM students
                           JOIN auth ON students.student_id = auth.student_id
                           LEFT JOIN juniorHighClasses ON students.class = juniorHighClasses.class_id
                           LEFT JOIN seniorHighClasses ON students.class = seniorHighClasses.class_id
                           WHERE students.school_id = ?`
                        : `SELECT students.*, auth.studentID AS student_id,
                              COALESCE(juniorHighClasses.class_name, seniorHighClasses.class_name) AS class_name
                           FROM students
                           JOIN auth ON students.student_id = auth.student_id
                           LEFT JOIN juniorHighClasses ON students.class = juniorHighClasses.class_id
                           LEFT JOIN seniorHighClasses ON students.class = seniorHighClasses.class_id`;

                      const params = schoolId ? [schoolId] : [];

                      db.all(query, params, (err, allStudents) => {
                        if (err) {
                          return res.status(500).send("There was an error getting all students");
                        }

                        // Convert profile pictures to base64
                        allStudents = allStudents.map((allStudent) => {
                          if (allStudent.profile_picture) {
                            allStudent.profile_picture = allStudent.profile_picture.toString("base64");
                          }
                          return allStudent;
                        });

                        db.all('SELECT * FROM periods', (err, periods) => {
                          if (err) {
                            return res.status(500).send('There was an error getting periods');
                          }
                          
                          res.render("dashboard", {
                            students,
                            studentID: authRows,
                            juniorClassName,
                            seniorClassName,
                            notices,
                            schools,
                            noticeIMG,
                            allStudents, 
                            periods
                          });
                        });
                      });
                    });
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});


module.exports = router;
