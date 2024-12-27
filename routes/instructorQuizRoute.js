const express = require("express");
const db = require("../model/db");
const { v4: uuidv4 } = require("uuid");

// POST route to create a quiz

const router = express.Router();

router.get("/instructor-assessment", (req, res) => {
  if (!req.session.userID) {
    return res.redirect("/");
  }
  const subjectSlugName = req.session.subjectName;
  console.log('The session subject slug name', subjectSlugName);

  const [firstName, ...lastName] = subjectSlugName.split("-");
  const name = [firstName, ...lastName].join(" ");

  const firstLetter = name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("");
  console.log(firstLetter);

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

      db.get(
        `SELECT subjects.*, users.*
           FROM subjects
           JOIN users ON subjects.instructor_id = users.user_id
           WHERE LOWER(REPLACE(subjects.subject_name, ' ', '-')) = ?`,
        [subjectSlugName.toLowerCase()],
        (err, user) => {
          if (err) {
            return res.status(500).send("Error fetching user's details");
          }
          if (!user) {
            return res.status(404).send("User slug not found");
          }

          db.get(
            "SELECT * FROM auth WHERE user_id = ?",
            [req.session.userID],
            (err, authRows) => {
              if (err) {
                return res.status(500).send("Error fetching auth record");
              }

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

              const getInstructorQuizData = () => {
                return new Promise((resolve, reject) => {
                  db.all(
                    "SELECT * FROM student_quizzes WHERE instructor_id = ?",
                    [req.session.userID],
                    (err, data) => (err ? reject(err) : resolve(data))
                  );
                });
              };

              const fetchAllQuizDetails = (studentQuizData) => {
                const quizPromises = studentQuizData.map((studentQuiz) =>
                  getQuizDetails(studentQuiz.quiz_id)
                );
                return Promise.all(quizPromises).then(
                  (results) => results.filter((quiz) => quiz) // Filter out undefined/null quizzes
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
                  const studentQuizData = await getInstructorQuizData();
                  const quizzes = await fetchAllQuizDetails(studentQuizData);

                  console.log("This is the quizzes Data", quizzes);

                  const subjectName = subjectSlug
                    .split("-")
                    .map((w, i) =>
                      i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)
                    )
                    .join(" ");
                  const initials = subjectName
                    .split(" ")
                    .map((word) => word.charAt(0))
                    .join("");

                  res.render("instructor-assessment", {
                    users,
                    user,
                    firstLetter,
                    firstName,
                    userID: authRows,
                    quizData: quizzes,
                  });
                } catch (err) {
                  console.error("Error processing assessment request:", err);
                  res.status(500).send("An error occurred while fetching data");
                }
              })();
            }
          );
        }
      );
    }
  );
});

router.post("/create/quiz", (req, res) => {
  const { quiz_title, quiz_type, quiz_duration, students, questions } =
    req.body;

  const quiz_id = uuidv4();
  const query = `INSERT INTO quizzes (quiz_id, subject_id, instructor_id, quiz_title, quiz_type, quiz_duration) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(
    query,
    [quiz_id, quiz_title, quiz_type, quiz_duration],
    function (err) {
      if (err) {
        return res.status(500).send("Error creating quiz");
      }

      const question_data = JSON.parse(questions);
      question_data.forEach((q) => {
        const question_id = uuidv4();
        const question_query = `INSERT INTO questions (question_id, quiz_id, question_text, quiz_title, question_type, correct_answer) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(question_query, [
          question_id,
          quiz_id,
          q.question_text,
          quiz_title,
          q.question_type,
          q.correct_answer,
        ]);
      });

      // Link quiz to students
      students.forEach((student_id) => {
        const student_query = `INSERT INTO student_quizzes (quiz_id, student_id) VALUES (?, ?)`;
        db.run(student_query, [quiz_id, student_id]);
      });

      res.send("Quiz created and sent to selected students");
    }
  );
});

module.exports = router;
