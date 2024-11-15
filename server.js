// server.js
const mime = require("mime-types"); // Add this at the top of server.js if not already included
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const session = require("express-session");
require("dotenv").config(); // Load environment variables from .env file

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Supabase setup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  },
});

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "menu_sites")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvaXZta3VxYXVseXd3anZ1dWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzNDYwNjksImV4cCI6MjA0NjkyMjA2OX0.M3pKhR3iQOoJZTG9yKmMZWoiBZi0pMP7OQGDRrtjJqA", // Replace with your own secret
    resave: false,
    saveUninitialized: true,
  })
);

// Serve static pages
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/menu", (req, res) => {
  res.sendFile(path.join(__dirname, "menu_sites", "index.html"));
});

app.get("/index.html", (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  } else {
    res.redirect("/login.html");
  }
});

app.get("/add.html", (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, "public", "add.html"));
  } else {
    res.redirect("/login.html");
  }
});

app.get("/edit.html", (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, "public", "edit.html"));
  } else {
    res.redirect("/login.html");
  }
});

// Root route handler
app.get("/", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/index.html");
  } else {
    res.redirect("/login.html");
  }
});

// Handle login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const { data, error } = await supabase
    .from("users")
    .select("hashed_password")
    .eq("username", username)
    .single();

  if (error || !data) return res.status(401).json({ error: "Invalid login" });

  const isMatch = await bcrypt.compare(password, data.hashed_password);
  if (isMatch) {
    req.session.loggedIn = true;
    res.redirect("/index.html");
  } else {
    res.status(401).json({ error: "Invalid login" });
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login.html");
});

app.get("/check-login", (req, res) => {
  if (req.session.loggedIn) {
    res.status(200).send("Logged in");
  } else {
    res.status(401).send("Not logged in");
  }
});

