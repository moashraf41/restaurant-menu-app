document.addEventListener("DOMContentLoaded", () => {
  // Supabase setup
  const SUPABASE_URL = "https://roivmkuqaulywwjvuulk.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvaXZta3VxYXVseXd3anZ1dWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzNDYwNjksImV4cCI6MjA0NjkyMjA2OX0.M3pKhR3iQOoJZTG9yKmMZWoiBZi0pMP7OQGDRrtjJqA";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // Function to fetch and display menu items
  async function loadMenuItems(filter = {}) {
    const { data: items, error } = await supabase
      .from("menu_items")
      .select("*");
    if (error) {
      console.error("Error fetching menu items:", error);
      return;
    }

    const menuContainer = document.getElementById("menuContainer");
    menuContainer.innerHTML = ""; // Clear any existing content

    // Apply filters
    const filteredData = items.filter((item) => {
      const matchName =
        !filter.name ||
        item.dish_name.toLowerCase().includes(filter.name.toLowerCase());
      const matchCategory =
        !filter.category || item.category === filter.category;
      return matchName && matchCategory;
    });

    filteredData.forEach((item) => {
      const imageUrl = `/api/image?path=${encodeURIComponent(item.image_src)}`; // Use the server route for image URL

      const menuItem = document.createElement("div");
      menuItem.classList.add("col-md-6", "mb-4", "col-lg-4");
      menuItem.dataset.id = item.id;

      menuItem.innerHTML = `
      <div class="card menu-item-card h-100">
        <img src="${imageUrl}" alt="${
        item.dish_name || "No Image Available"
      }" class="card-img-top">
        <div class="card-body">
          <h5 class="card-title">${item.dish_name || "Unnamed"}</h5>
          <p class="category-text"><small><strong>Category:</strong> ${
            item.category || "N/A"
          }</small></p>
          <p class="card-description">${
            item.description || "No description available"
          }</p>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <p class="card-price m-0">Price: £${item.price || "0.00"}</p>
            <span class="availability-badge ${
              item.availability ? "available" : "unavailable"
            }">${item.availability ? "Available" : "Out of Stock"}</span>
          </div>
        </div>
      </div>
    `;

      menuContainer.appendChild(menuItem);
    });
  }

  // Load menu items initially
  loadMenuItems();

  // Socket.IO listeners for real-time updates (if needed)
  const socket = io();

  // Listen for a new item added
  socket.on("menu-item-added", (newItem) => {
    loadMenuItems(); // Reload menu items
  });

  // Listen for an item updated
  socket.on("menu-item-updated", (updatedItem) => {
    loadMenuItems(); // Reload menu items
  });

  // Listen for an item deleted
  socket.on("menu-item-deleted", (id) => {
    loadMenuItems(); // Reload menu items
  });

  // Add event listeners to the search fields
  document.getElementById("searchByName").addEventListener("input", () => {
    const name = document.getElementById("searchByName").value;
    const category = document.getElementById("searchByCategory").value;
    loadMenuItems({ name, category });
  });

  document.getElementById("searchByCategory").addEventListener("change", () => {
    const name = document.getElementById("searchByName").value;
    const category = document.getElementById("searchByCategory").value;
    loadMenuItems({ name, category });
  });
});
