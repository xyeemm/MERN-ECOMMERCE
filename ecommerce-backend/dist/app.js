import express from "express";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";
// importing Routes
import userRoute from "./routes/user.js";
import productRoute from "./routes/products.js";
import orderRoute from "./routes/order.js";
import paymentRoute from "./routes/payment.js";
import dashboardStats from "./routes/stats.js";
// import Stripe from "stripe";
config({ path: "./.env" });
const app = express();
const port = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URI || "";
// const stripeKey = process.env.STRIPE_KEY || "";
connectDB(mongoURI);
// export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache();
app.use(express.json());
app.use(morgan("dev"));
app.get("/", (req, res) => { res.send("API Working with /api/v1"); });
// using Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardStats);
app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);
app.listen(port, () => {
    console.log(`server is running at ${port}`);
});
