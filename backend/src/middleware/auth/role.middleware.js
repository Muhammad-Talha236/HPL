export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // User must already be authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Make sure the user's role exists
    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: "User role is not assigned",
      });
    }

    // Check whether the user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};