// Get all menu items
app.get("/api/menu-items", async (req, res) => {
  try {
    const { data, error } = await supabase.from("menu_items").select("*");
    if (error) {
      console.error("Error retrieving menu items:", error);
      return res.status(500).json({ error: "Failed to retrieve menu items" });
    }
    res.json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// Get a specific menu item by ID
app.get("/api/menu-items/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      console.error("Error retrieving menu item:", error);
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// Update a menu item with image upload
app.put("/api/menu-items/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { dish_name, category, description, price, availability } = req.body;
  let image_src = null;

  // Convert availability to boolean if necessary
  const availabilityBoolean =
    availability === "available" || availability === "true";

  // Code for uploading image to Supabase (if provided)...

  const updateData = {
    dish_name,
    category,
    description,
    price: parseFloat(price),
    availability: availabilityBoolean,
  };
  if (image_src) updateData.image_src = image_src;

  try {
    // Add the updated code here to log any errors with Supabase update
    const { data: updatedItem, error } = await supabase
      .from("menu_items")
      .update(updateData)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase update error:", error, "ID:", id);
      return res
        .status(404)
        .json({ error: "Menu item not found or update failed" });
    }

    io.emit("menu-item-updated", updatedItem);
    res.json(updatedItem);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// Add a new menu item with image upload
app.post("/api/menu-items", upload.single("image"), async (req, res) => {
  try {
    const { dish_name, category, description, price, availability } = req.body;
    let image_src = null;

    // Convert availability to boolean
    const availabilityBoolean =
      availability === "available" || availability === "true";

    // Check if file was uploaded
    if (req.file) {
      const sanitizedFileName = req.file.originalname
        .replace(/\s+/g, "_")
        .replace(/[^\w.-]/g, "");
      const fileName = `images/${Date.now()}_${sanitizedFileName}`;
      const fileBuffer = req.file.buffer;
      const contentType = req.file.mimetype || "application/octet-stream";

      const { data: imageData, error: imageError } = await supabase.storage
        .from("uploads")
        .upload(fileName, fileBuffer, {
          contentType: contentType,
          upsert: false,
        });

      if (imageError) {
        console.error("Error uploading image to Supabase:", imageError);
        return res.status(500).json({ error: "Failed to upload image" });
      } else {
        console.log("Image uploaded successfully:", imageData);
      }

      image_src = imageData.path;
    }

    // Insert the new menu item into the database
    const { data: newItem, error: insertError } = await supabase
      .from("menu_items")
      .insert([
        {
          dish_name,
          category,
          description,
          price: parseFloat(price),
          availability: availabilityBoolean,
          image_src,
        },
      ])
      .single();

    if (insertError) {
      console.error("Error inserting menu item into database:", insertError);
      return res.status(500).json({ error: "Failed to add menu item" });
    }

    io.emit("menu-item-added", newItem);
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// Update a menu item with image upload
app.put("/api/menu-items/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { dish_name, category, description, price, availability } = req.body;
  let image_src = null;

  // Convert availability to boolean if necessary
  const availabilityBoolean =
    availability === "available" || availability === "true";

  // Upload the image to Supabase storage if a new image is provided
  if (req.file) {
    const sanitizedFileName = req.file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^\w.-]/g, "");
    const fileName = `images/${Date.now()}_${sanitizedFileName}`;
    const fileBuffer = req.file.buffer;
    const contentType = req.file.mimetype || "application/octet-stream";

    const { data: imageData, error: imageError } = await supabase.storage
      .from("uploads")
      .upload(fileName, fileBuffer, {
        contentType: contentType,
        upsert: false,
      });

    if (imageError) {
      console.error("Error uploading image to Supabase:", imageError);
      return res.status(500).json({ error: "Failed to upload image" });
    }
    image_src = imageData.path;
  }

  const updateData = {
    dish_name,
    category,
    description,
    price: parseFloat(price),
    availability: availabilityBoolean,
  };
  if (image_src) updateData.image_src = image_src;

  try {
    const { data: updatedItem, error } = await supabase
      .from("menu_items")
      .update(updateData)
      .eq("id", id)
      .single();

    if (error || !updatedItem) {
      console.error("Error updating menu item:", error);
      return res
        .status(404)
        .json({ error: "Menu item not found or update failed" });
    }

    io.emit("menu-item-updated", updatedItem);
    res.json(updatedItem);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// Delete a menu item
app.delete("/api/menu-items/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // First, get the menu item to retrieve the image path
    const { data: menuItem, error: fetchError } = await supabase
      .from("menu_items")
      .select("image_src")
      .eq("id", id)
      .single();

    if (fetchError || !menuItem) {
      console.error("Error fetching menu item:", fetchError);
      return res.status(404).json({ error: "Menu item not found" });
    }

    const imagePath = menuItem.image_src;

    // Delete the image from Supabase storage
    if (imagePath) {
      const { error: deleteImageError } = await supabase.storage
        .from("uploads")
        .remove([imagePath]);

      if (deleteImageError) {
        console.error("Error deleting image from Supabase:", deleteImageError);
        // Continue even if image deletion fails
      }
    }

    // Delete the menu item
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) {
      console.error("Error deleting menu item:", error);
      return res.status(500).json({ error: "Failed to delete menu item" });
    }

    io.emit("menu-item-deleted", id);
    res.json({ message: "Menu item deleted successfully" });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// Serve images from Supabase Storage
app.get("/api/image", async (req, res) => {
  const path = req.query.path;
  console.log("Requested image path:", path);
  try {
    const { data, error } = await supabase.storage
      .from("uploads")
      .download(path);

    if (error) {
      console.error("Error downloading image from Supabase:", error);
      return res.status(500).send("Failed to retrieve image");
    }

    // Get the content type based on the file extension
    const contentType = mime.lookup(path) || "application/octet-stream";

    // Set appropriate headers
    res.set("Content-Type", contentType);
    res.send(Buffer.from(await data.arrayBuffer()));
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).send("An unexpected error occurred.");
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
