const express = require("express");
const db = require("../model/db");
const router = express.Router();
const session = require("express-session");
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const multer = require('multer');

const sessionMiddleware = session({
  secret: "thisismysecretcode484",
  resave: false,
  saveUninitialized: true,
});

router.use(sessionMiddleware);
router.use(bodyParser.urlencoded({extended: true}));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/create-notice", (req, res) => {
  if (!req.session.userID) {
    return res.redirect("/");
  }

  db.get(
    "SELECT * FROM users WHERE user_id = ?",
    [req.session.userID],
    (err, users) => {
      if (err) {
        return res.status(500).send("Error fetching student's record");
      }

      db.get(
        "SELECT * FROM auth WHERE user_id = ?",
        [req.session.userID],
        (err, authRows) => {
          if (err) {
            return res.status(500).send("Error fetching auth record");
          }

          db.all(`SELECT * FROM schools`, (err, schools) => {
            if (err) {
              return res
                .status(500)
                .send("There was an error getting schools data");
            }

            res.render("notice", { users, userID: authRows, schools });
          });
        }
      );
    }
  );
});

router.post('/create-notice', upload.single("image"), (req, res) => {
  const { school, title, description } = req.body;


  const noticeID = uuidv4();

const image = req.file  ? req.file.buffer : null;

  db.run('INSERT INTO notice (notice_id, school_id, title, description, image) VALUES(?, ?, ?, ?, ?)', [noticeID, school, title, description, image], 
    function (err) {
      if (err) {
        return res.send('There was an error inserting into notice');
      }
      res.send('Notice Inserted Successfully');

    }
  );
})
module.exports = router;
