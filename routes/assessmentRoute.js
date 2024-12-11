const express = require("express");
const db = require("../model/db");
const router = express.Router();

router.get("/assessment", (req, res) => {
  if (!req.session.userID && req.session.subjectName) {
    return res.redirect("/");
  }

  const subjectSlugName = req.session.subjectName;
  console.log("This is the subject Name in the session", subjectSlugName);

  const getUserData = () => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT users.*, roles.role AS user_role, positions.position, 
          COALESCE(juniorHighClasses.class_name, seniorHighClasses.class_name) AS class_name
         FROM users
         JOIN roles ON users.role = roles.role_id
         LEFT JOIN positions ON users.position = positions.position_id
         LEFT JOIN juniorHighClasses ON users.class = juniorHighClasses.class_id
         LEFT JOIN seniorHighClasses ON users.class = seniorHighClasses.class_id
         WHERE users.user_id = ?`,
        [req.session.userID],
        (err, user) => (err ? reject(err) : resolve(user))
      );
    });
  };

  const getSubjectData = (subjectSlug) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT subjects.*, users.*
         FROM subjects
         JOIN users ON subjects.instructor_id = users.user_id
         WHERE LOWER(REPLACE(subjects.subject_name, ' ', '-')) = ?`,
        [subjectSlug.toLowerCase()],
        (err, subject) => (err ? reject(err) : resolve(subject))
      );
    });
  };

  const getAuthData = () => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM auth WHERE user_id = ?",
        [req.session.userID],
        (err, auth) => (err ? reject(err) : resolve(auth))
      );
    });
  };

  const getQuizDetails = (quizId) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT quizzes.*, subjects.subject_name AS subjectName
        FROM quizzes
        JOIN subjects ON quizzes.subject_id = subjects.subject_id
        WHERE quiz_id = ? AND subjects.subject_name = ?`,
        [quizId, subjectSlugName],
        (err, quiz) => {
          if (err) {
            console.error("Error fetching quiz details:", err);
            reject(err);
          } else if (!quiz) {
            console.warn(`Quiz not found for quiz_id: ${quizId}`);
            resolve(null);
          } else {
            resolve(quiz);
          }
        }
      );
    });
  };
  

  const getStudentQuizData = () => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM student_quizzes WHERE student_id = ?",
        [req.session.userID],
        (err, data) => (err ? reject(err) : resolve(data))
      );
    });
  };

  const fetchAllQuizDetails = (studentQuizData) => {
    const quizPromises = studentQuizData.map((studentQuiz) =>
      getQuizDetails(studentQuiz.quiz_id)
    );
    return Promise.all(quizPromises).then((results) =>
      results.filter((quiz) => quiz) // Filter out undefined/null quizzes
    );
  };
  

  (async () => {
    try {
      const user = await getUserData();
      if (!user) {
        return res.status(404).send("User not found");
      }

      const subjectSlug = req.session.subjectDetail.slugname;
      const subject = await getSubjectData(subjectSlug);
      if (!subject) {
        return res.status(404).send("Subject not found");
      }

      const auth = await getAuthData();
      const studentQuizData = await getStudentQuizData();
      const quizzes = await fetchAllQuizDetails(studentQuizData);

      console.log('This is the quizzes Data', quizzes);

      const subjectName = subjectSlug
        .split("-")
        .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(" ");
      const initials = subjectName
        .split(" ")
        .map((word) => word.charAt(0))
        .join("");

      res.render("assessment", {
        users: user,
        user: subject,
        userID: auth,
        firstLetter: initials,
        quizData: quizzes,
      });
    } catch (err) {
      console.error("Error processing assessment request:", err);
      res.status(500).send("An error occurred while fetching data");
    }
  })();
});

module.exports = router;
