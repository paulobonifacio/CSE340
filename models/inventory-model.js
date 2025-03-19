const pool = require("../database/");

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  try {
    if (!pool) {
      console.warn("⚠️ Database pool is not set up. Returning empty classifications.");
      return [];
    }
    
    const result = await pool.query("SELECT * FROM public.classification ORDER BY classification_name");
    return result.rows;
  } catch (error) {
    console.error("❌ Database error: Could not fetch classifications", error);
    return []; // Ensure it returns an empty array instead of crashing
  }
}

/* ***************************
 *  Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1`,
      [classification_id]
    );
    return data.rows;
  } catch (error) {
    console.error("❌ Error fetching inventory by classification:", error.message);
    throw error;
  }
}

/* ***************************
 *  Get vehicle details by inv_id
 * ************************** */
async function getVehicleById(invId) {
  try {
    const result = await pool.query("SELECT * FROM inventory WHERE inv_id = $1", [invId]);
    return result.rows[0] || null; // Return the first row or null if not found
  } catch (error) {
    console.error("❌ Error fetching vehicle by ID:", error.message);
    throw error; // Ensure errors are properly handled
  }
}



/* ***************************
 *  Get inventory by category (for filtering)
 * ************************** */
async function getInventoryByCategory(category) {
  try {
    let query = `SELECT * FROM public.inventory AS i 
                 JOIN public.classification AS c 
                 ON i.classification_id = c.classification_id`;
    let params = [];

    if (category && category !== "all") {
      query += ` WHERE c.classification_name = $1`;
      params.push(category);
    }

    const { rows } = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error("❌ Database error fetching inventory by category:", error.message);
    throw error;
  }
}

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getVehicleById,
  getInventoryByCategory, // ✅ Added function to get inventory by category
};
