const express = require('express');
const db = require('../model/db');

const router = express.Router();

// User slug route to handle user profile URL
router.get("/user/:nameSlug", (req, res) => {
    if (!req.session.userID) {
        return res.redirect('/');
    }

    db.get(
        `SELECT users.*, roles.role AS user_role, positions.position
          FROM users
          JOIN roles ON users.role = roles.role_id
          LEFT JOIN positions ON users.position = positions.position_id
          WHERE users.user_id = ?`,
        [req.session.userID],
        (err, users) => {
            if (err) {
                return res.status(500).send("Error fetching user's record");
            }
    
            if (!users) {
                return res.status(404).send("User not found");
            }

            const nameSlug = req.params.nameSlug;
            const [firstName, ...lastName] = nameSlug.split('-');
            const name = [firstName, ...lastName].join(' ');
  
          
            db.get(
                `SELECT users.*, roles.role AS user_role, positions.position AS user_position, auth.username
                 FROM users
                 JOIN roles ON users.role = roles.role_id
                 LEFT JOIN positions ON users.position = positions.position_id
                 JOIN auth ON users.user_id = auth.user_id
                 WHERE LOWER(REPLACE(users.fullName, ' ', '-')) = ?`, 
                [nameSlug.toLowerCase()],
                (err, user) => {
                    if (err) {
                        return res.status(500).send("Error fetching user's details");
                    }
                    if (!user) {
                        return res.status(404).send("User not found");
                    }

                    db.all(`SELECT * FROM users WHERE school_id = ? AND class = ? AND user_id != ?`, [user.school_id, user.class, user.user_id], (err, allClassMates) => {
                        if (err) {
                            return res.status(500).send('There was an error getting class mates data');
                        }

                        console.log('Current login user: ', users);
                        console.log('Current login user ID: ', users.user_id);
                        console.log('user profile visited', user);
                        console.log('user profile visited ID', user.user_id);
                        return res.render("user-details", {
                            user,
                            fullName: user.fullName,
                            profilePicture: user.profile_picture,
                            role: user.user_role,
                            position: user.user_position,
                            users,
                            allClassMates
                        });
                    });
                }
            );
        }
    );
});

module.exports = router;
