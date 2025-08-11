// middleware/auth.js

// Require login
function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  req.flash('error', 'Please log in first');
  return res.redirect('/login');
}

// Require ownership of a resource
function ensureOwner(Model) {
  return async (req, res, next) => {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) {
        req.flash('error', 'Not found');
        return res.redirect('/movies');
      }
      if (!req.user || doc.createdBy?.toString() !== req.user._id.toString()) {
        req.flash('error', 'Not authorized');
        return res.redirect(`/movies/${req.params.id}`);
      }
      req.doc = doc; // pass to next
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { ensureAuth, ensureOwner };
