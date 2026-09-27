export const errorHandler = (err, req, res, next) => {
  // Handle malformed JSON
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
  }

  // Log detailed error on the server
  console.error("Unhandled application error:", err);

  // Do not expose internal error details to the client
  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred",
  });
};