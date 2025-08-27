function ensureAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  } else {
    res.redirect('/admin/login');
  }
}

module.exports = ensureAuth;
