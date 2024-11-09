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
  if (!req.session.userID) {
    return res.redirect("/");
  }

  const schoolId = req.query.school_id;

  db.get(
    `SELECT users.*, roles.role AS user_role, positions.position
      FROM users
      JOIN roles ON users.role = roles.role_id
      JOIN positions ON users.position = positions.position_id
    WHERE users.user_id = ?`,
    [req.session.userID],
    (err, users) => {
      if (err) {
        return res.status(500).send("Error fetching student's record");
      }
      const schoolID = users.school_id;

      db.get(
        "SELECT * FROM auth WHERE user_id = ?",
        [req.session.userID],
        (err, authRows) => {
          if (err) {
            return res.status(500).send("Error fetching auth record");
          }

          db.get(
            `SELECT users.*, juniorHighClasses.class_name AS junior_class_name
         FROM users
         JOIN juniorHighClasses ON users.class = juniorHighClasses.class_id
         WHERE users.user_id = ?`,
            [req.session.userID],
            (err, juniorClassName) => {
              if (err) {
                return res.status(500).send("Error fetching Junior High class name");
              }

              db.get(
                `SELECT users.*, seniorHighClasses.class_name AS senior_class_name
                 FROM users
                 JOIN seniorHighClasses ON users.class = seniorHighClasses.class_id
                 WHERE users.user_id = ?`,
                [req.session.userID],
                (err, seniorClassName) => {
                  if (err) {
                    return res.status(500).send("Error fetching Senior High class name");
                  }

                  db.all("SELECT * FROM notice WHERE school_id = ?", [schoolID], (err, notices) => {
                    if (err) {
                      return res.send("There was an error getting notice data");
                    }

                    const defaultImage = '/images/notice-placeholder.jpeg'; 

                        const noticeIMG = notices.map((notice) => {
                          if (notice.image) {
                            notice.image = notice.image.toString("base64");
                          } else {
                            notice.image = defaultImage;
                          }
                          return notice;
                        });


                  

                    db.all("SELECT * FROM schools", (err, schools) => {
                      if (err) {
                        return res.status(500).send("There was an error getting schools data");
                      }

                   
                      const query = schoolId 

                      
                        ? `SELECT users.*, auth.username AS username,
                              COALESCE(juniorHighClasses.class_name, seniorHighClasses.class_name) AS class_name
                           FROM users
                           JOIN auth ON users.user_id = auth.user_id
                           LEFT JOIN juniorHighClasses ON users.class = juniorHighClasses.class_id
                           LEFT JOIN seniorHighClasses ON users.class = seniorHighClasses.class_id
                           WHERE users.school_id = ?`
                        : `SELECT users.*, auth.username AS username,
                              COALESCE(juniorHighClasses.class_name, seniorHighClasses.class_name) AS class_name
                           FROM users
                           JOIN auth ON users.user_id = auth.user_id
                           LEFT JOIN juniorHighClasses ON users.class = juniorHighClasses.class_id
                           LEFT JOIN seniorHighClasses ON users.class = seniorHighClasses.class_id`;

                      const params = schoolId ? [schoolId] : [];

                      db.all(query, params, (err, allusers) => {
                        if (err) {
                          return res.status(500).send("There was an error getting all users");
                        }

                        // Convert profile pictures to base64
                        allusers = allusers.map((alluser) => {
                          if (alluser.profile_picture) {
                            alluser.profile_picture = alluser.profile_picture.toString("base64");
                          }
                          return alluser;
                        });

                        db.all('SELECT * FROM periods', (err, periods) => {
                          if (err) {
                            return res.status(500).send('There was an error getting periods');
                          }
                          db.get('SELECT * FROM users WHERE user_id = ?', [req.session.userID], (err, userData) => {
                            if (err) {
                              return res.status(500).send('There was an error with current user data');
                            }
                            const userSchoolID = users.school_id;
                            const userClass = users.class;
                         
                           console.log('School ID:', userSchoolID);
                            console.log('Class:', userClass);


                            const query = `
                            SELECT sponsors.*, users.fullName 
                            FROM sponsors
                            JOIN users ON sponsors.instructor_id = users.user_id
                            WHERE sponsors.school_id = ? AND sponsors.class = ?
                          `;
                          
                          console.log('Executing query:', query, [userSchoolID, userClass]);
                          
                          db.get(query, [userSchoolID, userClass], (err, userSponsorData) => {
                            if (err) {
                              console.error('Error executing query:', err);
                              return res.status(500).send('There was an error getting sponsors data');
                            }
                          
                            if (!userSponsorData) {
                              // No sponsor found, pass a flag to indicate this
                              console.log('No sponsor data found for this school and class');
                              return res.render('dashboard', 
                            // If sponsor data is found, pass the sponsor data
                                { 
                                  users,
                            userID: authRows,
                            juniorClassName,
                            seniorClassName,
                            notices,
                            schools,
                            noticeIMG,
                            allusers, 
                            periods,
                            userSponsorData,
                                  noSponsorFound: true });
                            }
                          
                            // If sponsor data is found, pass the sponsor data
                            console.log('User Sponsor Data:', userSponsorData);
                            return res.render('dashboard', { users,
                              userID: authRows,
                              juniorClassName,
                              seniorClassName,
                              notices,
                              schools,
                              noticeIMG,
                              allusers, 
                              periods,
                              userSponsorData, noSponsorFound: false });
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
});


module.exports = router;
