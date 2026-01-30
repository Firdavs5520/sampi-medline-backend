import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: "Token yo‘q" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 MUHIM QATOR
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (e) {
    return res.status(401).json({ message: "Token noto‘g‘ri" });
  }
}
