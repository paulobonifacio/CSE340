const accountModel = require('../models/accountmodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const utilities = require('../utilities');

/* ****************************************
 *  Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
  try {
    res.render('account/login', {
      title: 'Login',
      nav: await utilities.getNav(),
      errors: null,
      message: req.query.message
    });
  } catch (error) {
    next(error);
  }
}

/* ****************************************
 * Process login request
 * *************************************** */
async function accountLogin(req, res, next) {
  try {
    console.log('Login attempt with:', req.body);

    const { account_email, account_password } = req.body;

    const errors = [];
    if (!account_email) errors.push('Email is required');
    if (!account_password) errors.push('Password is required');

    if (errors.length > 0) {
      return res.render('account/login', {
        title: 'Login',
        nav: await utilities.getNav(),
        errors,
        account_email
      });
    }

    const account = await accountModel.getAccountByEmail(account_email);

    if (!account) {
      return res.render('account/login', {
        title: 'Login',
        nav: await utilities.getNav(),
        errors: ['Invalid email or password'],
        account_email
      });
    }

    const passwordMatch = await bcrypt.compare(account_password, account.account_password);

    if (!passwordMatch) {
      return res.render('account/login', {
        title: 'Login',
        nav: await utilities.getNav(),
        errors: ['Invalid email or password'],
        account_email
      });
    }

    const token = jwt.sign(
      {
        account_id: account.account_id,
        account_firstname: account.account_firstname,
        account_lastname: account.account_lastname,
        account_email: account.account_email,
        account_type: account.account_type
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000
    });

    return res.redirect('/account');

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
}

/* ****************************************
 *  Deliver registration view
 * *************************************** */
async function buildRegister(req, res, next) {
  try {
    res.render('account/register', {
      title: 'Register',
      nav: await utilities.getNav(),
      errors: null,
      message: null
    });
  } catch (error) {
    next(error);
  }
}

/* ****************************************
 *  Process registration
 * *************************************** */
async function registerAccount(req, res, next) {
  try {
    console.log("📦 Dados recebidos no registro:", req.body);

    const { account_firstname, account_lastname, account_email, account_password } = req.body;
    let account_type = req.body.account_type;

    const allowedTypes = ["Client", "Employee", "Admin"];
    if (!allowedTypes.includes(account_type)) {
      console.warn(`⚠️ Tipo de conta inválido recebido: "${account_type}", substituindo por "Client"`);
      account_type = "Client";
    }

    const errors = [];
    if (!account_firstname) errors.push('First name is required');
    if (!account_lastname) errors.push('Last name is required');
    if (!account_email) errors.push('Email is required');

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{12,}$/;
    if (!passwordRegex.test(account_password)) {
      errors.push('Password must be at least 12 characters and contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character');
    }

    const emailExists = await accountModel.checkExistingEmail(account_email);
    if (emailExists) {
      errors.push('Email already exists. Please log in or use a different email');
    }

    if (errors.length > 0) {
      return res.render('account/register', {
        title: 'Register',
        nav: await utilities.getNav(),
        errors,
        accountData: req.body
      });
    }

    const hashedPassword = await bcrypt.hash(account_password, 10);

    const result = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword,
      account_type
    );

    if (result) {
      const token = jwt.sign(
        {
          account_id: result.account_id,
          account_firstname: result.account_firstname,
          account_type: result.account_type
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
      );

      res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      return res.redirect('/account');
    } else {
      throw new Error('Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
}

/* ****************************************
 * Build Account Update View
 * *************************************** */
async function buildUpdate(req, res, next) {
  try {
    const accountData = await accountModel.getAccountById(req.params.accountId);
    res.render('account/update', {
      title: 'Update Account',
      accountData,
      nav: await utilities.getNav(),
      errors: null,
      message: null
    });
  } catch (error) {
    next(error);
  }
}

/* ****************************************
 * Update Account Information
 * *************************************** */
async function updateAccount(req, res, next) {
  try {
    const { account_id, account_firstname, account_lastname, account_email } = req.body;
    const errors = [];

    if (!account_firstname) errors.push('First name is required');
    if (!account_lastname) errors.push('Last name is required');
    if (!account_email) errors.push('Email is required');

    if (errors.length > 0) {
      return res.render('account/update', {
        title: 'Update Account',
        accountData: req.body,
        errors,
        message: null
      });
    }

    const emailExists = await accountModel.checkExistingEmail(account_email);
    if (emailExists && emailExists.account_id != account_id) {
      errors.push('Email already in use by another account');
      return res.render('account/update', {
        title: 'Update Account',
        accountData: req.body,
        errors,
        message: null
      });
    }

    await accountModel.updateAccount(
      account_id,
      account_firstname,
      account_lastname,
      account_email
    );

    const updatedAccount = await accountModel.getAccountById(account_id);

    const token = jwt.sign(
      {
        account_id: updatedAccount.account_id,
        account_firstname: updatedAccount.account_firstname,
        account_lastname: updatedAccount.account_lastname,
        account_email: updatedAccount.account_email,
        account_type: updatedAccount.account_type
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );
    

    res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.redirect('/account?message=Account updated successfully');
  } catch (error) {
    next(error);
  }
}

/* ****************************************
 * Update Password
 * *************************************** */
async function updatePassword(req, res, next) {
  try {
    const { account_id, account_password } = req.body;
    const errors = [];

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{12,}$/;
    if (!passwordRegex.test(account_password)) {
      errors.push('Password must be at least 12 characters and contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character');
    }

    if (errors.length > 0) {
      const accountData = await accountModel.getAccountById(account_id);
      return res.render('account/update', {
        title: 'Update Account',
        accountData,
        errors,
        message: null
      });
    }

    const hashedPassword = await bcrypt.hash(account_password, 10);
    await accountModel.updatePassword(account_id, hashedPassword);

    res.redirect('/account?message=Password updated successfully');
  } catch (error) {
    next(error);
  }
}

/* ****************************************
 * Logout Process
 * *************************************** */
function logout(req, res) {
  res.clearCookie('jwt');
  res.redirect('/account/login?message=You have been logged out');
}

/* ****************************************
 * Deliver account management view
 * *************************************** */
async function buildManagement(req, res, next) {
  try {
    res.render('account/management', {
      title: 'Account Management',
      nav: await utilities.getNav(),
      errors: null,
      message: req.query.message
    });
  } catch (error) {
    next(error);
  }
}

/* ****************************************
 * Deliver account home view
 * *************************************** */
async function buildAccount(req, res, next) {
  try {
    const accountData = {
      account_id: req.accountData.account_id,
      account_firstname: req.accountData.account_firstname,
      account_lastname: req.accountData.account_lastname,
      account_email: req.accountData.account_email,
      account_type: req.accountData.account_type
    };

    res.render('account/account', {
      title: 'Account Management',
      accountData,
      nav: await utilities.getNav(),
      message: req.query.message
    });
  } catch (error) {
    console.error('Account management view error:', error);
    next(error);
  }
}

/* ****************************************
 * Export all controller functions
 * *************************************** */
module.exports = {
  buildLogin,
  accountLogin,
  buildRegister,
  registerAccount,
  buildManagement,
  buildUpdate,
  updateAccount,
  updatePassword,
  logout,
  buildAccount
};
