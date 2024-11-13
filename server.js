// server.js

const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
require("dotenv").config(); // Load environment variables from .env file

const app = express();

// Supabase setup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "menu_sites")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static pages
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/menu", (req, res) => {
  res.sendFile(path.join(__dirname, "menu_sites", "index.html"));
});

// Middleware to validate JWT token and authenticate users
const authenticateJWT = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer token

  if (!token) {
    return res.status(401).send("Access Denied");
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send("Invalid Token");
    }
    req.user = user;
    next();
  });
};

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const { data, error } = await supabase
    .from("users")
    .select("id, username, hashed_password")
    .eq("username", username)
    .single();

  if (error || !data) return res.status(401).json({ error: "Invalid login" });

  const isMatch = await bcrypt.compare(password, data.hashed_password);
  if (isMatch) {
    // Create JWT token and send it to the user
    const token = jwt.sign(
      { userId: data.id, username: data.username },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid login" });
  }
});

// Logout route (client-side can just delete the token)
app.post("/logout", (req, res) => {
  // No server-side session to destroy (since we use JWT)
  res.status(200).send("Logged out");
});

// Get all menu items
app.get("/api/menu-items", authenticateJWT, async (req, res) => {
  try {
    const { data, error } = await supabase.from("menu_items").select("*");
    if (error) {
      return res.status(500).json({ error: "Failed to retrieve menu items" });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// Add a new menu item with image upload
app.post(
  "/api/menu-items",
  authenticateJWT,
  upload.single("image"),
  async (req, res) => {
    try {
      const { dish_name, category, description, price, availability } =
        req.body;
      let image_src = null;

      // Convert availability to boolean
      const availabilityBoolean =
        availability === "available" || availability === "true";

      // Handle image upload to Supabase storage
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
          return res.status(500).json({ error: "Failed to upload image" });
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
        return res.status(500).json({ error: "Failed to add menu item" });
      }

      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: "An unexpected error occurred." });
    }
  }
);

// Update a menu item
app.put(
  "/api/menu-items/:id",
  authenticateJWT,
  upload.single("image"),
  async (req, res) => {
    const { id } = req.params;
    const { dish_name, category, description, price, availability } = req.body;
    let image_src = null;

    // Convert availability to boolean
    const availabilityBoolean =
      availability === "available" || availability === "true";

    // Handle image upload to Supabase storage
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
        return res.status(500).json({ error: "Failed to upload image" });
      }
      image_src = imageData.path;
    }

    // Update the menu item
    const updateData = {
      dish_name,
      category,
      description,
      price: parseFloat(price),
      availability: availabilityBoolean,
    };
    if (image_src) updateData.image_src = image_src;

    const { data: updatedItem, error } = await supabase
      .from("menu_items")
      .update(updateData)
      .eq("id", id)
      .single();

    if (error || !updatedItem) {
      return res.status(500).json({ error: "Failed to update menu item" });
    }

    res.json(updatedItem);
  }
);

// Delete a menu item
app.delete("/api/menu-items/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.status(200).json({ message: "Menu item deleted" });
  } catch (err) {
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
