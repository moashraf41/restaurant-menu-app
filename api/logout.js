export default function handler(req, res) {
  // Vercel doesn't use traditional sessions, so handle logout by clearing the session client-side
  res.status(200).json({ message: "Logged out" });
}
