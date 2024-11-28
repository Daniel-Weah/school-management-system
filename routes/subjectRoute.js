const express = require("express");
const router = express.Router();
const db = require("../model/db");
const bodyParser = require("body-parser");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/subjects", (req, res) => {
  if (!req.session.userID) {
    return res.redirect("/");
  }

  db.get(
    `SELECT users.*, roles.role AS user_role, schools.school_name AS user_school
            FROM users
            JOIN roles ON users.role = roles.role_id
            JOIN schools ON users.school_id = schools.school_id
            WHERE users.user_id = ?`,
    [req.session.userID],
    (err, users) => {
      if (err) {
        return res.status(500).send("Error fetching user's record");
      }

      if (!users) {
        return res.status(404).send("User not found");
      }

      const loginAdminSchoolID = users.school_id;
      const userRole = users.user_role;
      console.log(userRole);

      db.get(
        "SELECT * FROM auth WHERE user_id = ?",
        [req.session.userID],
        (err, authRows) => {
          if (err) {
            return res.status(500).send("Error fetching auth record");
          }

          db.all("SELECT * FROM schools", (err, schools) => {
            if (err) {
              return res.status(500).send("Error fetching schools record");
            }

            db.all("SELECT * FROM juniorHighClasses", (err, juniors) => {
              if (err) {
                return res
                  .status(500)
                  .send("Error fetching junior high classes record");
              }

              db.all("SELECT * FROM seniorHighClasses", (err, seniors) => {
                if (err) {
                  return res
                    .status(500)
                    .send("Error fetching senior high classes record");
                }

                const instructorID = users.user_id;

                const instructorQuery = `
                SELECT subjects.*, users.*, schools.school_name AS user_school
              FROM subjects
              JOIN users ON subjects.instructor_id = users.user_id
              JOIN schools ON subjects.school_id = schools.school_id
              WHERE subjects.instructor_id = ? AND subjects.school_id = ?
              `
              db.all(instructorQuery, [instructorID, loginAdminSchoolID], (err, instructorSubjects) => {
                if (err) {
                  return res.status(500).send('Error fetching instructor subjects');
                }

                db.get(
                  "SELECT role_id FROM roles WHERE role = ?",
                  ["Instructor"],
                  (err, roleData) => {
                    if (err) {
                      return res
                        .status(500)
                        .send("Error fetching role for instructor");
                    }

                    if (!roleData) {
                      return res.status(404).send("Instructor role not found");
                    }

                    const instructorRoleId = roleData.role_id;

                    db.all(
                      "SELECT * FROM users WHERE role = ? AND school_id = ?",
                      [instructorRoleId, loginAdminSchoolID],
                      (err, instructorUsers) => {
                        if (err) {
                          return res
                            .status(500)
                            .send("Error fetching instructors");
                        }
                        const userDivision = users.division;

                        const query = `
                                      SELECT subjects.*, users.*, schools.school_name AS user_school
                                      FROM subjects
                                      JOIN users ON subjects.instructor_id = users.user_id
                                      JOIN schools ON subjects.school_id = schools.school_id
                                      WHERE subjects.division = ? AND subjects.school_id = ?
                                      `;

                                   

                        db.all(
                          query,
                          [userDivision, loginAdminSchoolID],
                          (err, studentSubjects) => {
                            if (err) {
                              console.error("Database error:", err.message);
                              return res
                                .status(500)
                                .send(
                                  "There was an error getting subjects data"
                                );
                            }

                            

                            console.log("Student Subjects", studentSubjects);
                            res.render("subjects", {
                              users,
                              userID: authRows,
                              schools,
                              juniors,
                              seniors,
                              instructorUsers,
                              studentSubjects,
                              instructorSubjects
                            });
                          }
                        );
                      }
                    );
                  }
                );
              });
            });
          });
        }
      );
    }
  );
});
});

// ================ Post route ============

router.post("/subjects", upload.single("subjectImg"), (req, res) => {
  const { school, division, instructor, subject } = req.body;
  const subjectImg = req.file ? req.file.buffer : "/images/english.png";

  const subjectID = uuidv4();

  const query = `
        INSERT INTO subjects (subject_id, subject_name, school_id, instructor_id, division, subject_Img)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

  db.run(
    query,
    [subjectID, subject, school, instructor, division, subjectImg],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error inserting into subjects table");
      }

      res.send("Subject inserted successfully!");
    }
  );
});

module.exports = router;
