const pool = require('../database/index');


// In models/account-model.js
async function registerAccount(
  account_firstname,
  account_lastname,
  account_email,
  account_password,
  account_type = 'Regular' // Default to Regular if not specified
) {
  try {
    const sql = `
      INSERT INTO account (
        account_firstname, 
        account_lastname, 
        account_email, 
        account_password,
        account_type
      ) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING account_id, account_firstname, account_type
    `;
    const result = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_password,
      account_type
    ]);
    return result.rows[0];
  } catch (error) {
    console.error('Database registration error:', error);
    throw error;
  }
}

/* *****************************
* Get account by ID
* ***************************** */
async function getAccountById(account_id) {
  try {
    const sql = 'SELECT * FROM account WHERE account_id = $1';
    const result = await pool.query(sql, [account_id]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

/* *****************************
* Check if email exists (excluding current account)
* ***************************** */
async function checkExistingEmail(email, account_id = null) {
  try {
    let sql = 'SELECT * FROM account WHERE account_email = $1';
    let params = [email];
    
    if (account_id) {
      sql += ' AND account_id != $2';
      params.push(account_id);
    }
    
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
}

/* *****************************
* Update account information
* ***************************** */
async function updateAccount(account_id, firstname, lastname, email) {
  try {
    const sql = `
      UPDATE account 
      SET account_firstname = $1,
          account_lastname = $2,
          account_email = $3,
          account_updated = NOW()
      WHERE account_id = $4
      RETURNING *`;
    
    const result = await pool.query(sql, [
      firstname,
      lastname,
      email,
      account_id
    ]);
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

/* *****************************
* Update password
* ***************************** */
async function updatePassword(account_id, password) {
  try {
    const sql = `
      UPDATE account 
      SET account_password = $1,
          account_updated = NOW()
      WHERE account_id = $2
      RETURNING *`;
    
    const result = await pool.query(sql, [
      password,
      account_id
    ]);
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

/* ****************************************
 * Get account by email with password hash
 * *************************************** */
async function getAccountByEmail(account_email) {
  try {
    const sql = `
      SELECT 
        account_id, 
        account_firstname, 
        account_lastname, 
        account_email, 
        account_password, 
        account_type
      FROM account 
      WHERE account_email = $1
    `;
    const result = await pool.query(sql, [account_email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting account by email:', error);
    throw error;
  }
}

module.exports = {
  getAccountById,
  checkExistingEmail,
  updateAccount,
  updatePassword,
  registerAccount,
  getAccountByEmail,
};