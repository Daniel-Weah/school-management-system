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
const registration = require('./routes/registration');
const administratorRegistration = require('./routes/administratorRegistration');
const feedbackRouter = require('./routes/feedbackRoute');
const roleRouter = require('./routes/roleRoute');
const positionRouter = require('./routes/positionRoute');
const schoolRouter = require('./routes/schoolRoute');
const requestTranscript = require('./routes/transcriptRoute');
const sponsorRoute = require('./routes/sponsor-registration');
const noticeRoute = require('./routes/createNotice');
const classRegistration = require('./routes/class-registration');
const periodRouter = require('./routes/createPeriod');
const logout = require('./routes/logoutRoute');
const instructordashboard = require('./routes/instructorDashboardRoute');
const userDetailsRouter = require('./routes/userDetails');
const attendanceRoute = require('./routes/attendanceRoute');
const createUserRoute = require('./routes/createUser');
const adminLoginRoute = require('./routes/admin-login');
const adminDashboardRoute = require('./routes/admin-dashboard');
const subjectRoute = require('./routes/subjectRoute');
const adminSubjectRoute = require('./routes/admin-subjects');
const adminScheduleRoute = require('./routes/adminScheduleRoute');
const schedule = require('./routes/schedule');

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
app.use(registration);
app.use(administratorRegistration);
app.use(studentLogin);
app.use(loginRouter);
app.use(feedbackRouter);
app.use(roleRouter);
app.use(positionRouter);
app.use(schoolRouter);
app.use(requestTranscript);
app.use(sponsorRoute)
app.use(noticeRoute);
app.use(classRegistration);
app.use(periodRouter);
app.use(logout);
app.use(instructordashboard);
app.use(userDetailsRouter);
app.use(attendanceRoute);
app.use(createUserRoute);
app.use(adminLoginRoute);
app.use(adminDashboardRoute);
app.use(subjectRoute);
app.use(adminSubjectRoute);
app.use(adminScheduleRoute);
app.use(schedule);

app.listen(5000, () => {
 console.log('Server is running on http://localhost:5000');
});
