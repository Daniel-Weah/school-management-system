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

router.get("/subject-details/:subjectSlug", (req, res) => {
  if (!req.session.userID) {
    return res.redirect("/");
  }

  db.get(
    `SELECT users.*, roles.role AS user_role, positions.position, COALESCE(juniorHighClasses.class_name, seniorHighClasses.class_name) AS class_name
        FROM users
        JOIN roles ON users.role = roles.role_id
        LEFT JOIN positions ON users.position = positions.position_id
        LEFT JOIN juniorHighClasses ON users.class = juniorHighClasses.class_id
        LEFT JOIN seniorHighClasses ON users.class = seniorHighClasses.class_id
        WHERE users.user_id = ?`,
    [req.session.userID],
    (err, users) => {
      if (err) {
        return res.status(500).send("Error fetching user's record");
      }

      if (!users) {
        return res.status(404).send("User not found");
      }

      console.log(users);

      const subjectSlug = req.params.subjectSlug;

      const [firstName, ...lastName] = subjectSlug.split("-");
      const name = [firstName, ...lastName].join(" ");

      const firstLetter = name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("");
      console.log(firstLetter);

      req.session.subjectDetail = {
        slugname: subjectSlug,
        first_letter: firstLetter,
      };

      db.get(
        `SELECT subjects.*, users.*
               FROM subjects
               JOIN users ON subjects.instructor_id = users.user_id
               WHERE LOWER(REPLACE(subjects.subject_name, ' ', '-')) = ?`,
        [subjectSlug.toLowerCase()],
        (err, user) => {
          if (err) {
            return res.status(500).send("Error fetching user's details");
          }
          if (!user) {
            return res.status(404).send("User slug not found");
          }

          // storing the subject name into session
          req.session.subjectName = user.subject_name;

          db.get(
            "SELECT * FROM auth WHERE user_id = ?",
            [req.session.userID],
            (err, authRows) => {
              if (err) {
                return res.status(500).send("Error fetching auth record");
              }

              return res.render("subject-detail", {
                user,
                users,
                userID: authRows,
                firstLetter,
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
