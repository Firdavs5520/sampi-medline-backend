import jwt from "jsonwebtoken";

/* ===================== */
/* AUTH */
/* ===================== */
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token mavjud emas" });
  }

  const token = header.slice(7); // "Bearer " dan keyin

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // req.user ni himoyalaymiz (tasodifan overwrite bo‘lmasin)
    req.user = Object.freeze({
      id: decoded.id,
      role: decoded.role,
    });

    next();
  } catch (e) {
    return res.status(401).json({ message: "Token yaroqsiz" });
  }
}

export const auth = authMiddleware;

/* ===================== */
/* ROLE */
/* ===================== */
export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Ruxsat yo‘q" });
    }
    next();
  };
}
