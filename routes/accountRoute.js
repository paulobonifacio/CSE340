const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { requireAuth } = require('../middleware/authMiddleware');

// Login routes
router.get('/login', accountController.buildLogin);
router.post('/login', accountController.accountLogin);

// Registration routes
router.get('/register', accountController.buildRegister);
router.post('/register', accountController.registerAccount);

// Account management routes (protected)
router.get('/', requireAuth, accountController.buildAccount); // Changed from '/account' to '/'
router.get('/update/:accountId', requireAuth, accountController.buildUpdate);
router.post('/update', requireAuth, accountController.updateAccount);
router.post('/update-password', requireAuth, accountController.updatePassword);

// Logout
router.get('/logout', accountController.logout);

module.exports = router;