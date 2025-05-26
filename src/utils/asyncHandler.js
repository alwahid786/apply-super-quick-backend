const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    // console.log("Error in asyncHandler:", error);
    next(error);
  }
};

export { asyncHandler };
