const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId && req.session.isAuthenticated) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
};

const isAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  res.status(403).render('error', {
    message: 'Access Denied',
    error: { status: 403 },
    user: req.session.userId ? { 
      id: req.session.userId,
      name: req.session.userName,
      role: req.session.userRole,
      isAuthenticated: true 
    } : null
  });
};

const isGuest = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return next();
  }
  res.redirect('/');
};

module.exports = { isAuthenticated, isAdmin, isGuest };