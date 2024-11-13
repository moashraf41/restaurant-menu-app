export default function handler(req, res) {
  // If you're not using traditional sessions, handle login check based on tokens
  res.status(401).json({ error: "Not logged in" });
}
