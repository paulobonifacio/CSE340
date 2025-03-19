const utilities = require("../utilities");
const baseController = {};

baseController.buildHome = async function (req, res, next) {
  try {
    const nav = await utilities.getNav();
    res.render("index", { title: "Home", nav });
  } catch (error) {
    console.error("Error loading home page:", error);
    next(error);
  }
};

module.exports = baseController;
