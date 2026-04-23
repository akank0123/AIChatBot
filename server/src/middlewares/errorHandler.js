// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.url} → ${status}: ${message}`);

  res.status(status).json({ detail: message });
}
