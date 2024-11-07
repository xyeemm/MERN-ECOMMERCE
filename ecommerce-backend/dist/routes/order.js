import express from "express";
import { allOrders, deleteOrder, getSingleOrder, myOrders, newOrder, processOrder } from "../controllers/order.js";
import { adminOnly } from "../middlewares/auth.js";
const app = express.Router();
// api/v1/order/new
app.post("/new", newOrder);
// api/v1/order/my
app.get("/my", myOrders);
// api/v1/order/all
app.get("/all", adminOnly, allOrders);
app.route("/:id").get(getSingleOrder)
    .put(processOrder, adminOnly)
    .delete(deleteOrder, adminOnly);
export default app;
