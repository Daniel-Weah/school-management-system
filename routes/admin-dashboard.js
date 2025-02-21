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

router.get("/app/admin/dashboard", (req, res) => {
  if (!req.session.userID) {
    return res.redirect("/");
  }

  const schoolId = req.query.school_id;
  const searchQuery = req.query.search || "";

  db.get(
    `SELECT admin_users.*, roles.role AS user_role, schools.school_name AS user_school
     FROM admin_users
     JOIN roles ON admin_users.role = roles.role_id
     JOIN schools ON admin_users.school_id = schools.school_id
     WHERE admin_users.user_id = ?`,
    [req.session.userID],
    (err, users) => {
      if (err) return res.status(500).send("Error fetching user's record");
      if (!users) return res.status(404).send("User not found");

      const schoolID = users.school_id;

      db.all(
        "SELECT * FROM notice WHERE school_id = ?",
        [schoolID],
        (err, notices) => {
          if (err) return res.status(500).send("Error getting notice data");

          const defaultImage = "/images/notice-placeholder.jpeg";
          const noticeIMG = notices.map((notice) => {
            if (notice.image) {
              notice.image = notice.image.toString("base64");
            }
            return notice;
          });

          const query = schoolId
            ? `SELECT users.*, positions.position AS user_position, roles.role AS user_role, auth.username, 
                COALESCE(juniorHighClasses.class_name, seniorHighClasses.class_name) AS class_name
               FROM users
               LEFT JOIN positions ON users.position = positions.position_id
               JOIN roles ON users.role = roles.role_id
               LEFT JOIN juniorHighClasses ON users.class = juniorHighClasses.class_id
               LEFT JOIN seniorHighClasses ON users.class = seniorHighClasses.class_id
               JOIN auth ON users.user_id = auth.user_id
               WHERE users.school_id = ?`
            : `SELECT users.*, positions.position AS user_position, roles.role AS user_role, auth.username,
                COALESCE(juniorHighClasses.class_name, seniorHighClasses.class_name) AS class_name
               FROM users
               LEFT JOIN positions ON users.position = positions.position_id
               JOIN roles ON users.role = roles.role_id
               LEFT JOIN juniorHighClasses ON users.class = juniorHighClasses.class_id
               LEFT JOIN seniorHighClasses ON users.class = seniorHighClasses.class_id
               JOIN auth ON users.user_id = auth.user_id`;

          const params = schoolId ? [schoolId] : [];

          db.all(query, params, (err, allusers) => {
            if (err) return res.status(500).send("Error getting all users");

            allusers = allusers.map((alluser) => {
              if (alluser.profile_picture) {
                alluser.profile_picture =
                  alluser.profile_picture.toString("base64");
              }
              return alluser;
            });

            const students = allusers.filter(
              (user) => user.user_role === "Student"
            );
            const instructors = allusers.filter(
              (user) => user.user_role === "Instructor"
            );
            const administrators = allusers.filter(
              (user) => user.user_role === "Administrator"
            );

            const filteredInstructors = instructors.filter((instructor) => {
              const fullName = instructor.fullName?.toLowerCase() || "";
              const email = instructor.email?.toLowerCase() || "";
              const phone = instructor.phone?.toLowerCase() || "";
              return (
                fullName.includes(searchQuery.toLowerCase()) ||
                email.includes(searchQuery.toLowerCase()) ||
                phone.includes(searchQuery.toLowerCase())
              );
            });

            db.all("SELECT * FROM periods", (err, periods) => {
              if (err) return res.status(500).send("Error getting periods");

              db.get(
                "SELECT * FROM auth WHERE user_id = ?",
                [req.session.userID],
                (err, authRows) => {
                  if (err)
                    return res.status(500).send("Error fetching auth record");

                  db.get(
                    `SELECT sponsors.*, 
                      users.fullName AS instructor_name, 
                      juniorClass.class_name AS junior_class_name, 
                      seniorClass.class_name AS senior_class_name
                   FROM sponsors
                   JOIN users ON sponsors.instructor_id = users.user_id
                   LEFT JOIN juniorHighClasses AS juniorClass ON sponsors.class = juniorClass.class_id
                   LEFT JOIN seniorHighClasses AS seniorClass ON sponsors.class = seniorClass.class_id
                   WHERE sponsors.class = ?`,
                    [users.class],
                    (err, studentSponsor) => {
                      if (err) {
                        console.error(
                          "Error occurred while getting student sponsor:",
                          err
                        );
                        return res.send(
                          "Error occurred in getting student sponsor"
                        );
                      }

                      db.get(
                        `SELECT users.*, juniorHighClasses.class_name AS junior_class_name
                       FROM users
                       JOIN juniorHighClasses ON users.class = juniorHighClasses.class_id
                       WHERE users.user_id = ?`,
                        [req.session.userID],
                        (err, juniorClassName) => {
                          if (err)
                            return res
                              .status(500)
                              .send("Error fetching Junior High class name");

                          db.get(
                            `SELECT users.*, seniorHighClasses.class_name AS senior_class_name
                           FROM users
                           JOIN seniorHighClasses ON users.class = seniorHighClasses.class_id
                           WHERE users.user_id = ?`,
                            [req.session.userID],
                            (err, seniorClassName) => {
                              if (err)
                                return res
                                  .status(500)
                                  .send(
                                    "Error fetching Senior High class name"
                                  );

                              db.get(
                                `
                              SELECT sponsors.*, 
                                instructor.fullName AS instructor_name, 
                                juniorClass.class_name AS junior_class_name,
                                seniorClass.class_name AS senior_class_name
                               FROM sponsors
                               JOIN users AS instructor ON sponsors.instructor_id = instructor.user_id
                               LEFT JOIN juniorHighClasses AS juniorClass ON sponsors.class = juniorClass.class_id
                               LEFT JOIN seniorHighClasses AS seniorClass ON sponsors.class = seniorClass.class_id
                               WHERE sponsors.school_id = ? 
                                 AND sponsors.instructor_id = ?`,
                                [users.school_id, req.session.userID],
                                (err, userSponsorData) => {
                                  if (err) {
                                    console.error(
                                      "Error executing query:",
                                      err
                                    );
                                    return res
                                      .status(500)
                                      .send("Error getting sponsors data");
                                  }

                                  db.all(
                                    "SELECT * FROM schools",
                                    (err, schools) => {
                                      if (err)
                                        return res.send(
                                          "Error getting schools data"
                                        );

                                      // Fetch roles and user counts
                                      db.all(
                                        `SELECT * FROM roles WHERE role IN ('Instructor', 'Student')`,
                                        (err, roleData) => {
                                          if (err)
                                            return res
                                              .status(500)
                                              .send("Error fetching roles");

                                          // Extract role IDs for Instructor and Student
                                          const instructorRole = roleData.find(
                                            (role) => role.role === "Instructor"
                                          );
                                          const studentRole = roleData.find(
                                            (role) => role.role === "Student"
                                          );

                                          if (!instructorRole || !studentRole) {
                                            return res
                                              .status(500)
                                              .send(
                                                "Required roles not found in database"
                                              );
                                          }

                                          // Fetch total instructors
                                          db.get(
                                            `SELECT COUNT(*) AS total FROM users WHERE users.role = ? AND users.school_id = ?`,
                                            [instructorRole.role_id, schoolID],
                                            (err, instructorRow) => {
                                              if (err)
                                                return res
                                                  .status(500)
                                                  .send(
                                                    "Error fetching instructor count"
                                                  );

                                              const totalInstructor =
                                                instructorRow?.total || 0;
                                              console.log(
                                                "Total Instructors:",
                                                totalInstructor
                                              );

                                              // Fetch total students
                                              db.get(
                                                `SELECT COUNT(*) AS total FROM users WHERE users.role = ? AND users.school_id = ?`,
                                                [studentRole.role_id, schoolID],
                                                (err, studentRow) => {
                                                  if (err)
                                                    return res
                                                      .status(500)
                                                      .send(
                                                        "Error fetching student count"
                                                      );

                                                  const totalStudent =
                                                    studentRow?.total || 0;
                                                  console.log(
                                                    "Total Students:",
                                                    totalStudent
                                                  );

                                                  // Final render with all required data
                                                  return res.render(
                                                    "admin-dashboard",
                                                    {
                                                      users,
                                                      userID: authRows,
                                                      notices,
                                                      noticeIMG,
                                                      allusers,
                                                      periods,
                                                      students,
                                                      instructors:
                                                        filteredInstructors,
                                                      administrators,
                                                      userSponsorData,
                                                      noSponsorFound:
                                                        !userSponsorData,
                                                      schools,
                                                      juniorClassName,
                                                      seniorClassName,
                                                      studentSponsor,
                                                      totalInstructor,
                                                      totalStudent,
                                                    }
                                                  );
                                                }
                                              );
                                            }
                                          );
                                        }
                                      );
                                    }
                                  );
                                }
                              );
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
        }
      );
    }
  );
});

module.exports = router;
