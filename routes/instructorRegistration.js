const express = require('express');
const db = require('../model/db');
const bodyParser = require('body-parser');

const router = express.Router();

router.use(bodyParser.urlencoded({extended: true}));

router.get('/registration', (req, res) => {
 db.all('SELECT * FROM schools', (err, schools) => {
  if (err) {
    res.send('There was an error getting schools data');
    return;
  }
  db.all('SELECT * FROM roles', (err, roles) => {
   if (err) {
    res.send('There was an error getting roles data');
   }

   db.all('SELECT * FROM positions', (err, positions) => {
    if (err) {
     res.send('There was an error getting positions data');
    }
    
    console.log(schools);
    console.log(roles);
    console.log(positions);

    res.render('instructor-registration', { schools, roles, positions });
   })
  })
});
});

router.post('/registration', (req, res) => {

})

module.exports = router;