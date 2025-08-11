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

// --- Passport config ---
require('./config/passport')(passport);

// --- DB connect ---
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/movies_app';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// --- View engine ---
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// --- Middleware ---
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// --- Sessions & auth ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// --- Flash messages & user locals ---
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// --- Routes ---
const indexRoutes = require('./routes/index');   // Home page
const authRoutes  = require('./routes/auth');    // Login/Register/Logout
const movieRoutes = require('./routes/movies');  // Movies CRUD

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/movies', movieRoutes);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).render('404', { title: 'Not Found' });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { title: 'Server Error', error: err });
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
