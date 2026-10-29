import { Link, useLocation } from "wouter";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  LockKeyhole,
  Menu,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDZD, useCart, type CartItem } from "@/lib/cart";

export const LOGO = "/assets/sirage-logo.jpg";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand-lockup ${compact ? "brand-lockup--compact" : ""}`}
      aria-label="SIRAGE SPORT"
    >
      <span className="brand-logo-wrap">
        <img src={LOGO} alt="SIRAGE SPORT" />
      </span>
      {!compact && (
        <span className="brand-wordmark">
          <strong>SIRAGE</strong>
          <small>SPORT</small>
        </span>
      )}
    </Link>
  );
}

export function StoreShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { totalItems } = useCart();
  const nav = [
    { href: "/catalog", label: "المنتجات" },
    { href: "/catalog?category=الأحذية", label: "الأحذية" },
    { href: "/catalog?category=الملابس", label: "الملابس" },
    { href: "/catalog?category=المعدات", label: "المعدات" },
  ];

  return (
    <div className="app-shell">
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span>
            <Zap size={13} /> شحن سريع إلى 58 ولاية
          </span>
          <span>الدفع عند الاستلام متاح</span>
          <Link href="/track">
            تتبع طلبك <ArrowLeft size={13} />
          </Link>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <button
            className="icon-button mobile-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="فتح القائمة"
          >
            <Menu size={21} />
          </button>
          <Logo />
          <nav className="desktop-nav">
            {nav.map(item => (
              <Link
                key={item.href}
                className={
                  location.startsWith(item.href.split("?")[0]) ? "active" : ""
                }
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <form
              className="header-search"
              onSubmit={e => {
                e.preventDefault();
                if (query.trim())
                  window.location.href = `/catalog?query=${encodeURIComponent(query.trim())}`;
              }}
            >
              <Search size={18} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="ابحث عن منتج..."
                aria-label="ابحث عن منتج"
              />
            </form>
            <Link
              href="/track"
              className="icon-button track-button"
              aria-label="تتبع الطلب"
            >
              <Truck size={20} />
            </Link>
            <button
              className="icon-button cart-button"
              onClick={() => setCartOpen(true)}
              aria-label="السلة"
            >
              <ShoppingBag size={20} />
              <span>{totalItems}</span>
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
          <aside className="mobile-menu" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-head">
              <Logo compact />
              <button
                className="icon-button"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <nav>
              {nav.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                  <ArrowLeft size={16} />
                </Link>
              ))}
              <Link href="/track" onClick={() => setMenuOpen(false)}>
                تتبع الطلب
                <ArrowLeft size={16} />
              </Link>
            </nav>
          </aside>
        </div>
      )}
      <main>{children}</main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Logo />
            <p>
              معداتك. سرعتك. طاقتك.
              <br />
              كل ما تحتاجه لتتجاوز مستواك.
            </p>
          </div>
          <div>
            <h4>تسوق</h4>
            <Link href="/catalog">كل المنتجات</Link>
            <Link href="/catalog?category=الأحذية">الأحذية</Link>
            <Link href="/catalog?category=الملابس">الملابس</Link>
            <Link href="/catalog?category=الإكسسوارات">الإكسسوارات</Link>
          </div>
          <div>
            <h4>خدمة العملاء</h4>
            <Link href="/track">تتبع الطلب</Link>
            <Link href="/checkout">إتمام الطلب</Link>
            <a href="tel:0799680163">اتصل بنا · 0799680163</a>
            <span>السبت — الخميس · 09:00 — 18:00</span>
          </div>
          <div className="footer-note">
            <span className="footer-kicker">SIRAGE / 01</span>
            <h3>
              جاهز للتمرين
              <br />
              <em>القادم؟</em>
            </h3>
            <Link className="footer-cta" href="/catalog">
              ابدأ التسوق <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © 2026 SIRAGE SPORT — الجزائر{" "}
            <button
              className="footer-admin-dot"
              aria-label="دخول إدارة المتجر"
              onClick={() => setAdminDialogOpen(true)}
            >
              ·
            </button>
          </span>
          <span>صُنع للذين يتحركون</span>
        </div>
      </footer>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {adminDialogOpen && (
        <AdminPasswordDialog onClose={() => setAdminDialogOpen(false)} />
      )}
    </div>
  );
}

function AdminPasswordDialog({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const access = trpc.auth.adminAccess.useQuery();
  const login = trpc.adminAuth.login.useMutation({
    onSuccess: () => {
      window.location.href = "/admin";
    },
  });
  return (
    <div className="admin-dialog-backdrop" onClick={onClose}>
      <section
        className="admin-dialog"
        dir="rtl"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
      >
        <button
          className="icon-button admin-dialog-close"
          onClick={onClose}
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>
        <div className="admin-dialog-icon">
          <LockKeyhole size={23} />
        </div>
        <span className="eyebrow">SIRAGE CONTROL / PRIVATE</span>
        <h2 id="admin-dialog-title">دخول إدارة المتجر</h2>
        <p>
          {access.data?.passwordConfigured
            ? "أدخل كلمة مرور الإدارة للوصول الآمن."
            : "لم يتم إعداد كلمة مرور العميل بعد. استخدم رابط التهيئة الآمن الذي أنشأه المالك."}
        </p>
        <label className="admin-dialog-field">
          <span>كلمة المرور</span>
          <input
            autoFocus
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") login.mutate({ password });
            }}
          />
        </label>
        <button
          className="button button-orange button-wide"
          disabled={
            !access.data?.passwordConfigured ||
            password.length < 12 ||
            login.isPending
          }
          onClick={() => login.mutate({ password })}
        >
          {login.isPending ? "جارٍ التحقق..." : "دخول آمن"}
        </button>
        {login.error && (
          <small className="admin-dialog-error">
            تعذر تسجيل الدخول. تحقق من كلمة المرور.
          </small>
        )}
      </section>
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function ProductCard({
  product,
  index = 0,
}: {
  product: any;
  index?: number;
}) {
  const { addItem } = useCart();
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <article
      className="product-card"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <Link href={`/product/${product.slug}`} className="product-image-wrap">
        <img src={product.images[0]} alt={product.nameAr} />
        <span className="product-index">0{index + 1}</span>
        {product.badge && (
          <span className="product-badge">{product.badge}</span>
        )}
        <button
          className={`wishlist ${liked ? "liked" : ""}`}
          onClick={e => {
            e.preventDefault();
            setLiked(!liked);
          }}
          aria-label="إضافة للمفضلة"
        >
          <Heart size={17} fill={liked ? "currentColor" : "none"} />
        </button>
      </Link>
      <div className="product-copy">
        <span className="product-category">
          {product.category} <i>·</i> {product.subcategory}
        </span>
        <Link href={`/product/${product.slug}`}>
          <h3>{product.nameAr}</h3>
        </Link>
        <div className="product-buy-row">
          <div>
            <strong>{formatDZD(product.price)}</strong>
            {product.compareAt && <del>{formatDZD(product.compareAt)}</del>}
          </div>
          <button
            className={`quick-add ${added ? "is-added" : ""}`}
            onClick={() => {
              addItem({
                slug: product.slug,
                nameAr: product.nameAr,
                price: product.price,
                quantity: 1,
                image: product.images[0],
                stock: product.stock,
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 1300);
            }}
            aria-label="إضافة للسلة"
          >
            {added ? <Check size={18} /> : <Plus size={18} />}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductRail({
  title,
  label,
  products,
}: {
  title: string;
  label: string;
  products: any[];
}) {
  return (
    <section className="container product-rail-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{label}</span>
          <h2>{title}</h2>
        </div>
        <Link href="/catalog" className="text-link">
          اكتشف الكل <ArrowLeft size={17} />
        </Link>
      </div>
      <div className="product-grid">
        {products.slice(0, 4).map((product, index) => (
          <ProductCard key={product.slug} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  if (!open) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="cart-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <span className="eyebrow">YOUR KIT / 01</span>
            <h2>سلة التسوق</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {items.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={34} />
            <h3>السلة فارغة</h3>
            <p>ابدأ باختيار القطعة التي سترافقك في التمرين القادم.</p>
            <Link
              href="/catalog"
              onClick={onClose}
              className="button button-primary"
            >
              استكشف المنتجات
            </Link>
          </div>
        ) : (
          <>
            <div className="drawer-items">
              {items.map(item => (
                <div className="drawer-item" key={item.slug}>
                  <img src={item.image} alt={item.nameAr} />
                  <div className="drawer-item-info">
                    <Link href={`/product/${item.slug}`} onClick={onClose}>
                      {item.nameAr}
                    </Link>
                    <strong>{formatDZD(item.price)}</strong>
                    <div className="qty-control">
                      <button
                        onClick={() =>
                          updateQuantity(item.slug, item.quantity - 1)
                        }
                      >
                        <Minus size={13} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.slug, item.quantity + 1)
                        }
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        className="remove-item"
                        onClick={() => removeItem(item.slug)}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="drawer-summary">
              <div>
                <span>المجموع الفرعي</span>
                <strong>{formatDZD(subtotal)}</strong>
              </div>
              <small>يُحسب التوصيل عند اختيار الولاية</small>
              <Link
                href="/checkout"
                onClick={onClose}
                className="button button-primary button-wide"
              >
                إتمام الطلب <ArrowLeft size={17} />
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function TrustStrip() {
  return (
    <div className="trust-strip">
      <div className="container trust-grid">
        <div>
          <Truck size={23} />
          <span>
            <strong>توصيل موثوق</strong>
            <small>إلى جميع الولايات</small>
          </span>
        </div>
        <div>
          <ShieldCheck size={23} />
          <span>
            <strong>دفع عند الاستلام</strong>
            <small>بكل أمان ووضوح</small>
          </span>
        </div>
        <div>
          <Sparkles size={23} />
          <span>
            <strong>اختيار رياضي</strong>
            <small>منتجات مختبرة بعناية</small>
          </span>
        </div>
        <div>
          <ArrowUpRight size={23} />
          <span>
            <strong>دعم سريع</strong>
            <small>نحن هنا لمساعدتك</small>
          </span>
        </div>
      </div>
    </div>
  );
}

export function CategoryStrip() {
  const categories = [
    {
      name: "الأحذية",
      tag: "01",
      href: "/catalog?category=الأحذية",
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85",
    },
    {
      name: "الملابس",
      tag: "02",
      href: "/catalog?category=الملابس",
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85",
    },
    {
      name: "المعدات",
      tag: "03",
      href: "/catalog?category=المعدات",
      image:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=85",
    },
    {
      name: "الإكسسوارات",
      tag: "04",
      href: "/catalog?category=الإكسسوارات",
      image:
        "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?auto=format&fit=crop&w=800&q=85",
    },
  ];
  return (
    <section className="container category-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">SHOP BY FOCUS</span>
          <h2>اختر مجال لعبك</h2>
        </div>
        <span className="heading-meta">4 / CATEGORIES</span>
      </div>
      <div className="category-grid">
        {categories.map(category => (
          <Link
            className="category-card"
            href={category.href}
            key={category.name}
          >
            <img src={category.image} alt={category.name} />
            <div className="category-overlay" />
            <span className="category-tag">{category.tag}</span>
            <h3>{category.name}</h3>
            <ArrowLeft className="category-arrow" size={20} />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function FilterButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="button button-outline filter-button" onClick={onClick}>
      <Filter size={17} /> فلاتر المنتجات
    </button>
  );
}
export function PaginationHint({ count }: { count: number }) {
  return (
    <div className="results-count">
      <span>{count} منتجات</span>
      <span className="results-line" />
    </div>
  );
}
