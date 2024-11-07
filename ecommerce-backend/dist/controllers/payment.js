import { Coupon } from './../models/coupon.js';
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from '../utils/utility-class.js';
// import { stripe } from '../app.js';
// export const createPaymentIntent = TryCatch(async (req, res, next)=>{
//     const {amount} = req.body;
//     if(!amount) return next(new ErrorHandler("Please enter amount",400))
//     const paymentIntent = await stripe.paymentIntents.create({
//         amount:Number(amount)*100, currency:"inr"
//     });
//     res.status(200).json({
//         sucess:true,
//         clientSerect:paymentIntent.client_secret
//     })
// });
export const newCoupon = TryCatch(async (req, res, next) => {
    const { coupon, amount } = req.body;
    if (!coupon || !amount)
        return next(new ErrorHandler("Please enter Coupon and Amount", 400));
    await Coupon.create({ code: coupon, amount });
    return res.status(201).json({
        success: true,
        message: `Coupon ${coupon} created Successfully`
    });
});
export const applyDiscount = TryCatch(async (req, res, next) => {
    const { coupon } = req.body;
    const discount = await Coupon.findOne({ code: coupon });
    if (!discount)
        return next(new ErrorHandler("InValid Coupon", 400));
    return res.status(201).json({
        success: true,
        discount: discount.amount
    });
});
export const allCoupons = TryCatch(async (req, res, next) => {
    const coupons = await Coupon.find();
    if (!coupons)
        return next(new ErrorHandler("No Coupons found", 400));
    return res.status(201).json({
        success: true,
        allCoupons: coupons
    });
});
export const deleteCoupon = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon)
        return next(new ErrorHandler("No Coupon found", 400));
    return res.status(201).json({
        success: true,
        message: `Coupon ${coupon.code} Deleted Successfully`
    });
});
