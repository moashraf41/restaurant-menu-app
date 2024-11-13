// Attach event listener to the logout button
document.getElementById("logoutBtn").addEventListener("click", async () => {
  const response = await fetch("/logout", { method: "POST" });

  if (response.ok) {
    window.location.href = "/login.html"; // Redirect to login page after logging out
  } else {
    alert("Logout failed!");
  }
});

// Check if the user is logged in by verifying the session
async function checkLoginStatus() {
  const response = await fetch("/check-login", { method: "GET" });

  if (!response.ok) {
    window.location.href = "/login.html"; // Redirect to login if not logged in
  } else {
    document.getElementById("logoutButton").style.display = "block"; // Show logout button
  }
}

// Load JSON data from the server
async function loadData() {
  try {
    const response = await fetch("/api/menu-items", { method: "GET" });
    if (!response.ok) throw new Error("Failed to load menu items.");

    const data = await response.json();
    jsonData = data || [];
    displayData();
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// Display JSON data
// Display JSON data
function displayData() {
  const dataDisplay = document.getElementById("dataDisplay");
  dataDisplay.innerHTML = ""; // Clear previous entries
  jsonData.forEach((item) => {
    const imageUrl = `/api/image?path=${encodeURIComponent(item.image_src)}`;
    const itemHtml = `
      <div class="card mt-3 p-3 shadow-sm menu-item-card">
        <div class="row">
          <div class="col-md-8">
            <h5 class="font-weight-bold">Dish Name: ${item.dish_name}</h5>
            <p><strong>Category:</strong> ${item.category}</p>
            <p><strong>Description:</strong> ${item.description}</p>
            <p><strong>Price:</strong> £${item.price.toFixed(2)}</p>
            <p><strong>Availability:</strong> ${
              item.availability ? "Available" : "Unavailable"
            }</p>
          </div>
          <div class="col-md-4 text-center">
            <img src="${imageUrl}" alt="${
      item.dish_name
    }" class="img-fluid rounded" style="max-height: 150px;">
          </div>
        </div>
        <div class="d-flex justify-content-end mt-3">
          <a href="edit.html?id=${
            item.id
          }" class="btn btn-warning mr-2">Edit</a>
          <button class="btn btn-danger" onclick="deleteMenuItem(${
            item.id
          })">Delete</button>
        </div>
      </div>
    `;
    dataDisplay.innerHTML += itemHtml;
  });
}

// Delete menu item by ID
async function deleteMenuItem(id) {
  if (!confirm("Are you sure you want to delete this menu item?")) return;

  try {
    const response = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete menu item.");

    jsonData = jsonData.filter((item) => item.id !== id);
    displayData(); // Refresh the UI to reflect the changes
  } catch (error) {
    console.error("Error deleting menu item:", error);
  }
}

// Load data and check login status initially
let jsonData = [];
checkLoginStatus();
loadData();
