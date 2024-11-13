import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { username, password } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("hashed_password")
      .eq("username", username)
      .single();

    if (error || !data) return res.status(401).json({ error: "Invalid login" });

    const isMatch = await bcrypt.compare(password, data.hashed_password);
    if (isMatch) {
      // Set session or send a token (since Vercel doesn't persist sessions easily)
      res.status(200).json({ message: "Login successful" });
    } else {
      res.status(401).json({ error: "Invalid login" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
