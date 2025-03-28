const invModel = require("../models/inventory-model");
const utilities = require("../utilities");

const invCont = {};

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  try {
    const classification_id = req.params.classificationId;
    const data = await invModel.getInventoryByClassificationId(classification_id);

    if (!data || data.length === 0) {
      throw new Error("No vehicles found for this classification.");
    }

    const grid = await utilities.buildClassificationGrid(data);
    let nav = await utilities.getNav();
    const className = data.length > 0 ? data[0].classification_name : "Vehicles";

    res.render("./inventory/classification", {
      title: className + " vehicles",
      nav,
      grid,
    });
  } catch (error) {
    console.error("Error fetching classification data:", error.message);
    next({ status: 500, message: "Internal Server Error" });
  }
};

/* ***************************
 *  Show individual vehicle details
 * ************************** */
invCont.showVehicleDetails = async (req, res, next) => {
  try {
    const invId = req.params.invId;
    console.log("🔍 Request received for vehicle ID:", invId);  
    const vehicle = await invModel.getVehicleById(invId);
    console.log("🔍 Query result:", vehicle);

    if (!vehicle) {
      return res.status(404).send("Vehicle not found");
    }

    res.render('./inventory/detail', { title: `${vehicle.inv_make} ${vehicle.inv_model}`, vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

/* ***************************
 *  Get inventory by category (via query param)
 * ************************** */
invCont.getInventoryByCategory = async function (req, res, next) {
  try {
    const category = req.query.category || "all";
    const data = await invModel.getInventoryByCategory(category);

    if (!data || data.length === 0) {
      throw new Error("No vehicles found for this category.");
    }

    let nav = await utilities.getNav();

    res.render("./inventory/category", {
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Vehicles`,
      nav,
      vehicles: data,
      selectedCategory: category,
    });
  } catch (error) {
    console.error("Error fetching inventory by category:", error.message);
    next({ status: 500, message: "Internal Server Error" });
  }
};

/* ***************************
 *  Render Add Classification Page
 * ************************** */
invCont.addClassificationPage = async (req, res) => {
  try {
    let nav = await utilities.getNav();
    res.render("inventory/add-classification", { 
      title: "Add Classification",
      nav,
      errors: null,
      message: null
    });
  } catch (error) {
    console.error("❌ Error rendering add-classification page:", error);
    res.status(500).send("Internal Server Error");
  }
};


/* ***************************
 *  Render Add Inventory Page with Classifications
 * ************************** */
invCont.addInventoryPage = async function(req, res) {
  try {
    const nav = await utilities.getNav();
    
    // Get the dropdown HTML from model
    const classificationData = await invModel.getClassificationsWithDropdown();
    
    // Debug: Verify what we received
    console.log("Dropdown HTML received:", classificationData.dropdownHtml);
    
    res.render('inventory/add-inventory', {
      title: 'Add Inventory',
      nav,
      classificationList: classificationData.dropdownHtml
    });
    
  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).send('Server Error');
  }
};

invCont.addInventory = async function(req, res) {
  const {
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
  } = req.body;

  try {
    // Basic validation
    if (!classification_id || !inv_make || !inv_model || !inv_year) {
      req.flash('error', 'Missing required fields');
      return res.redirect('/inventory/add-inventory');
    }

    // Insert into database
    const result = await invModel.addInventory({
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
    });

    if (result) {
      // Successful insertion - redirect with success message
      // req.flash('success', 'Inventory added successfully');
      return res.redirect('/inventory/management');
    } else {
      throw new Error('Database insertion failed');
    }
    
  } catch (error) {
    console.error('Add Inventory Error:', error);
    // req.flash('error', error.message);
    return res.redirect('/inventory/add-inventory');
  }
};

/* ***************************
 *  Render Management Page
 * ************************** */
invCont.managementPage = async (req, res) => {
  try {
    let nav = await utilities.getNav();
    res.render("./inventory/management", { 
      title: "Inventory Management",
      nav
    });
  } catch (error) {
    console.error("❌ Error loading management page:", error);
    res.status(500).send("Internal Server Error");
  }
};




invCont.buildAddClassification = async function(req, res) {
  const nav = await utilities.getNav();
  res.render('inventory/add-classification', {
      title: 'Add Classification',
      nav,
      errors: null,
      message: req.flash('message') || null
  });
};

invCont.addClassification = async function(req, res) {
  const { classification_name } = req.body;
  
  try {
      const nav = await utilities.getNav();
      
      // Basic validation
      if (!classification_name || !/^[A-Za-z0-9]+$/.test(classification_name)) {
          return res.render('inventory/add-classification', {
              title: 'Add Classification',
              nav,
              errors: [{ msg: 'Invalid classification name - only letters and numbers allowed' }],
              classification_name
          });
      }

      // Insert to database
      const result = await invModel.addClassification(classification_name);
      
      if (result) {
          // Redirect with success message in query string
          return res.redirect('/inventory/management?success=Classification+added+successfully');
      } else {
          throw new Error('Database insertion failed');
      }
  } catch (error) {
      console.error('❌ Error:', error.message);
      const nav = await utilities.getNav();
      res.render('inventory/add-classification', {
          title: 'Add Classification',
          nav,
          errors: [{ msg: error.message }],
          classification_name
      });
  }
};



module.exports = invCont;
