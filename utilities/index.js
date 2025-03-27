const invModel = require("../models/inventory-model");
const Util = {};

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function () {
  try {
    let data = await invModel.getClassifications();
    
    if (!data || data.length === 0) {
      console.warn("⚠️ No classifications found. Using default navigation.");
      return `
        <nav class="navigation">
          <ul class="nav-list">
            <li class="nav-item"><a href="/">Home</a></li>
          </ul>
        </nav>`;
    }

    let navHTML = `
      <nav class="navigation">
        <ul class="nav-list">
          <li class="nav-item"><a href="/">Home</a></li>
    `;
    
    data.forEach((row) => {
      navHTML += `
          <li class="nav-item">
            <a href="/inventory?category=${row.classification_name.toLowerCase()}">
              ${row.classification_name}
            </a>
          </li>
      `;
    });
    
    navHTML += `
        </ul>
      </nav>
    `;
    
    return navHTML;
  } catch (error) {
    console.error("❌ Error fetching classifications:", error);
    return `
      <nav class="navigation">
        <ul class="nav-list">
          <li class="nav-item"><a href="/">Home</a></li>
        </ul>
      </nav>`;
  }
};

/* **************************************
 * Build the classification view grid
 * ************************************ */
Util.buildClassificationGrid = async function (data) {
  if (data.length === 0) {
    return '<p class="notice">Sorry, no matching vehicles could be found.</p>';
  }

  let grid = '<ul id="inv-display">';
  data.forEach((vehicle) => {
    grid += `
      <li class="vehicle-card">
        <a href="/inv/detail/${vehicle.inv_id}" title="View ${vehicle.inv_make} ${vehicle.inv_model} details">
          <img src="${vehicle.inv_thumbnail}" alt="Image of ${vehicle.inv_make} ${vehicle.inv_model}" />
        </a>
        <div class="namePrice">
          <h2>
            <a href="/inv/detail/${vehicle.inv_id}">${vehicle.inv_make} ${vehicle.inv_model}</a>
          </h2>
          <span>$${new Intl.NumberFormat("en-US").format(vehicle.inv_price)}</span>
        </div>
      </li>
    `;
  });
  grid += "</ul>";

  return grid;
};


module.exports = Util;
