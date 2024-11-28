const express = require("express");
const db = require("../model/db");
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/app/admin/create-user", (req, res) => {
  if (!req.session.userID) {
    return res.redirect("/");
  }

  db.all("SELECT * FROM schools", (err, schools) => {
    if (err) {
      return res.status(500).send("There was an error getting schools data");
    }

    db.all("SELECT * FROM roles", (err, roles) => {
      if (err) {
        return res.status(500).send("Internal Server Error");
      }
      db.get(
        `SELECT admin_users.*, roles.role AS user_role
                  FROM admin_users
                  JOIN roles ON admin_users.role = roles.role_id
                  WHERE admin_users.user_id = ?`,
        [req.session.userID],
        (err, users) => {
          if (err) {
            return res.status(500).send("Error fetching user's record");
          }

          if (!users) {
            return res.status(404).send("User not found");
          }

          db.get(
            "SELECT * FROM auth WHERE user_id = ?",
            [req.session.userID],
            (err, authRows) => {
              if (err) {
                return res.status(500).send("Error fetching auth record");
              }

              res.render("createUser", {
                schools,
                roles,
                users,
                userID: authRows,
              });
            }
          );
        }
      );
    });
  });
});

router.post('/create/user', async (req, res) => {
  const { fullname, email, phone, location, dob, school, role, username, password} = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userUUID = uuidv4();

    const nameParts = fullname.trim().split(' ');
    const firstInitial = nameParts[0] ? nameParts[0][0].toUpperCase() : '';
    const lastInitial = nameParts[1] ? nameParts[1][0].toUpperCase() : '';
    const initials = firstInitial + lastInitial;
    
    const profilePicture = initials;

    const existingStudent = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM auth WHERE username = ?', [username], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (existingStudent) {
      return res.send('Username already exists');
    }

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO admin_users (user_id, fullName, email, phone, location, DOB, role, school_id, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userUUID, fullname, email, phone, location, dob, role, school, profilePicture],
        function (err) {
          if (err) return reject(err);
          resolve();
        }
      );
    });


    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO auth (auth_id, username, password, user_id) VALUES (?, ?, ?, ?)',
        [uuidv4(), username, hashedPassword, userUUID],
        function (err) {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    res.send('user registration successful');
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred during registration');
  }
});

module.exports = router;
