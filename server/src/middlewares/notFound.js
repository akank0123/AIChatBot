export default function notFound(req, res) {
  res.status(404).json({ detail: `Route not found: ${req.method} ${req.url}` });
}
