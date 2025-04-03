const jwt = require('jsonwebtoken');

module.exports = {
  setAccountData: function(req, res, next) {
    // Initialize
    req.accountData = null;
    res.locals.loggedin = 0;
    
    if (req.cookies?.jwt) {
      try {
        const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);
        
        // Set on both req and res.locals
        req.accountData = {
          account_id: decoded.account_id,
          account_firstname: decoded.account_firstname,
          account_lastname: decoded.account_lastname,
          account_email: decoded.account_email,
          account_type: decoded.account_type
        };
        
        res.locals.accountData = req.accountData;
        res.locals.loggedin = 1;
      } catch (error) {
        console.error("JWT verification failed:", error);
        res.clearCookie('jwt');
      }
    }
    next();
  },

  requireAuth: function(req, res, next) {
    if (!req.accountData) {
      return res.redirect('/account/login?message=Please login first');
    }
    next();
  },

  requireAdmin: function(req, res, next) {
    if (req.accountData?.account_type !== 'Admin') {
      return res.redirect('/account/login?message=Admin access required');
    }
    next();
  }
};