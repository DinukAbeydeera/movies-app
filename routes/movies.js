const express = require('express');
const { body, validationResult } = require('express-validator');
const Movie = require('../models/Movie');
const { ensureAuth, ensureOwner } = require('../middleware/auth');

const router = express.Router();

// List
router.get('/', async (req, res, next) => {
  try {
    const movies = await Movie.find().populate('createdBy', 'username').sort({ createdAt: -1 });
    res.render('movies/list', { title: 'Movies', movies });
  } catch (e) { next(e); }
});

// New form
router.get('/new', ensureAuth, (req, res) => {
  res.render('movies/form', { title: 'Add Movie', mode: 'create', movie: {} });
});

// Create
router.post('/',
  ensureAuth,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('year').isInt({ min: 1888, max: new Date().getFullYear()+1 }).withMessage('Year is invalid'),
    body('rating').optional({ checkFalsy: true }).isFloat({ min: 0, max: 10 }).withMessage('Rating 0–10'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const payload = {
      name: req.body.name,
      description: req.body.description,
      year: Number(req.body.year),
      genres: (req.body.genres || '').split(',').map(s => s.trim()).filter(Boolean),
      rating: req.body.rating ? Number(req.body.rating) : undefined,
      createdBy: req.user._id
    };
    if (!errors.isEmpty()) {
      return res.status(400).render('movies/form', { title: 'Add Movie', mode: 'create', movie: payload, errors: errors.array() });
    }
    try {
      await Movie.create(payload);
      req.flash('success', 'Movie added');
      res.redirect('/movies');
    } catch (e) { next(e); }
  }
);

// Details
router.get('/:id', async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id).populate('createdBy', 'username');
    if (!movie) {
      req.flash('error', 'Movie not found');
      return res.redirect('/movies');
    }
    const isOwner = req.user && movie.createdBy && movie.createdBy._id.toString() === req.user._id.toString();
    res.render('movies/show', { title: movie.name, movie, isOwner });
  } catch (e) { next(e); }
});

// Edit form
router.get('/:id/edit', ensureAuth, ensureOwner(Movie), (req, res) => {
  res.render('movies/form', { title: 'Edit Movie', mode: 'edit', movie: req.doc });
});

// Update
router.put('/:id',
  ensureAuth,
  ensureOwner(Movie),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('year').isInt({ min: 1888, max: new Date().getFullYear()+1 }).withMessage('Year is invalid'),
    body('rating').optional({ checkFalsy: true }).isFloat({ min: 0, max: 10 }).withMessage('Rating 0–10'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const updates = {
      name: req.body.name,
      description: req.body.description,
      year: Number(req.body.year),
      genres: (req.body.genres || '').split(',').map(s => s.trim()).filter(Boolean),
      rating: req.body.rating ? Number(req.body.rating) : undefined,
    };
    if (!errors.isEmpty()) {
      return res.status(400).render('movies/form', { title: 'Edit Movie', mode: 'edit', movie: { ...req.doc.toObject(), ...updates }, errors: errors.array() });
    }
    try {
      await Movie.findByIdAndUpdate(req.params.id, updates, { runValidators: true });
      req.flash('success', 'Movie updated');
      res.redirect('/movies/' + req.params.id);
    } catch (e) { next(e); }
  }
);

// Delete
router.delete('/:id', ensureAuth, ensureOwner(Movie), async (req, res, next) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ ok: true });
    }
    req.flash('success', 'Movie deleted');
    res.redirect('/movies');
  } catch (e) { next(e); }
});

module.exports = router;
