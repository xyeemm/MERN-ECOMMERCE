import { adminOnly } from './../middlewares/auth.js';
import express  from "express";
import { allCoupons, applyDiscount, deleteCoupon, newCoupon } from "../controllers/payment.js";
const app = express.Router();

// app.post("/create", createPaymentIntent)

//Route /api/v1/payment/discount
app.get("/discount", applyDiscount);

//Route /api/v1/payment/coupon/new
app.post("/coupon/new", adminOnly, newCoupon);

//Route /api/v1/payment/all-coupon
app.get("/coupons/all", adminOnly, allCoupons);
//Route /api/v1/payment/delete/

app.delete("/coupon/:id", adminOnly, deleteCoupon);

export default app;