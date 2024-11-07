import { Link } from "react-router-dom";
import ProductCard from "../components/product-card";

const Home = () => {
  const addToCartHandler = ()=>{}

  return (
    <div className="home">
      <section></section>

        <h1> Lastest Products
          <Link to="/search" className="findmore">
            More
          </Link>
        </h1>

      <main>

        <ProductCard
        productId = "asdf"
        name="Macbook"
        price={456}
        stock={234}
        handler={addToCartHandler}
        photo="https://m.media-amazon.com/images/I/51KhexN7YkL._AC_SX679_.jpg"
        />
      </main>
    </div>
  );
};

export default Home