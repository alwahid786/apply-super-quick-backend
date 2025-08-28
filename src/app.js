import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorHandler.js";
import AuthRoutes from "./modules/auth/routes/auth.route.js";
import BrandingRoutes from "./modules/branding/routes/branding.route.js";
import FormRoutes from "./modules/form/routes/form.route.js";
import IdMissionRoutes from "./modules/idMission/routes/idMission.route.js";
import { markEmailVerified } from "./modules/idMission/utils/verification.js";
import RoleRoutes from "./modules/role/routes/role.route.js";
import UserRoutes from "./modules/user/routes/user.route.js";
import fs from "fs";
import csv from "csv-parser";

const app = express();

// middlewares
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:5173", "http://localhost:5174", "https://apply-super-quick.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// code to convert csv to js in public
// ===================================
// let naicsToMcc = [];
// fs.createReadStream("public/NAICStoMCC.csv")
//   .pipe(csv())
//   .on("data", (row) => {
//     naicsToMcc.push(row);
//   })
//   .on("end", () => {
//     console.log("CSV loaded:", naicsToMcc.length, "rows");
//     // add this array in new file DataTa.js like when i open this i see an array of data
//     fs.writeFileSync("public/NAICStoMCC.js", `export default ${JSON.stringify(naicsToMcc)}`);
//   });

// routes
app.get("/", (req, res) => res.status(200).json({ success: true, message: "Hello World!" }));
app.get("/email-verify", async (req, res) => {
  const { token, email, sessionId } = req.query;
  await markEmailVerified(sessionId, email, token);
  console.log(`Redirecting to /verification-success?type=email&sessionId=${sessionId}`);
  // res.redirect(`/verification-success?type=email&sessionId=${sessionId}`);
  return res.status(200).json({ success: true, message: "Email verified successfully" });
});
app.use("/api/auth", AuthRoutes);
app.use("/api/role", RoleRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/form", FormRoutes);
app.use("/api/id-mission", IdMissionRoutes);
app.use("/api/branding", BrandingRoutes);

// error handler
app.use(errorHandler);

export default app;
