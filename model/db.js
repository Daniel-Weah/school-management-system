const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./school_management_system.db');
const { v4: uuidv4 } = require('uuid');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS auth(
    auth_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  )`);

  // db.run(`DELETE FROM auth WHERE username IN ('daniel');

  // )`);



  db.run(`CREATE TABLE IF NOT EXISTS users(
    user_id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    email TEXT DEFAULT 'No email available',
    phone TEXT NOT NULL,
    location TEXT NOT NULL,
    DOB TEXT NOT NULL,
    division TEXT NOT NULL,
    class TEXT DEFAULT 'No class available',
    role TEXT NOT NULL,
    position TEXT,
    school_id TEXT NOT NULL,
    emergency_name TEXT NOT NULL,
    emergency_phone TEXT NOT NULL,
    emergency_relationship TEXT NOT NULL,
    junior_classes TEXT DEFAULT 'No class available',
    senior_classes TEXT DEFAULT 'No class available',
    junior_subjects TEXT DEFAULT 'No class available',
    senior_subjects TEXT DEFAULT 'No class available',
    profile_picture BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admin_users (
  user_id TEXT PRIMARY KEY,               
  fullName TEXT NOT NULL,                  
  email TEXT NOT NULL,                     
  phone TEXT,                             
  location TEXT,                           
  DOB TEXT,                                
  role INTEGER NOT NULL,                   
  school_id INTEGER NOT NULL,              
  profile_picture BLOB
)`);

  db.run(`CREATE TABLE IF NOT EXISTS sponsors(
    sponsor_id TEXT PRIMARY KEY,
    school_id INTEGER,
    instructor_id TEXT NOT NULL UNIQUE,
    division TEXT NOT NULL,
    class TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(school_id),
    FOREIGN KEY (instructor_id) REFERENCES users(user_id)
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
    instructor_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    subject_Img BLOB,
    subject_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(user_id),
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
    quiz_duration INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,        
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (instructor_id) REFERENCES users(user_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS student_quizzes (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  instructor_id TEXT NOT NULL,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (instructor_id) REFERENCES users(user_id)

);
`);

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
  db.run(`CREATE TABLE IF NOT EXISTS positions(
    position_id TEXT PRIMARY KEY,
    position TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

  )`);
  db.run(`CREATE TABLE IF NOT EXISTS juniorHighClasses(
    class_id TEXT PRIMARY KEY,
    class_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS seniorHighClasses(
    class_id TEXT PRIMARY KEY,
    class_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS notice(
    notice_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS periods(
    period_id TEXT PRIMARY KEY,
    period TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  sponsor_id INTEGER,
  week_start_date DATE,
  monday TEXT,       
  tuesday TEXT,      
  wednesday TEXT,    
  thursday TEXT,     
  friday TEXT,       
  UNIQUE(student_id, week_start_date),
  FOREIGN KEY(student_id) REFERENCES users(user_id)

)
`);
  db.run(`CREATE TABLE IF NOT EXISTS attendance_days (
  id TEXT PRIMARY KEY,
  attendance_id TEXT,
  day TEXT,
  status BOOLEAN,
  FOREIGN KEY(attendance_id) REFERENCES attendance(id)
)`);
db.run(`CREATE TABLE IF NOT EXISTS schedules (
    schedule_id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    school_id TEXT NOT NULL,
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    FOREIGN KEY (instructor_id) REFERENCES users (user_id)
);
`);

// db.run(`DROP TABLE subjects`);
});
// 4e1f5edb-7bae-5dea-94c1-a5ab1d1a496e
// 5e1f50db-7bae-4de0-9fc1-a6ab1d7a496e
// de5333a4-ee07-4e56-a511-3caf06a7a59b
module.exports = db;
