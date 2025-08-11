// app.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const methodOverride = require('method-override');

const app = express();

/* ---------------- Passport config ---------------- */
require('./config/passport')(passport);

/* ---------------- DB connect ---------------- */
const mongoURI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/movies_app';

mongoose
  .connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

/* ---------------- Views ---------------- */
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

/* ---------------- Middleware ---------------- */
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Trust proxy in production so secure cookies work behind Heroku proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production', // true on Heroku
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Make user & flash messages available to all views
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;

  // support both styles in views
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');

  next();
});

/* ---------------- Routes ---------------- */
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');

// Mount auth at "/" so URLs are /login, /register, /logout
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/movies', movieRoutes);

/* ---------------- 404 & Error handlers ---------------- */
app.use((req, res) => {
  res.status(404).render('404', { title: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { title: 'Server Error', error: err });
});

/* ---------------- Start server ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
