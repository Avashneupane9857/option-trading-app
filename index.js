import express from "express";
import dotenv from "dotenv";
import { routers } from "./routes.js";
dotenv.config({});
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    msg: "Healthy server",
  });
});
app.use("/api/v1", routers);
app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
export default app;
