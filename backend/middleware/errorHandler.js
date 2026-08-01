// centralized express error handler to prevent leaking stack traces to clients
const errorHandler = (err, req, res, next) => {
  console.error(`[server error] ${req.method} ${req.path}:`, err.stack || err.message || err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    error: err.message || 'internal server error',
  });
};

module.exports = errorHandler;
