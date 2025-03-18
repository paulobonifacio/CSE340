// Needed Resources
const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");

// Route to build inventory by classification view
router.get("/type/:classificationId", invController.buildByClassificationId);

// Route to show vehicle details by ID
router.get("/detail/:invId", invController.showVehicleDetails);

// ✅ New Route: Fetch inventory based on category
router.get("/category", invController.getInventoryByCategory);

module.exports = router;
