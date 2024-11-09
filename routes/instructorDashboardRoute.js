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
router.get("/instructor/dashboard", (req, res) => {
    // Check if the instructor is logged in
    if (!req.session.instructorId) {
      return res.redirect("/");
    }
  
    const schoolId = req.query.school_id;
  
    // Fetch the instructor details
    db.get(
        `SELECT instructors.*, roles.role AS instructor_role, positions.position AS instructor_position, schools.school_name AS instructor_school
FROM instructors
JOIN roles ON instructors.role = roles.role_id
JOIN positions ON instructors.position = positions.position_id
JOIN schools ON instructors.school_id = schools.school_id
WHERE instructors.instructor_id = ?
`,
        [req.session.instructorId],
        (err, instructorData) => {
          if (err) {
            console.error('Error fetching instructor record:', err); // Log the error
            return res.status(500).send("Error fetching instructor's record");
          }
      
          // Log the instructor data to see what is returned
          console.log('Instructor Data:', instructorData);
      
          if (!instructorData) {
            return res.status(404).send("Instructor not found");
          }
      
       
        // Fetch the instructor's auth record
        db.get(
          "SELECT * FROM instructorAuth WHERE instructor_id = ?",
          [req.session.instructorId],
          (err, authRows) => {
            if (err) {
              return res.status(500).send("Error fetching auth record");
            }
  
            // Fetch notices for the instructor's school
            const instructorSchoolID = instructorData.school_id;
            db.all(
              "SELECT * FROM notice WHERE school_id = ?",
              [instructorSchoolID],
              (err, notices) => {
                if (err) {
                  return res.status(500).send("There was an error getting notice data");
                }
  
                // Convert notice images to base64
                const noticeIMG = notices.map((notice) => {
                  if (notice.image) {
                    notice.image = notice.image.toString("base64");
                  }
                  return notice;
                });
  
                // Fetch all schools
                db.all("SELECT * FROM schools", (err, schools) => {
                  if (err) {
                    return res.status(500).send("There was an error getting schools data");
                  }
  
                  // Build query for students based on school_id
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
  
                  // Fetch all students
                  db.all(query, params, (err, allStudents) => {
                    if (err) {
                      return res.status(500).send("There was an error getting all students");
                    }
  
                    // Convert student profile pictures to base64
                    allStudents = allStudents.map((student) => {
                      if (student.profile_picture) {
                        student.profile_picture = student.profile_picture.toString("base64");
                      }
                      return student;
                    });
  
                    // Fetch periods data
                    db.all("SELECT * FROM periods", (err, periods) => {
                      if (err) {
                        return res.status(500).send("There was an error getting periods");
                      }
  
                      // Render the instructor dashboard page
                      res.render("instructordashboard", {
                        instructorData,  // Instructor data
                        authRows,         // Instructor auth data
                        notices,          // Notices
                        schools,          // Schools list
                        noticeIMG,        // Notices with images converted to base64
                        allStudents,      // List of students
                        periods           // Periods data
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
  });
  


module.exports = router;
