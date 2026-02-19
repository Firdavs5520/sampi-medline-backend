import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ===================== */
/* AUTH */
/* ===================== */
export async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token mavjud emas" });
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 USERNI DB DAN OLAMIZ
    const user = await User.findById(decoded.id).lean();

    if (!user) {
      return res.status(401).json({ message: "User topilmadi" });
    }

    req.user = Object.freeze({
      id: user._id.toString(),
      role: user.role,
    });

    next();
  } catch (e) {
    return res.status(401).json({ message: "Token yaroqsiz" });
  }
}

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
