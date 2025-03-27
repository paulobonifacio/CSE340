// Needed Resources
const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");
const validationMiddleware = (req, res, next) => {
    if (!req.body.classification_name || req.body.classification_name.trim() === '') {
        return res.status(400).send("Classification name is required.");
    }
    next();
};

// Route to build inventory by classification view
router.get("/type/:classificationId", invController.buildByClassificationId);

// Route to show vehicle details by ID
router.get("/detail/:invId", invController.showVehicleDetails);

// ✅ New Route: Fetch inventory based on category
router.get("/category", invController.getInventoryByCategory);

router.get('/management', invController.managementPage);


// Route for "Add New Classification"
router.get("/add-classification", invController.addClassificationPage);
router.post('/add-classification', invController.addClassification);

// Route for "Add New Inventory Item"
router.get("/add-inventory", invController.addInventoryPage);

// Handle form submission
router.post('/add-inventory', invController.addInventory);


module.exports = router;
