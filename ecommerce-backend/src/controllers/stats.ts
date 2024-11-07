
import { MyDocument } from "../utils/features.js";
import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/products.js";
import { User } from "../models/user.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/features.js";


export const getDashboardStats = TryCatch(async (req, res, next)=>{
    let stats;
    if (myCache.has("admin-stats")) stats = JSON.parse(myCache.get("admin-stats")as string)
        else {
        const today = new Date;
        const sixMonthAgo = new Date;
        sixMonthAgo.setMonth(sixMonthAgo.getMonth() -6)

        const thisMonth = {
            start: new Date(today.getFullYear(),today.getMonth(), 1),
            end: today
        };
        const lastMonth = {
            start: new Date(today.getFullYear(),today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(),today.getMonth(), 0),
        };

        const thisMonthProductsPromise = Product.find({
            createdAt:{
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        });
        const lastMonthProductsPromise = Product.find({
            createdAt:{
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        });
        
        const thisMonthUserPromise = User.find({
            createdAt:{
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        });
        const lastMonthUserPromise = User.find({
            createdAt:{
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        });

        const thisMonthOrderPromise = Order.find({
            createdAt:{
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        });
        const lastMonthOrderPromise = Order.find({
            createdAt:{
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        });

        const lastSixMonthOrdersPromise = Order.find({
            createdAt:{
                $gte: sixMonthAgo,
                $lte: today
            }
        });

        const latestTransectionPromise =Order.find({}).select(["orderItems","discount","total","status"]).limit(4);

        const [thisMonthProducts,
            thisMonthUsers,
            thisMonthOrders,
            lastMonthProducts,
            lastMonthUsers,
            lastMonthOrders,
            productsCount,
            userCount,
            allOrders,
            lastSixMonthOrders,
            categories,
            femaleUserCount,
            latestTransection
        ] 
             = await Promise.all([
            thisMonthProductsPromise,
            thisMonthUserPromise,
            thisMonthOrderPromise,
            lastMonthProductsPromise,
            lastMonthUserPromise,
            lastMonthOrderPromise,
            Product.countDocuments(),
            User.countDocuments(),
            Order.find({}).select("total"),
            lastSixMonthOrdersPromise,
            Product.distinct("category"),
            User.countDocuments({gender:"female"}),
            latestTransectionPromise

            ])
            

            const thisMonthRevenue = thisMonthOrders.reduce(
                (total, order) => total + (order.total || 0),0
            );
            const lastMonthRevenue = lastMonthOrders.reduce(
                (total, order) => total + (order.total || 0),0
            );

            const changePercent = {
                revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
                product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
                user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
                order: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length)
            }
             
            const revenue =  allOrders.reduce(
                (total, order) => total + (order.total || 0),0
            );

            
            const count ={
                revenue,
                product: productsCount,
                user: userCount,
                order: allOrders.length
            }

            const orderMonthCounts = new Array(6).fill(0);
            const orderMonthRevenue = new Array(6).fill(0);

            lastSixMonthOrders.forEach((order)=> {
                const creationDate = order.createdAt;
                const monthDiff = (today.getMonth() - creationDate.getMonth() +12)%12 ;

                if(monthDiff <6){
                    orderMonthCounts[6 - monthDiff -1] +=1
                    orderMonthRevenue[6 - monthDiff -1] +=1
                }
            });

            

            const categoryCount = await getInventories({
                categories,
                productsCount,
            });

            const userRatio ={
                male:userCount - femaleUserCount,
                female: femaleUserCount
            }

            const modifiedLatestTransection = latestTransection.map( (i) => {({
                _id: i._id,
                discount: i.discount,
                amount: i.total,
                quantity: i.orderItems.length,
                status:i.status

            })});
            
            stats = {
                categoryCount,
                changePercent,
                count,
                chart:{
                    order: orderMonthCounts,
                    revenue: orderMonthRevenue
                },
                userRatio,
                latestTransection : modifiedLatestTransection,
            };
            myCache.set("admin-stats",JSON.stringify(stats));
    }

    return res.status(200).json({
        success: true,
        stats
    }
)
});

export const getPieCharts = TryCatch(async (req, res, next)=>{
    let charts;
    const key = "admin-pie-charts";
    if(myCache.has(key)){
        charts = JSON.parse(myCache.get(key) as string);
    }else{

        const allOrderPromise = Order.find({}).select(["total","discount","subtotal","tax","shippingCharges"])
       const[processingOrder,
        ShippedOrder,
        deliveredOrder,
        categories,
        productsCount,
        productOutOfStock,
        allOrders,allUsers,
        adminUsers,
        customerUser] = await Promise.all([
        Order.countDocuments({status:"Processing"}),
        Order.countDocuments({status:"Shipped"}),
        Order.countDocuments({status:"Delivered"}),
        Product.distinct("category"),
        Product.countDocuments(),
        Product.countDocuments({stock:0}),
        allOrderPromise,
        User.find().select("dob"),
        User.countDocuments({role:"admin"}),
        User.countDocuments({role:"user"}),
       ])

       const orderFulfilment = {
        processing: processingOrder,
        shipped: ShippedOrder,
        delivered: deliveredOrder
    }

    const productCategories = await getInventories({
                categories,
                productsCount,
            });

            const stockAvailability = {
                inStock: productsCount - productOutOfStock,
                outOfStock:productOutOfStock
            }

            const grossIncome = allOrders.reduce((prev, order)=> prev + (order.total || 0), 0);
            const discount = allOrders.reduce((prev, order)=> prev + (order.discount || 0), 0);
            const productionCost = allOrders.reduce((prev, order)=> prev + (order.shippingCharges || 0), 0);
            const burnt = allOrders.reduce((prev, order)=> prev + (order.tax || 0), 0);
            const marketingCost = Math.round(grossIncome * (30/100));

            const netMargin = grossIncome - discount- productionCost- burnt- marketingCost;

            const revenueDistribution ={
                netMargin,
                discount,
                productionCost,
                burnt,
                marketingCost
            }

            const userAgeGroup ={
                teen: allUsers.filter( (i)=> i.age < 20).length,
                adult: allUsers.filter( (i)=> i.age >= 20 && i.age < 40).length,
                old: allUsers.filter( (i)=> i.age >= 40).length,
            }

            const adminCustomer = {
                admin: adminUsers,
                customer: customerUser
            }

     charts ={
        orderFulfilment,
        productCategories,
        stockAvailability,
        revenueDistribution,
        adminCustomer,
        userAgeGroup
    };
    myCache.set(key, JSON.stringify(charts));

    }
    
    return res.status(200).json({
        success: true,
        charts,
    });
});

export const getBarCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-bar-charts";
  
    if (myCache.has(key)) charts = JSON.parse(myCache.get(key)as string);
    else {
      const today = new Date();
  
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  
      const sixMonthProductPromise = Product.find({
        createdAt: {
          $gte: sixMonthsAgo,
          $lte: today,
        },
      }).select("createdAt") as Promise<MyDocument[]>;
  
      const sixMonthUsersPromise = User.find({
        createdAt: {
          $gte: sixMonthsAgo,
          $lte: today,
        },
      }).select("createdAt") as Promise<MyDocument[]>;
  
      const twelveMonthOrdersPromise = Order.find({
        createdAt: {
          $gte: twelveMonthsAgo,
          $lte: today,
        },
      }).select("createdAt") as Promise<MyDocument[]>;
  
      const [products, users, orders] = await Promise.all([
        sixMonthProductPromise,
        sixMonthUsersPromise,
        twelveMonthOrdersPromise,
      ]);
  
      const productCounts = getChartData({ length: 6, today, docArr: products });
      const usersCounts = getChartData({ length: 6, today, docArr: users });
      const ordersCounts = getChartData({ length: 12, today, docArr: orders });
  
      charts = {
        users: usersCounts,
        products: productCounts,
        orders: ordersCounts,
      };
  
      myCache.set(key, JSON.stringify(charts));
    }
  
    return res.status(200).json({
      success: true,
      charts,
    });
  });

  export const getLineCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-line-charts";
  
    if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
    else {
      const today = new Date();
  
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  
      const baseQuery = {
        createdAt: {
          $gte: twelveMonthsAgo,
          $lte: today,
        },
      };
  
      const [products, users, orders] = await Promise.all([
        Product.find(baseQuery).select("createdAt") as Promise<MyDocument[]>,
        User.find(baseQuery).select("createdAt") as Promise<MyDocument[]>,
        Order.find(baseQuery).select(["createdAt", "discount", "total"]) as Promise<MyDocument[]>,
      ]);
  
      const productCounts = getChartData({ length: 12, today, docArr: products });
      const usersCounts = getChartData({ length: 12, today, docArr: users });
      const discount = getChartData({
        length: 12,
        today,
        docArr: orders,
        property: "discount",
      });
      const revenue = getChartData({
        length: 12,
        today,
        docArr: orders,
        property: "total",
      });
  
      charts = {
        users: usersCounts,
        products: productCounts,
        discount,
        revenue,
      };
  
      myCache.set(key, JSON.stringify(charts));
    }
  
    return res.status(200).json({
      success: true,
      charts,
    });
  });