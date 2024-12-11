const express = require("express");
const db = require("../model/db");

const router = express.Router();

// GET route to fetch quiz for student
router.get("/assessment/:assessmentSlug", (req, res) => {

  const assessmentSlug = req.params.assessmentSlug; 

  
  const [firstName, ...lastName] = assessmentSlug.split("-");
  const name = [firstName, ...lastName].join(" "); 

  // Fetch quiz details
  db.get("SELECT * FROM quizzes WHERE quiz_id = ?", [quiz_id], (err, quiz) => {
    if (err || !quiz) {
      return res.status(404).send("Quiz not found");
    }

    // Fetch questions for the quiz
    db.all(
      "SELECT * FROM questions WHERE quiz_id = ?",
      [quiz_id],
      (err, questions) => {
        if (err || !questions) {
          return res.status(500).send("Error fetching questions");
        }

        // Fetch options for multiple choice questions
        const question_ids = questions.map((q) => q.question_id);
        db.all(
          "SELECT * FROM options WHERE question_id IN (?)",
          [question_ids.join(", ")],
          (err, options) => {
            if (err) {
              return res.status(500).send("Error fetching options");
            }

            // Format the questions with options
            const formattedQuestions = questions.map((q) => {
              return {
                ...q,
                options: options.filter((o) => o.question_id === q.question_id),
              };
            });

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

                db.get(
                  `SELECT subjects.*, users.*
                     FROM subjects
                     JOIN users ON subjects.instructor_id = users.user_id
                     WHERE LOWER(REPLACE(subjects.subject_name, ' ', '-')) = ?`,
                  [subjectSlug.toLowerCase()],
                  (err, user) => {
                    if (err) {
                      return res
                        .status(500)
                        .send("Error fetching user's details");
                    }
                    if (!user) {
                      return res.status(404).send("User slug not found");
                    }

                    db.get(
                      "SELECT * FROM auth WHERE user_id = ?",
                      [req.session.userID],
                      (err, authRows) => {
                        if (err) {
                          return res
                            .status(500)
                            .send("Error fetching auth record");
                        }

                        res.render("student-quiz", {
                          quiz_title: quiz.quiz_title,
                          questions: formattedQuestions,
                          user,
                          users,
                          userID: authRows,
                          firstLetter,
                          assessmentSlug
                        });
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

// POST route to submit quiz answers
router.post("/quiz/submit", (req, res) => {
  const answers = req.body; // Contains answers for each question
  const student_id = req.session.user_id; // Get student ID from session
  const quiz_id = req.body.quiz_id; // Get quiz ID from body

  // Store the student's answers
  for (const [question_id, answer] of Object.entries(answers)) {
    const is_correct = checkAnswer(question_id, answer); // Implement your own answer checking logic
    const answer_id = uuidv4();
    db.run(
      "INSERT INTO student_answers (answer_id, student_id, quiz_id, question_id, answer, is_correct) VALUES (?, ?, ?, ?, ?, ?)",
      [answer_id, student_id, quiz_id, question_id, answer, is_correct]
    );
  }

  res.send("Quiz submitted successfully");
});

module.exports = router;
