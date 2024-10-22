const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const db = require('./model/db');

// calling all of my routes
const indexRouter = require('./routes/indexRouter');
const studentLogin = require('./routes/studentLogin');
const loginRouter = require('./routes/login');
const dashboardRouter = require('./routes/dashboardRoute');
const calendarRouter = require('./routes/calendarRoute');
const studentRegistration = require('./routes/studentRegistrationRoute');
const instructorRegistration = require('./routes/instructorRegistration');
const administratorRegistration = require('./routes/administratorRegistration');
const feedbackRouter = require('./routes/feedbackRoute');


const app = express();

const sessionMiddleware = session({
 secret: 'thisismysecretcode484',
 resave: false,
 saveUninitialized: true
});

app.use(sessionMiddleware);

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true}));

// ALL OF MY ROUTES
app.use(indexRouter);
app.use(dashboardRouter);
app.use(calendarRouter);
app.use(studentRegistration);
app.use(instructorRegistration);
app.use(administratorRegistration);
app.use(studentLogin);
app.use(loginRouter);
app.use(feedbackRouter);

app.listen(5000, () => {
 console.log('Server is running on http://localhost:5000');
});
