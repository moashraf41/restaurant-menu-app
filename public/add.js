// Attach event listener to the form submit event
document.getElementById("menuItemForm").addEventListener("submit", (e) => {
  e.preventDefault();
  addMenuItem();
});

async function addMenuItem() {
  if (!validateForm()) return;

  const form = document.getElementById("menuItemForm");
  const formData = new FormData(form);

  try {
    const response = await fetch("/api/menu-items", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add menu item.");
    }

    const result = await response.json();
    // Display success message and redirect
    displayModal("Menu item added successfully!");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  } catch (error) {
    console.error("Error adding menu item:", error);
    displayModal(error.message || "Failed to add menu item.");
  }
}

// Form validation function with inline error messages
function validateForm() {
  let isValid = true;

  // Clear previous error messages
  document
    .querySelectorAll(".error-message")
    .forEach((el) => (el.textContent = ""));

  // Dish Name validation
  const dishName = document.getElementById("dish_name").value;
  if (!/^[A-Za-z\s\u0600-\u06FF]+$/.test(dishName)) {
    document.getElementById("dish_name_error").textContent =
      "Dish name must contain only alphabetic characters (English or Arabic) and spaces.";
    isValid = false;
  }

  // Category validation
  const category = document.getElementById("category").value;
  if (!category) {
    document.getElementById("category_error").textContent =
      "Please select a category.";
    isValid = false;
  }

  // Description validation
  const description = document.getElementById("description").value;
  if (!description.trim()) {
    document.getElementById("description_error").textContent =
      "Description cannot be empty.";
    isValid = false;
  } else if (description.length > 200) {
    document.getElementById("description_error").textContent =
      "Description cannot exceed 200 characters.";
    isValid = false;
  }

  // Price validation
  const price = document.getElementById("price").value;
  if (price <= 0 || isNaN(price)) {
    document.getElementById("price_error").textContent =
      "Price must be a positive number.";
    isValid = false;
  }

  // Image file validation
  const imageFile = document.getElementById("image").files[0];
  if (!imageFile) {
    document.getElementById("image_error").textContent =
      "Please upload an image file.";
    isValid = false;
  } else if (
    !["image/jpeg", "image/png", "image/gif"].includes(imageFile.type)
  ) {
    document.getElementById("image_error").textContent =
      "Only JPG, PNG, and GIF images are allowed.";
    isValid = false;
  }

  return isValid;
}

// Display modal with a message
function displayModal(message) {
  document.getElementById("modalMessage").textContent = message;
  $("#responseModal").modal("show");
}
