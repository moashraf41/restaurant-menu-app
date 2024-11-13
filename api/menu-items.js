import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method === "GET") {
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
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
