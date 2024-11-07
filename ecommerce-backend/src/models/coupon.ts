import mongoose from "mongoose";

const schema = new mongoose.Schema({
    code:{
        required: [true,"Please enter the Coupon Code"],
        type: String,
        unique: true
    },
    amount:{
        required: [true,"Please enter the Discount Amount"],
        type: Number,
    },
});
export const Coupon = mongoose.model("Coupon", schema);