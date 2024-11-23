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

router.get("/app/admin/create-period", (req, res) => {
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

        

            db.all('SELECT * FROM periods', (err, periods) => {
              if (err) {
                return res.status(500).send('There was an error getting periods data');
              }
              
              res.render("period", { users, userID: authRows, periods });
            });
          });
        }
      );
    }
  );

router.post('/create-period', (req, res) => {
  const { period } = req.body;


  const periodID = uuidv4();


  db.run('INSERT INTO periods (period_id, period) VALUES(?, ?)', [periodID, period], 
    function (err) {
      if (err) {
        return res.send('There was an error inserting into notice');
      }
      res.send('Period Inserted Successfully');

    }
  );
})
module.exports = router;
