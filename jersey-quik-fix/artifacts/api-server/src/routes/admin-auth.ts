import { Router } from "express";
import { createAdminToken } from "../lib/adminToken";

const adminAuthRouter = Router();

adminAuthRouter.post("/admin/login", (req, res): void => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(503).json({ error: "Admin authentication is not configured on this server" });
    return;
  }
  const { password } = req.body as { password?: string };
  if (!password || password !== adminPassword) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = createAdminToken();
  res.json({ token });
});

export default adminAuthRouter;
