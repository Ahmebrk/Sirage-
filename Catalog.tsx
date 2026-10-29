import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  FilterButton,
  PageIntro,
  PaginationHint,
  ProductCard,
} from "@/components/store";

export default function Catalog() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const [query, setQuery] = useState(params.get("query") || "");
  const [category, setCategory] = useState(params.get("category") || "الكل");
  const [sort, setSort] = useState<"featured" | "priceAsc" | "priceDesc">(
    "featured"
  );
  const [mobileFilters, setMobileFilters] = useState(false);
  const categories = trpc.catalog.categories.useQuery().data ?? [
    "الكل",
    "الأحذية",
    "الملابس",
    "المعدات",
    "الإكسسوارات",
  ];
  const { data: products = [], isLoading } = trpc.catalog.list.useQuery({
    query,
    category,
    sort,
  });
  const grouped = useMemo(() => products, [products]);
  return (
    <div className="catalog-page container">
      <PageIntro
        eyebrow="THE FULL LINEUP"
        title="كل ما تحتاجه للتحرك"
        description="اختيارات مدروسة للجري، التدريب، الملعب، وأيام الراحة النشطة."
      >
        <FilterButton onClick={() => setMobileFilters(true)} />
      </PageIntro>
      <div className="catalog-layout">
        <aside
          className={`filters-panel ${mobileFilters ? "filters-open" : ""}`}
        >
          <div className="filters-head">
            <span className="eyebrow">FILTER / 01</span>
            <button
              className="icon-button close-filter"
              onClick={() => setMobileFilters(false)}
            >
              <X size={19} />
            </button>
          </div>
          <label className="filter-label">ابحث في المنتجات</label>
          <div className="catalog-search">
            <Search size={17} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="اسم المنتج..."
            />
          </div>
          <label className="filter-label">الفئة</label>
          <div className="category-filter-list">
            {categories.map(item => (
              <button
                className={category === item ? "selected" : ""}
                key={item}
                onClick={() => {
                  setCategory(item);
                  setMobileFilters(false);
                }}
              >
                {item}
                <span>
                  {item === "الكل"
                    ? products.length
                    : products.filter(product => product.category === item)
                        .length}
                </span>
              </button>
            ))}
          </div>
          <label className="filter-label">ترتيب حسب</label>
          <select
            className="filter-select"
            value={sort}
            onChange={e => setSort(e.target.value as typeof sort)}
          >
            <option value="featured">الأكثر صلة</option>
            <option value="priceAsc">السعر: من الأقل للأعلى</option>
            <option value="priceDesc">السعر: من الأعلى للأقل</option>
          </select>
        </aside>
        <div className="catalog-results">
          <div className="catalog-toolbar">
            <PaginationHint count={grouped.length} />
            <button
              className="sort-select-mobile"
              onClick={() => setMobileFilters(true)}
            >
              <SlidersHorizontal size={16} /> فلاتر وترتيب
            </button>
          </div>
          {isLoading ? (
            <div className="product-grid">
              {[1, 2, 3, 4].map(item => (
                <div className="skeleton-card" key={item} />
              ))}
            </div>
          ) : grouped.length ? (
            <div className="product-grid">
              {grouped.map((product, index) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="empty-catalog">
              <Search size={32} />
              <h3>لم نجد منتجات مطابقة</h3>
              <p>جرّب كلمة بحث أخرى أو اختر فئة مختلفة.</p>
              <button
                className="button button-outline"
                onClick={() => {
                  setQuery("");
                  setCategory("الكل");
                }}
              >
                مسح الفلاتر
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
