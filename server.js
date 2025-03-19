/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/

/* ***********************
 * Require Statements
 *************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const env = require("dotenv").config();
console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL);
const path = require("path");
const app = express();
const staticRoutes = require("./routes/static");
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const utilities = require("./utilities/index");
const pool = require("./database");

/* ***********************
 * Middleware
 *************************/
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Handle form submissions

// Servir arquivos estáticos corretamente
app.use(express.static(path.join(__dirname, "public"))); // Serve arquivos da pasta public
console.log("📂 Servindo arquivos estáticos de:", path.join(__dirname, "public"));


/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "./layouts/layout"); // Not at views root

/* ***********************
 * Routes
 *************************/
app.use(staticRoutes);
// Inventory routes
app.use("/inv", inventoryRoute);

// Index route
app.get("/", baseController.buildHome);

/* ***********************
 * Inventory Filtering Route
 *************************/
app.get("/inventory", async (req, res) => {
  const category = req.query.category || "all"; 

  try {
    let query = `
      SELECT inventory.* 
      FROM inventory
      JOIN classification ON inventory.classification_id = classification.classification_id
    `;
    let params = [];

    if (category !== "all") {
      query += " WHERE LOWER(classification.classification_name) = LOWER($1)";
      params.push(category);
    }

    console.log("🟢 Running SQL Query:", query);
    console.log("🟢 Query Parameters:", params);

    const { rows } = await pool.query(query, params);

    console.log("🟢 Query Result:", rows);

    if (rows.length === 0) {
      return res.render("inventory/classification", { 
        title: `No vehicles found for ${category}`,
        inventory: [],
        selectedCategory: category 
      });
    }

    res.render("inventory/classification", { 
      title: `${category} Vehicles`,
      inventory: rows,
      selectedCategory: category 
    });

  } catch (err) {
    console.error("❌ Error fetching inventory:", err);
    res.status(500).send("Error fetching inventory");
  }
});

/* ***********************
 * File Not Found Route - must be last route in list
 *************************/
// Middleware to catch all errors
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).send("Internal Server Error");
});

app.use(async (req, res, next) => {
  next({ status: 404, message: "Sorry, we appear to have lost that page." });
});

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT || 5500;
const host = process.env.HOST || "localhost";

/* ***********************
 * Express Error Handler
 * Place after all other middleware
 *************************/
app.use(async (err, req, res, next) => {
  try {
    let nav = await utilities.getNav(); // Load navigation dynamically
    console.error(`❌ Error at: "${req.originalUrl}": ${err.message}`);
    res.status(err.status || 500).render("errors/error", {
      title: err.status || "Server Error",
      message: err.message,
      nav,
    });
  } catch (error) {
    console.error("❌ Failed to load navigation", error);
    res.status(500).send("Internal Server Error");
  }
});

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`🚀 App listening on http://${host}:${port}`);
});
