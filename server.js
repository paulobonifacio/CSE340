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
const path = require("path");
const cookieParser = require("cookie-parser"); 
const dns = require("dns");
const app = express();
const staticRoutes = require("./routes/static");
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoutes = require("./routes/accountRoute");
const utilities = require("./utilities/index");
const pool = require("./database");

/* ***********************
 * Middleware
 *************************/
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(async (req, res, next) => {
  try {
    const nav = await utilities.getNav(req.url);
    res.locals.nav = nav;
    next();
  } catch (error) {
    console.error("Navigation middleware error:", error);
    next();
  }
});

app.use((req, res, next) => {
  const token = req.cookies?.jwt;
  res.locals.loggedin = !!token;
  next();
});

// ✅ Garante que accountData sempre exista nas views
app.use((req, res, next) => {
  res.locals.accountData = req.accountData || {};
  next();
});

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "./layouts/layout");

/* ***********************
 * Routes
 *************************/
app.use(staticRoutes);
app.use("/inventory", inventoryRoute);
app.use("/account", accountRoutes);
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

    const { rows } = await pool.query(query, params);

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
 * DNS Test Route
 *************************/
app.get("/test-db-dns", (req, res) => {
  dns.lookup("dpg-cvbfhulsvqrc73c6qv30-a.frankfurt-postgres.render.com", (err, address, family) => {
    if (err) {
      return res.status(500).send("❌ DNS Lookup Failed: " + err.message);
    }
    res.send(`✅ DNS resolved to ${address} (IPv${family})`);
  });
});

/* ***********************
 * File Not Found Route
 *************************/
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).send("Internal Server Error");
});

app.use(async (req, res, next) => {
  next({ status: 404, message: "Sorry, we appear to have lost that page." });
});

/* ***********************
 * Express Error Handler
 *************************/
app.use(async (err, req, res, next) => {
  try {
    res.locals.nav = await utilities.getNav();
    console.error(`❌ Error at: "${req.originalUrl}": ${err.message}`);
    res.status(err.status || 500).render("errors/error", {
      title: err.status || "Server Error",
      message: err.message
    });
  } catch (error) {
    console.error("❌ Failed to load navigation", error);
    res.status(500).send("Internal Server Error");
  }
});

/* ***********************
 * Temporary route to list registered routes
 *************************/
app.get('/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push(`${middleware.route.stack[0].method.toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push(`${handler.route.stack[0].method.toUpperCase()} /inv${handler.route.path}`);
        }
      });
    }
  });
  res.json({
    message: 'Registered routes',
    routes: routes
  });
});

/* ***********************
 * Local Server Information
 *************************/
const port = process.env.PORT || 5500;
const host = process.env.HOST || "localhost";

/* ***********************
 * Start Server
 *************************/
app.listen(port, () => {
  console.log(`🚀 App listening on http://${host}:${port}`);
});
