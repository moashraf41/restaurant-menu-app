import { createClient } from "@supabase/supabase-js";
import mime from "mime-types";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const path = req.query.path;
  try {
    const { data, error } = await supabase.storage
      .from("uploads")
      .download(path);

    if (error) {
      console.error("Error downloading image from Supabase:", error);
      return res.status(500).send("Failed to retrieve image");
    }

    const contentType = mime.lookup(path) || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.send(Buffer.from(await data.arrayBuffer()));
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).send("An unexpected error occurred.");
  }
}
