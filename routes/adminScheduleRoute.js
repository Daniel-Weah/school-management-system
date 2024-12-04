const express = require("express");
const router = express.Router();
const db = require("../model/db");
const bodyParser = require("body-parser");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(bodyParser.urlencoded({ extended: true }));

const calculatePeriods = (startTime, endTime, periodLength) => {
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  const periods = Math.floor((end - start) / (periodLength * 60 * 1000));
  return periods > 0 ? periods : 0; // Ensure non-negative periods
};

router.get("/app/admin/schedule", (req, res) => {
  if (!req.session.userID) {
    return res.redirect("/");
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

      db.all("SELECT * FROM juniorHighClasses", (err, juniors) => {
        if (err) {
          return res.status(500).send("Error fetching junior high classes.");
        }
        db.all("SELECT * FROM seniorHighClasses", (err, seniors) => {
          if (err) {
            return res.status(500).send("Error fetching senior high classes.");
          }

          const loginAdminSchoolID = users.school_id;

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
                    return res.status(500).send("Error fetching instructors");
                  }
                  db.get(
                    "SELECT * FROM auth WHERE user_id = ?",
                    [req.session.userID],
                    (err, authRows) => {
                      if (err) {
                        return res
                          .status(500)
                          .send("Error fetching auth record");
                      }

                      const query = `
                        SELECT schedules.*, users.fullName AS instructor_name, subjects.subject_name,
                               COALESCE(juniorHighClasses.class_name, seniorHighClasses.class_name) AS class_name
                        FROM schedules
                        JOIN users ON schedules.instructor_id = users.user_id
                        LEFT JOIN juniorHighClasses ON schedules.class_id = juniorHighClasses.class_id
                        LEFT JOIN seniorHighClasses ON schedules.class_id = seniorHighClasses.class_id
                        JOIN subjects ON schedules.instructor_id = subjects.instructor_id
                        WHERE schedules.school_id = ?
                        ORDER BY schedules.class_id, schedules.day, schedules.start_time;
                        `;

                      db.all(query, [loginAdminSchoolID], (err, schedules) => {
                        if (err) {
                          return res
                            .status(500)
                            .send("Error fetching schedules.");
                        }

                        // Group schedules by class and day
                        const groupedSchedules = {};
                        schedules.forEach((schedule) => {
                          const key = `${schedule.class_name}-${schedule.day}`;
                          if (!groupedSchedules[key]) {
                            groupedSchedules[key] = [];
                          }
                          groupedSchedules[key].push(schedule);
                        });
                        const maxPeriods = 8;
                        res.render("admin-schedule", {
                          juniors,
                          seniors,
                          users,
                          instructorUsers,
                          userID: authRows,
                          schedules: groupedSchedules,
                          maxPeriods
                        });
                      });
                    }
                  );
                }
              );
            }
          );
        });
      });
    }
  );
});

// Handle schedule insertion
router.post("/app/admin/schedule", (req, res) => {
  const { school, class_id, instructor_id, day, start_time, end_time } =
    req.body;

  console.log("This is the request Body Data:", req.body);

  const scheduleID = uuidv4();

  const query = `
        SELECT * FROM schedules 
        WHERE class_id = ? AND instructor_id = ? AND day = ? AND school_id = ?
        AND ((start_time BETWEEN ? AND ?) OR (end_time BETWEEN ? AND ?));
    `;

  db.get(
    query,
    [
      class_id,
      instructor_id,
      day,
      school,
      start_time,
      end_time,
      start_time,
      end_time,
    ],
    (err, existingSchedule) => {
      if (err) {
        return res.status(500).send("Error checking conflicts.");
      }

      if (existingSchedule) {
        return res.send(
          "Instructor already scheduled for this class on the selected day."
        );
      }

      // Insert schedule
      db.run(
        `INSERT INTO schedules (schedule_id, class_id, instructor_id, school_id, day, start_time, end_time)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          scheduleID,
          class_id,
          instructor_id,
          school,
          day,
          start_time,
          end_time,
        ],
        (err) => {
          if (err) {
            return res.status(500).send("Error inserting schedule.");
          }

          res.redirect("/app/admin/schedule");
        }
      );
    }
  );
});

module.exports = router;
