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
    console.log("✅ Classifications fetched from DB:", result.rows); // Debugging log
    return result.rows;
  } catch (error) {
    console.error("❌ Database error: Could not fetch classifications", error);
    return [];
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




/* ***************************
 * Check if classification exists
 * ************************** */
async function checkClassificationExists(classification_name) {
  try {
      const sql = `
          SELECT * FROM classification 
          WHERE classification_name = $1
      `;
      const result = await pool.query(sql, [classification_name.toLowerCase()]);
      return result.rows.length > 0;
  } catch (error) {
      console.error('Error checking classification:', error);
      return false;
  }
}

/* ***************************
* Add new classification
* ************************** */
async function addClassification(classification_name) {
  console.log('📝 Attempting to add classification:', classification_name);
  try {
    const sql = "INSERT INTO classification (classification_name) VALUES ($1) RETURNING *";
    console.log('🔍 SQL query:', sql);
    
    const result = await pool.query(sql, [classification_name.toLowerCase()]);
    console.log('📊 Query result:', result.rows);
    
    return result.rows[0];
  } catch (error) {
    console.error('❌ Database error:', error);
    throw error;
  }
}


async function getClassificationsWithDropdown() {
  try {
    // 1. Execute the database query
    const result = await pool.query(`
      SELECT classification_id, classification_name 
      FROM classification 
      ORDER BY classification_name
    `);

    // 2. Build the HTML options
    const options = result.rows.map(row => 
      `<option value="${row.classification_id}">${row.classification_name}</option>`
    ).join('');

    // 3. Create complete dropdown HTML
    const dropdownHtml = `
      <select class="classification-input" name="classification_id" id="classification_id" required>
        <option value="">Select a Classification</option>
        ${options}
      </select>
    `;

    // 4. Return both raw data and HTML
    return {
      rawData: result.rows,
      dropdownHtml: dropdownHtml
    };

  } catch (error) {
    console.error("Database Error:", error);
    // Return empty dropdown on error
    return {
      rawData: [],
      dropdownHtml: `
        <select name="classification_id" id="classification_id">
          <option value="">Error loading classifications</option>
        </select>
      `
    };
  }
}


async function addInventory(inventoryData) {
  const sql = `
    INSERT INTO inventory (
      classification_id,
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING inv_id
  `;
  
  const values = [
    inventoryData.classification_id,
    inventoryData.inv_make,
    inventoryData.inv_model,
    inventoryData.inv_year,
    inventoryData.inv_description,
    inventoryData.inv_image,
    inventoryData.inv_thumbnail,
    inventoryData.inv_price,
    inventoryData.inv_miles,
    inventoryData.inv_color
  ];
  
  const result = await pool.query(sql, values);
  return result.rows[0].inv_id;
}



console.log('✅ Inventory model methods loaded');
module.exports = {
  addClassification
};



module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getVehicleById,
  getInventoryByCategory, // ✅ Added function to get inventory by category
  addClassification,
  checkClassificationExists,
  getClassificationsWithDropdown,
  addInventory,
};
