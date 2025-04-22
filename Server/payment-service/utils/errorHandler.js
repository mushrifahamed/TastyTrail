module.exports = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation error",
      details: err.message,
    });
  }

  if (err.isAxiosError) {
    return res.status(502).json({
      message: "Error communicating with dependent service",
      details: err.message,
    });
  }

  res.status(500).json({ message: "Something went wrong" });
};
