const express = require("express");
const db = require("../model/db");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt"); // Add bcrypt import
const { v4: uuidv4 } = require("uuid"); // Add uuid import for generating UUIDs

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/app/admin/registration", (req, res) => {
  if (!req.session.userID) {
    return res.redirect("/");
  }
  db.get(
    "SELECT * FROM auth WHERE user_id = ?",
    [req.session.userID],
    (err, authRows) => {
      if (err) {
        return res.status(500).send("Error fetching auth record");
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

    db.get("SELECT * FROM auth WHERE user_id = ?", [req.session.userID], (err, authRows) => {
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

            db.all('SELECT * FROM juniorHighClasses', (err, juniors) => {
              if (err) {
               return res.status(500).send("Error fetching junior high record");
              }
        
             db.all('SELECT * FROM seniorHighClasses', (err, seniors) => {
              if (err) {
               return res.status(500).send("Error fetching junior high record");
              }
            res.render("registration", {
              users,
              userID: authRows,
              schools,
              roles,
              positions,
              juniors,
              seniors
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

router.post("/registration", async (req, res) => { 
  const {
    fullname,
    email,
    phone,
    location,
    dob,
    division,
    level,
    role,
    school,
    position,
    emergency_name,
    emergency_phone,
    emergency_relationship,
    username,
    password,
    level1
  } = req.body;

  const studentLevel = division === 'junior-high' ? level1 : level;

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); 
    const userID = uuidv4();

    // Split the fullname to extract initials
    const nameParts = fullname.trim().split(' ');
    const firstInitial = nameParts[0] ? nameParts[0][0].toUpperCase() : '';
    const lastInitial = nameParts[1] ? nameParts[1][0].toUpperCase() : '';
    const initials = firstInitial + lastInitial;
    const profilePicture = initials || 'Default Initials';

    const juniorClasses = Array.isArray(req.body['junior-classes']) ? req.body['junior-classes'] : [req.body['junior-classes']];
    const seniorClasses = Array.isArray(req.body['senior-classes']) ? req.body['senior-classes'] : [req.body['senior-classes']];
    const juniorSubjects = Array.isArray(req.body['junior-subjects']) ? req.body['junior-subjects'] : [req.body['junior-subjects']];
    const seniorSubjects = Array.isArray(req.body['senior-subjects']) ? req.body['senior-subjects'] : [req.body['senior-subjects']];

    const juniorClassesString = juniorClasses.join(",");
    const seniorClassesString = seniorClasses.join(",");
    const juniorSubjectsString = juniorSubjects.join(",");
    const seniorSubjectsString = seniorSubjects.join(",");

    // Check if the username already exists
    db.get('SELECT * FROM auth WHERE username = ?', [username], async (err, existingUser) => {
      if (err) {
        return res.status(500).send('Error occurred while checking username');
      }

      if (existingUser) {
        return res.status(400).send('User already exists');
      }

      // Insert into users table
      db.run(
        `INSERT INTO users (user_id, fullname, email, phone, location, DOB, division, role, position, school_id, emergency_name, emergency_phone, emergency_relationship, junior_classes, senior_classes, junior_subjects, senior_subjects, profile_picture) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userID,
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
            return res.status(500).send("Error registering user");
          }

          // Insert into auth table
          db.run('INSERT INTO auth (auth_id, username, password, user_id) VALUES (?, ?, ?, ?)', [uuidv4(), username, hashedPassword, userID], function (err) {
            if (err) {
              console.error(err.message);
              return res.status(500).send("Error registering user into Auth");
            }
            // Successful registration
            res.redirect("/dashboard");
          });
        }
      );
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).send("Internal Server Error");
  }
});


module.exports = router;
