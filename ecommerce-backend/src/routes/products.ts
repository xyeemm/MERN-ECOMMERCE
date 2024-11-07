
import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { getAdminProducts, getAllCategories, getlatestProducts, newProduct, getSingleProduct, updateProduct, deleteProduct, getAllProducts } from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

// /api/v1/product/new
app.post("/new", adminOnly, singleUpload, newProduct);
// /api/v1/product/latest

app.get("/latest", getlatestProducts);

// /api/v1/product/all --> to get all products with filters
app.get("/all", getAllProducts);

// /api/v1/product/categories
app.get("/categories", getAllCategories);
// /api/v1/product/admin-products/adminId
app.get("/admin-products", adminOnly, getAdminProducts);
// api/v1/product/adminId
app.route("/:id")
.get(getSingleProduct)
.put(adminOnly, singleUpload, updateProduct)
.delete(adminOnly,deleteProduct);


 export default app;