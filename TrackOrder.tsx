import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  Package,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDZD } from "@/lib/cart";

const statusLabels: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "تم تأكيد الطلب",
  shipped: "في الطريق إليك",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};
const steps = ["pending", "confirmed", "shipped", "delivered"];
export default function TrackOrder() {
  const [location] = useLocation();
  const initialOrder =
    new URLSearchParams(location.split("?")[1] || "").get("order") || "";
  const [form, setForm] = useState({ orderNumber: initialOrder, phone: "" });
  const [searched, setSearched] = useState(false);
  const query = trpc.orders.track.useQuery(form, { enabled: false });
  const order = query.data;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    query.refetch();
  };
  const currentIndex = order ? steps.indexOf(order.status) : -1;
  return (
    <div className="container track-page">
      <div className="track-hero">
        <span className="eyebrow">TRACK YOUR ORDER / 01</span>
        <h1>أين وصل طلبك؟</h1>
        <p>أدخل رقم الطلب ورقم الهاتف المستخدم عند الشراء لمتابعة آخر تحديث.</p>
        <form className="track-form" onSubmit={handleSubmit}>
          <label>
            <span>رقم الطلب</span>
            <input
              required
              value={form.orderNumber}
              onChange={e =>
                setForm({ ...form, orderNumber: e.target.value.toUpperCase() })
              }
              placeholder="SRG-XXXXXXX"
            />
          </label>
          <label>
            <span>رقم الهاتف</span>
            <input
              required
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="05 XX XX XX XX"
            />
          </label>
          <button className="button button-orange" disabled={query.isFetching}>
            تتبع الآن <Search size={17} />
          </button>
        </form>
        {searched && !order && !query.isFetching && (
          <div className="track-error">
            <XCircle size={18} /> لم نعثر على طلب بهذه البيانات. راجع الرقم
            وحاول مرة أخرى.
          </div>
        )}
      </div>
      {order && (
        <div className="track-result">
          <div className="track-result-head">
            <div>
              <span className="eyebrow">ORDER / {order.orderNumber}</span>
              <h2>{statusLabels[order.status]}</h2>
              <p>آخر تحديث لطلب {order.orderNumber}</p>
            </div>
            <span className={`status-pill status-${order.status}`}>
              {statusLabels[order.status]}
            </span>
          </div>
          <div className="status-timeline">
            {steps.map((step, index) => (
              <div
                className={`timeline-step ${index <= currentIndex ? "done" : ""} ${step === order.status ? "current" : ""}`}
                key={step}
              >
                <span className="timeline-icon">
                  {index === 0 ? (
                    <Package size={17} />
                  ) : index === 1 ? (
                    <Check size={17} />
                  ) : index === 2 ? (
                    <Truck size={17} />
                  ) : (
                    <Check size={17} />
                  )}
                </span>
                <div>
                  <strong>{statusLabels[step]}</strong>
                  <small>
                    {index <= currentIndex
                      ? index === 0
                        ? "تم استلام الطلب"
                        : index === 1
                          ? "فريقنا يجهز طلبك"
                          : index === 2
                            ? "مع شركة التوصيل"
                            : "نتمنى أن تستمتع به"
                      : "بانتظار التحديث"}
                  </small>
                </div>
              </div>
            ))}
          </div>
          <div className="track-details">
            <div>
              <span>المستلم</span>
              <strong>{order.customerName}</strong>
            </div>
            <div>
              <span>الوجهة</span>
              <strong>{order.wilaya}</strong>
            </div>
            <div>
              <span>المجموع</span>
              <strong>{formatDZD(order.total)}</strong>
            </div>
            <div>
              <span>طريقة الدفع</span>
              <strong>عند الاستلام</strong>
            </div>
          </div>
          <div className="track-items">
            {order.items.map(item => (
              <div key={item.slug}>
                <img src={item.image} alt={item.nameAr} />
                <span>
                  {item.nameAr} <small>× {item.quantity}</small>
                </span>
                <strong>{formatDZD(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
      {!order && (
        <div className="track-help">
          <span>هل تحتاج إلى مساعدة؟</span>
          <Link href="tel:0799680163">
            تواصل مع فريق SIRAGE <ArrowLeft size={16} />
          </Link>
        </div>
      )}
      <Link href="/catalog" className="text-link track-back">
        العودة إلى المتجر <ArrowLeft size={17} />
      </Link>
    </div>
  );
}
