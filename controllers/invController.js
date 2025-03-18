const invModel = require("../models/inventory-model");
const utilities = require("../utilities/");

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

module.exports = invCont;
