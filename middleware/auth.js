import jwt from "jsonwebtoken";

/* ================================================= */
/* AUTH MIDDLEWARE (TOKEN CHECK) */
/* ================================================= */
export function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token mavjud emas",
      });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Token yaroqsiz yoki eskirgan",
    });
  }
}

/* 🔁 QISQA NOM (new style) */
export const auth = authMiddleware;

/* ================================================= */
/* ROLE GUARD */
/* ================================================= */
export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Avtorizatsiya talab qilinadi",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bu amal uchun ruxsat yo‘q",
      });
    }

    next();
  };
}
