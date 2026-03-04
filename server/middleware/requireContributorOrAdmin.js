module.exports = function requireContributorOrAdmin(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    if (!["contributor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Contributor or admin access only" });
    }

    next();
  } catch (err) {
    return res.status(403).json({ error: "Contributor or admin access only" });
  }
};
