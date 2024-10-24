const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./school_management_system.db');
const { v4: uuidv4 } = require('uuid');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS auth(
    auth_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    student_id TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS instructorAuth(
    auth_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    FOREIGN KEY (instructor_id) REFERENCES instructors(instructor_id)
  )`);



  db.run(`CREATE TABLE IF NOT EXISTS students(
    student_id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    email TEXT DEFAULT 'No email available',
    phone TEXT NOT NULL,
    location TEXT NOT NULL,
    DOB TEXT NOT NULL,
    division TEXT NOT NULL,
    class TEXT NOT NULL,
    role TEXT NOT NULL,
    school_id TEXT NOT NULL,
    emergency_name TEXT NOT NULL,
    emergency_phone TEXT NOT NULL,
    emergency_relationship TEXT NOT NULL,
    studentID TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS instructors(
    instructor_id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    email TEXT DEFAULT 'No email available',
    phone TEXT NOT NULL,
    location TEXT NOT NULL,
    DOB TEXT NOT NULL,
    division TEXT NOT NULL,
    subject_id TEXT,
    class TEXT NOT NULL,
    role TEXT NOT NULL,
    position TEXT NOT NULL,
    school_id TEXT NOT NULL,
    emergency_name TEXT NOT NULL,
    emergency_phone TEXT NOT NULL,
    emergency_relationship TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
  )`);

 

  db.run(`CREATE TABLE IF NOT EXISTS sponsor(
    sponsor_id TEXT PRIMARY KEY,
    instructor_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES instructors(instructor_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS schools(
    school_id TEXT PRIMARY KEY,
    school_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS subjects(
    subject_id TEXT PRIMARY KEY,
    subject_name TEXT NOT NULL,
    school_id TEXT NOT NULL,
    instructor_id TEXT,
    FOREIGN KEY (instructor_id) REFERENCES instructors(instructor_id),
    FOREIGN KEY (school_id) REFERENCES schools(school_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS grades(
    grade_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,        
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS quizzes(
    quiz_id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    quiz_title TEXT NOT NULL,
    quiz_type TEXT CHECK(quiz_type IN ('quiz', 'test')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,        
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (instructor_id) REFERENCES instructors(instructor_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS questions(
    question_id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    quiz_title TEXT NOT NULL,
    question_type TEXT CHECK(question_type IN ('multiple_choice', 'short_answer')) NOT NULL,
    correct_answer TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,        
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS options(
    option_id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    option_text TEXT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(question_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS student_answers(
    answer_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    quiz_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_correct BOOLEAN,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id),
    FOREIGN KEY (question_id) REFERENCES questions(question_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages(
    message_id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    message_text TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT 0,
    FOREIGN KEY (sender_id) REFERENCES students(student_id),
    FOREIGN KEY (receiver_id) REFERENCES students(student_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications(
    notification_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    notification_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS roles(
    role_id TEXT PRIMARY KEY,
    role TEXT NOT NULL
  )`);
});

module.exports = db;
