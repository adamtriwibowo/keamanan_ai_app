const bcrypt    = require("bcrypt");
const jwt       = require("jsonwebtoken");
const AdminModel = require("../models/authModel");

const JWT_SECRET  = process.env.JWT_SECRET || "securewatch-secret-2024";
const JWT_EXPIRES = "8h";

// Buat akun admin default jika belum ada
const seedAdmin = async () => {
  const exists = await AdminModel.findOne({ email: "admin@securewatch.id" });
  if (exists) return;
  const hashed = await bcrypt.hash("SecureWatch@2024", 10);
  await AdminModel.create({
    name:     "Administrator",
    email:    "admin@securewatch.id",
    password: hashed,
  });
  console.log("[Auth] Admin default dibuat: admin@securewatch.id / SecureWatch@2024");
};

const login = async (email, password) => {
  const admin = await AdminModel.findOne({ email: email.toLowerCase() });
  if (!admin) throw new Error("Email atau password salah");

  const match = await bcrypt.compare(password, admin.password);
  if (!match) throw new Error("Email atau password salah");

  admin.lastLogin = new Date();
  await admin.save();

  const token = jwt.sign(
    { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  return {
    token,
    user: { name: admin.name, email: admin.email, role: admin.role },
  };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

// Middleware Express — cek token dari Authorization header
const requireAuth = (req, res, next) => {
  const auth  = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Tidak terautentikasi" });
  const payload = verifyToken(token);
  if (!payload)  return res.status(401).json({ error: "Token tidak valid atau kadaluarsa" });
  req.user = payload;
  next();
};

module.exports = { seedAdmin, login, verifyToken, requireAuth };
