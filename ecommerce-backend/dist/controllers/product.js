import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/products.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { myCache } from '../app.js';
import { invalidateCache } from '../utils/features.js';
// Revalidate on new , update, delete
export const getlatestProducts = TryCatch(async (req, res, next) => {
    let products;
    if (myCache.has("latest-products")) {
        products = JSON.parse(myCache.get("latest-products"));
    }
    else {
        products = await Product.find().sort({ createdAt: -1 }).limit(5);
        myCache.set("latest-product", JSON.stringify(products));
    }
    return res.status(200).json({
        Success: true,
        products,
    });
});
export const getAdminProducts = TryCatch(async (req, res, next) => {
    let products;
    if (myCache.has("all-products")) {
        products = JSON.parse(products = myCache.get("all-products"));
    }
    else {
        products = await Product.find();
        myCache.set("all-products", JSON.stringify(products));
    }
    return res.status(200).json({
        Success: true,
        products,
    });
});
export const getAllCategories = TryCatch(async (req, res, next) => {
    let categories;
    if (myCache.has("categories")) {
        categories = JSON.parse(myCache.get("categories"));
    }
    else {
        categories = await Product.distinct("category");
        myCache.set("categories", categories);
    }
    return res.status(200).json({
        Success: true,
        categories,
    });
});
export const getSingleProduct = TryCatch(async (req, res, next) => {
    let product;
    const id = req.params.id;
    if (myCache.has(`product-${id}`)) {
        product = JSON.parse(myCache.get(`product-${id}`));
    }
    else {
        product = await Product.findById(id);
        if (!product)
            return next(new ErrorHandler("Product Not found", 404));
        myCache.set(`product-${id}`, JSON.stringify(product));
    }
    return res.status(200).json({
        Success: true,
        product,
    });
});
export const newProduct = TryCatch(async (req, res, next) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    if (!photo)
        return next(new ErrorHandler("Please enter photo", 400));
    if (!name || !price || !stock || !category) {
        rm(photo.path, () => {
            console.log("Photo deleted as all fields are not filled");
        });
        return next(new ErrorHandler("Please Enter All Fields", 400));
    }
    await Product.create({
        name,
        price,
        stock,
        category: category.toLowerCase(),
        photo: photo.path,
    });
    await invalidateCache({ product: true, admin: true });
    return res.status(201).json({
        success: true,
        message: "Product Created Successfuly"
    });
});
export const updateProduct = TryCatch(async (req, res, next) => {
    const id = req.params.id;
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    const product = await Product.findById(id);
    if (!product)
        return next(new ErrorHandler("Invalid product Id", 404));
    if (photo) {
        rm(product.photo, () => {
            console.log("Old Photo deleted");
        });
        product.photo = photo.path;
    }
    if (name)
        product.name = name;
    if (price)
        product.price = price;
    if (stock)
        product.stock = stock;
    if (category)
        product.category = category;
    await product.save();
    await invalidateCache({ product: true, productId: String(product._id) });
    return res.status(200).json({
        success: true,
        message: "Product Updated Successfuly"
    });
});
export const deleteProduct = TryCatch(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    console.log(product);
    if (!product)
        return next(new ErrorHandler("Product not found", 404));
    rm(product.photo, () => console.log("Product photo deleted"));
    await product.deleteOne();
    await invalidateCache({ product: true, productId: String(product._id) });
    return res.status(200).json({
        Success: true,
        message: "Porduct deleted Successfuly",
    });
});
export const getAllProducts = TryCatch(async (req, res, next) => {
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page) || 1;
    //1,2,3,4,5,6,7,8
    // 9,10,11,12,13,14,15,16
    // 17,18,19,20,21,22,23,24
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;
    const baseQuery = {};
    if (search) {
        baseQuery.name = {
            $regex: search,
            $options: "i",
        };
    }
    if (price) {
        baseQuery.price = {
            $lte: Number(price)
        };
    }
    if (category) {
        baseQuery.category = category;
    }
    const [products, allProducts] = await Promise.all([
        Product.find(baseQuery).sort(sort ? { price: sort === "asc" ? 1 : -1 } : undefined)
            .limit(limit)
            .skip(skip),
        Product.find(baseQuery)
    ]);
    // const products = await Product.find(baseQuery).sort(sort? {price: sort === "asc" ? 1 : -1} :undefined).limit(limit).skip(skip);
    // we have to search again bcz previous search in products has applied a limit on it
    // const allProducts = Product.find(baseQuery);
    const totalPages = Math.ceil(allProducts.length / limit);
    // Math.floor  ---> 10.5 -> 10
    // Math.ciel  ---> 10.5 -> 11
    return res.status(200).json({
        Success: true,
        products,
        totalPages
    });
});
