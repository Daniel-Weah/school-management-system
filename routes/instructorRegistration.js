const express = require("express");
const db = require("../model/db");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt"); // Add bcrypt import
const { v4: uuidv4 } = require("uuid"); // Add uuid import for generating UUIDs

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/registration", (req, res) => {
  if (!req.session.sid) {
    return res.redirect("/");
  }

  db.get("SELECT * FROM students WHERE student_id = ?", [req.session.sid], (err, students) => {
    if (err) {
      return res.status(500).send("Error fetching student's record");
    }

    db.get("SELECT * FROM auth WHERE student_id = ?", [req.session.sid], (err, authRows) => {
      if (err) {
        return res.status(500).send("Error fetching auth record");
      }

      db.all("SELECT * FROM schools", (err, schools) => {
        if (err) {
          return res.status(500).send("There was an error getting schools data");
        }

        db.all("SELECT * FROM roles", (err, roles) => {
          if (err) {
            return res.status(500).send("There was an error getting roles data");
          }

          db.all("SELECT * FROM positions", (err, positions) => {
            if (err) {
              return res.status(500).send("There was an error getting positions data");
            }

            res.render("instructor-registration", {
              schools,
              roles,
              positions,
              students,
              studentID: authRows,
            });
          });
        });
      });
    });
  });
});

router.post("/registration", async (req, res) => { 
  const {
    fullname,
    email,
    phone,
    location,
    dob,
    division,
    role,
    school,
    position,
    emergency_name,
    emergency_phone,
    emergency_relationship,
    username,
    password,
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password
    const instructorID = uuidv4();

    // Split the fullname to extract initials
    const nameParts = fullname.trim().split(' ');
    const firstInitial = nameParts[0] ? nameParts[0][0].toUpperCase() : '';
    const lastInitial = nameParts[1] ? nameParts[1][0].toUpperCase() : '';
    const initials = firstInitial + lastInitial;
    const profilePicture = initials || 'Default Initials';

    const juniorClasses = req.body['junior-classes'] || [];
    const seniorClasses = req.body['senior-classes'] || [];
    const juniorSubjects = req.body['junior-subjects'] || [];
    const seniorSubjects = req.body['senior-subjects'] || [];

    const selectedJuniorClasses = Array.isArray(juniorClasses) ? juniorClasses : [juniorClasses];
    const selectedSeniorClasses = Array.isArray(seniorClasses) ? seniorClasses : [seniorClasses];
    const selectedJuniorSubjects = Array.isArray(juniorSubjects) ? juniorSubjects : [juniorSubjects];
    const selectedSeniorSubjects = Array.isArray(seniorSubjects) ? seniorSubjects : [seniorSubjects];

    const juniorClassesString = selectedJuniorClasses.join(",");
    const seniorClassesString = selectedSeniorClasses.join(",");
    const juniorSubjectsString = selectedJuniorSubjects.join(",");
    const seniorSubjectsString = selectedSeniorSubjects.join(",");

  
    db.run(
      `INSERT INTO instructors (instructor_id, fullname, email, phone, location, DOB, division, role, position,  school_id, emergency_name, emergency_phone, emergency_relationship, junior_classes, senior_classes, junior_subjects, senior_subjects, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        instructorID,
        fullname,
        email,
        phone,
        location,
        dob,
        division,
        role,
        position,
        school,
        emergency_name,
        emergency_phone,
        emergency_relationship,
        juniorClassesString,
        seniorClassesString,
        juniorSubjectsString,
        seniorSubjectsString,
        profilePicture
      ],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).send("Error registering instructor");
        }
        db.run('INSERT INTO instructorAuth (auth_id, username, password, instructor_id) VALUES (?, ?, ?, ?)', [uuidv4(), username, hashedPassword, instructorID], function (err) {
          if (err) {
            console.error(err.message);
            return res.status(500).send("Error registering instructor into Auth");
          }
        })
        res.redirect("/dashboard");
      }
    );
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
