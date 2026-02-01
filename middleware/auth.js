import jwt from "jsonwebtoken";

/**
 * 1️⃣ TOKEN TEKSHIRADI
 * 2️⃣ req.user GA id VA role NI QO‘YADI
 */
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token mavjud emas",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token yaroqsiz yoki eskirgan",
    });
  }
};

/**
 * 3️⃣ ROLE TEKSHIRADI (delivery / manager / nurse)
 */
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bu amal uchun ruxsat yo‘q",
      });
    }
    next();
  };
};
