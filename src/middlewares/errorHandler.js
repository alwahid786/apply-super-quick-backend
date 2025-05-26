const errorHandler = (err, req, res, next) => {
  // console.log("Error in errorHandler:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    message,
  });
};

export { errorHandler };
