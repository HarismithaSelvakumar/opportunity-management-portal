module.exports = function requireAdmin(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access only" });
    }
    next();
  } catch (err) {
    return res.status(403).json({ error: "Admin access only" });
  }
};
