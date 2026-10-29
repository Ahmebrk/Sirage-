import { useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDZD, useCart } from "@/lib/cart";
import { ProductRail } from "@/components/store";

export default function ProductPage() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug || "";
  const { data: product, isLoading } = trpc.catalog.bySlug.useQuery({ slug });
  const { data: related = [] } = trpc.catalog.list.useQuery({
    sort: "featured",
  });
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  if (isLoading)
    return <div className="container page-loading">جارٍ تحميل المنتج...</div>;
  if (!product)
    return (
      <div className="container page-loading">
        <h2>المنتج غير موجود</h2>
        <Link href="/catalog" className="text-link">
          العودة للمنتجات <ArrowLeft size={17} />
        </Link>
      </div>
    );
  const otherProducts = related
    .filter(item => item.slug !== product.slug)
    .slice(0, 4);
  return (
    <>
      <div className="product-detail container">
        <div className="breadcrumb">
          <Link href="/catalog">المنتجات</Link>
          <ChevronLeft size={14} />
          <span>{product.category}</span>
          <ChevronLeft size={14} />
          <strong>{product.nameAr}</strong>
        </div>
        <div className="product-detail-grid">
          <div className="product-gallery">
            <div className="gallery-main">
              <img src={product.images[activeImage]} alt={product.nameAr} />
              <span className="gallery-count">
                {String(activeImage + 1).padStart(2, "0")} /{" "}
                {String(product.images.length).padStart(2, "0")}
              </span>
              <button
                className="gallery-arrow gallery-arrow-next"
                onClick={() =>
                  setActiveImage((activeImage + 1) % product.images.length)
                }
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="gallery-arrow gallery-arrow-prev"
                onClick={() =>
                  setActiveImage(
                    (activeImage - 1 + product.images.length) %
                      product.images.length
                  )
                }
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="gallery-thumbs">
              {product.images.map((image, index) => (
                <button
                  className={activeImage === index ? "active" : ""}
                  key={image}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={image} alt={`${product.nameAr} ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="product-detail-copy">
            <div className="product-detail-kicker">
              <span className="eyebrow">
                {product.category} / {product.subcategory}
              </span>
              <button className="icon-button">
                <Heart size={19} />
              </button>
            </div>
            <h1>{product.nameAr}</h1>
            <p className="product-en-name">{product.nameEn}</p>
            <div className="detail-price">
              <strong>{formatDZD(product.price)}</strong>
              {product.compareAt && <del>{formatDZD(product.compareAt)}</del>}
              <span>شامل الضريبة</span>
            </div>
            <p className="detail-description">{product.description}</p>
            <div className="stock-status">
              <span className="stock-dot" /> متوفر الآن · {product.stock} قطع
              متبقية
            </div>
            <div className="detail-actions">
              <div className="qty-control qty-control-large">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus size={15} />
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                >
                  <Plus size={15} />
                </button>
              </div>
              <button
                className={`button button-orange detail-add ${added ? "is-added" : ""}`}
                onClick={() => {
                  addItem({
                    slug: product.slug,
                    nameAr: product.nameAr,
                    price: product.price,
                    quantity,
                    image: product.images[0],
                    stock: product.stock,
                  });
                  setAdded(true);
                  setTimeout(() => setAdded(false), 1500);
                }}
              >
                {added ? (
                  <>
                    <Check size={18} /> تمت الإضافة
                  </>
                ) : (
                  <>
                    أضف إلى السلة <ArrowLeft size={18} />
                  </>
                )}
              </button>
            </div>
            <div className="detail-perks">
              <div>
                <Truck size={21} />
                <span>
                  <strong>توصيل إلى ولايتك</strong>
                  <small>من 600 دج · حسب الولاية</small>
                </span>
              </div>
              <div>
                <ShieldCheck size={21} />
                <span>
                  <strong>دفع عند الاستلام</strong>
                  <small>اطلب الآن وادفع عند وصوله</small>
                </span>
              </div>
            </div>
            <div className="features-list">
              <h3>تفاصيل المنتج</h3>
              {product.features.map(feature => (
                <div key={feature}>
                  <Check size={16} /> {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ProductRail
        title="قد يعجبك أيضاً"
        label="COMPLETE THE KIT"
        products={otherProducts}
      />
    </>
  );
}
