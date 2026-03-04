module.exports = function requireContributor(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    if (req.user.role !== "contributor") {
      return res.status(403).json({ error: "Contributor access only" });
    }

    next();
  } catch (err) {
    return res.status(403).json({ error: "Contributor access only" });
  }
};