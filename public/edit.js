// Check if the user is logged in when the page loads
async function checkLoginStatus() {
  const response = await fetch("/check-login", { method: "GET" });

  if (!response.ok) {
    window.location.href = "/login.html"; // Redirect to login if not logged in
  } else {
    document.getElementById("logoutButton").style.display = "block"; // Show logout button
  }
}

// Logout function
document.getElementById("logoutBtn").addEventListener("click", async () => {
  const response = await fetch("/logout", { method: "POST" });

  if (response.ok) {
    window.location.href = "/login.html"; // Redirect to login page after logging out
  } else {
    alert("Logout failed!");
  }
});

// Redirect to menu on modal close
function redirectToMenu() {
  window.location.href = "index.html";
}

// Fetch entry ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const entryId = urlParams.get("id"); // Get the entry ID from URL

// Load the entry data and populate the form
async function loadEntry() {
  try {
    const response = await fetch(`/api/menu-items/${entryId}`, {
      method: "GET",
    });
    if (!response.ok) throw new Error("Failed to load menu item.");
    const entry = await response.json();

    // Populate the form with entry data
    document.getElementById("dish_name").value = entry.dish_name;
    document.getElementById("category").value = entry.category;
    document.getElementById("description").value = entry.description;
    document.getElementById("price").value = entry.price;
    document.getElementById("availability").value = entry.availability
      ? "available"
      : "unavailable";

    // Load existing image (if any)
    const imagePreview = document.getElementById("image_preview");
    if (entry.image_src) {
      imagePreview.src = `/api/image?path=${encodeURIComponent(
        entry.image_src
      )}`;
      imagePreview.style.display = "block";
    }
  } catch (error) {
    console.error("Error loading entry:", error);
    document.getElementById("entryForm").innerHTML =
      "<p>Error loading entry.</p>";
  }
}

// Form validation function with inline error messages
function validateForm() {
  let isValid = true;
  document
    .querySelectorAll(".error-message")
    .forEach((el) => (el.textContent = "")); // Clear previous errors

  const dishName = document.getElementById("dish_name").value;
  if (!/^[A-Za-z\s\u0600-\u06FF]+$/.test(dishName)) {
    document.getElementById("dish_name_error").textContent =
      "Dish name must contain only alphabetic characters.";
    isValid = false;
  }

  const category = document.getElementById("category").value.trim();
  if (!category) {
    document.getElementById("category_error").textContent =
      "Please select a category.";
    isValid = false;
  }

  const description = document.getElementById("description").value.trim();
  if (!description) {
    document.getElementById("description_error").textContent =
      "Description cannot be empty.";
    isValid = false;
  } else if (description.length > 200) {
    document.getElementById("description_error").textContent =
      "Description cannot exceed 200 characters.";
    isValid = false;
  }

  const price = parseFloat(document.getElementById("price").value);
  if (isNaN(price) || price <= 0) {
    document.getElementById("price_error").textContent =
      "Price must be a positive number.";
    isValid = false;
  }

  return isValid; // Only proceed if all validations pass
}

// Update existing menu item
async function updateMenuItem() {
  if (!validateForm()) return;

  const formData = new FormData();
  formData.append("dish_name", document.getElementById("dish_name").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("price", parseFloat(document.getElementById("price").value));
  formData.append(
    "availability",
    document.getElementById("availability").value
  );
  const imageFile = document.getElementById("image_src").files[0];
  if (imageFile) {
    formData.append("image", imageFile);
  }
  console.log("Updating item with ID:", entryId);

  try {
    const response = await fetch(`/api/menu-items/${entryId}`, {
      method: "PUT",
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to update menu item.");
    const updatedItem = await response.json();

    $("#successModal").modal("show"); // Show success modal
  } catch (error) {
    console.error("Error updating menu item:", error);
  }
}

// Update image preview when an image is selected
document
  .getElementById("image_src")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      document.getElementById("image_preview").src = e.target.result;
    };

    if (file) {
      reader.readAsDataURL(file);
      document.getElementById("image_preview").style.display = "block";
    }
  });

// Initial calls
checkLoginStatus();
loadEntry();
