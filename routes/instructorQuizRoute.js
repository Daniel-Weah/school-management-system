const express = require("express");
const db = require("../model/db");
const { v4: uuidv4 } = require('uuid');

// POST route to create a quiz

const router = express.Router();

router.post("/create/quiz", (req, res) => {
  const { quiz_title, quiz_type, quiz_duration, students, questions } =
    req.body;

  // Insert quiz into quizzes table
  const quiz_id = uuidv4(); // generate a unique ID for the quiz
  const query = `INSERT INTO quizzes (quiz_id, subject_id, instructor_id, quiz_title, quiz_type, quiz_duration) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(
    query,
    [quiz_id, quiz_title, quiz_type, quiz_duration],
    function (err) {
      if (err) {
        return res.status(500).send("Error creating quiz");
      }

      // Insert questions into questions table
      const question_data = JSON.parse(questions); // questions in JSON format
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
