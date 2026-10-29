import { Link } from "wouter";
import { ArrowLeft, ArrowUpLeft, Play, Quote } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ProductRail, CategoryStrip, TrustStrip } from "@/components/store";

export default function Home() {
  const { data: products = [], isLoading } = trpc.catalog.list.useQuery({
    sort: "featured",
  });
  return (
    <>
      <section className="hero-section">
        <div className="hero-noise" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow">SIRAGE SPORT / 2026</span>
            <h1>
              تحرّك
              <br />
              <em>بلا حدود.</em>
            </h1>
            <p>
              معدات مصممة للأداء الحقيقي. اختيارات احترافية للتمرين، اللعب، وكل
              مرة تقرر فيها أن تتجاوز مستواك.
            </p>
            <div className="hero-actions">
              <Link href="/catalog" className="button button-orange">
                تسوّق المجموعة <ArrowLeft size={18} />
              </Link>
              <Link
                href="/catalog?category=الأحذية"
                className="button button-ghost"
              >
                اكتشف الأحذية <ArrowUpLeft size={17} />
              </Link>
            </div>
            <div className="hero-meta">
              <span>
                <strong>58</strong> ولاية
              </span>
              <span>
                <strong>COD</strong> دفع عند الاستلام
              </span>
              <span>
                <strong>24/7</strong> طاقة مستمرة
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-glow" />
            <div className="hero-ring hero-ring-one" />
            <div className="hero-ring hero-ring-two" />
            <div className="hero-card hero-card-main">
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=90"
                alt="حذاء رياضي أزرق من SIRAGE SPORT"
              />
              <div className="hero-card-caption">
                <span>01 / RUNNING</span>
                <strong>AERO RUNNER</strong>
              </div>
            </div>
            <div className="hero-sticker">
              <span>
                MOVE
                <br />
                FASTER
              </span>
              <Play size={14} fill="currentColor" />
            </div>
            <div className="hero-vertical">PERFORMANCE · ALGERIA · SIRAGE</div>
          </div>
        </div>
        <div className="container hero-scroll">
          <span>مرّر لاكتشاف المزيد</span>
          <span className="scroll-line" />
        </div>
      </section>
      <TrustStrip />
      <CategoryStrip />
      <ProductRail
        title="اختيارات هذا الأسبوع"
        label="THE SIRAGE EDIT"
        products={products}
      />
      <section className="manifesto-section">
        <div className="container manifesto-grid">
          <div className="manifesto-mark">
            S / <span>02</span>
          </div>
          <div>
            <span className="eyebrow">BUILT TO MOVE</span>
            <h2>
              الأداء ليس
              <br />
              <em>خياراً.</em>
            </h2>
          </div>
          <div className="manifesto-copy">
            <p>
              نختار كل قطعة على أساس واحد: هل ستساعدك على التحرك بشكل أفضل؟ من
              أول خطوة إلى آخر تكرار، SIRAGE معك في كل تحدٍ.
            </p>
            <Link href="/catalog" className="text-link">
              تعرّف على المجموعة <ArrowLeft size={17} />
            </Link>
          </div>
        </div>
      </section>
      {!isLoading && products.length > 0 && (
        <section className="quote-section">
          <div className="container quote-inner">
            <Quote size={28} />
            <p>
              “الروتين يبدأ من قرار صغير. المعدات المناسبة تجعل القرار أسهل.”
            </p>
            <span>SIRAGE TRAINING NOTE / 001</span>
          </div>
        </section>
      )}
    </>
  );
}
