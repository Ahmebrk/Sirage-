import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  Lock,
  MessageCircle,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDZD, useCart } from "@/lib/cart";
import { buildWhatsAppConfirmationUrl } from "@/lib/whatsapp";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { data: delivery } = trpc.delivery.config.useQuery();
  const createOrder = trpc.orders.create.useMutation();
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    wilaya: "الجزائر",
    address: "",
    notes: "",
  });
  const [confirmed, setConfirmed] = useState<any>(null);
  const fee = useMemo(
    () =>
      subtotal >= (delivery?.freeAbove || 30000)
        ? 0
        : (delivery?.fees?.[form.wilaya] ?? delivery?.defaultFee ?? 800),
    [delivery, form.wilaya, subtotal]
  );
  const update = (key: string, value: string) =>
    setForm(current => ({ ...current, [key]: value }));
  const whatsappNumber = (delivery?.whatsappNumber || "").replace(/\D/g, "");
  const whatsappUrl = confirmed
    ? buildWhatsAppConfirmationUrl(whatsappNumber, confirmed)
    : "";
  if (confirmed)
    return (
      <div className="container confirmation-page">
        <div className="confirmation-mark">
          <Check size={34} />
        </div>
        <span className="eyebrow">ORDER CONFIRMED / 01</span>
        <h1>طلبك في الطريق إليك.</h1>
        <p>
          شكراً {confirmed.customerName}! تم تسجيل طلبك بنجاح وسيتواصل معك
          فريقنا لتأكيد التفاصيل.
        </p>
        <div className="order-number-card">
          <span>رقم الطلب</span>
          <strong>{confirmed.orderNumber}</strong>
          <small>احتفظ بهذا الرقم لتتبع طلبك</small>
        </div>
        {whatsappUrl ? (
          <div className="whatsapp-confirmation">
            <a
              className="button whatsapp-button"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} /> تأكيد الطلب عبر واتساب
            </a>
            <small>
              سيُفتح واتساب برسالة جاهزة. اضغط إرسال داخل واتساب لإتمام التأكيد.
            </small>
          </div>
        ) : (
          <div className="whatsapp-fallback">
            لم يضبط المتجر رقم واتساب بعد. سيتواصل معك فريقنا هاتفياً لتأكيد
            الطلب.
          </div>
        )}
        <div className="confirmation-actions">
          <Link
            href={`/track?order=${confirmed.orderNumber}`}
            className="button button-orange"
          >
            تتبع الطلب <ArrowLeft size={17} />
          </Link>
          <Link href="/catalog" className="button button-outline">
            متابعة التسوق
          </Link>
        </div>
      </div>
    );
  if (!items.length)
    return (
      <div className="container empty-checkout">
        <div className="empty-state">
          <ShieldCheck size={34} />
          <h2>السلة فارغة</h2>
          <p>أضف منتجاتك المفضلة أولاً ثم عد إلى هنا لإتمام طلبك.</p>
          <Link href="/catalog" className="button button-primary">
            العودة للمنتجات
          </Link>
        </div>
      </div>
    );
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    createOrder.mutate(
      {
        ...form,
        items: items.map(item => ({
          slug: item.slug,
          nameAr: item.nameAr,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
      },
      {
        onSuccess: order => {
          clear();
          setConfirmed(order);
        },
      }
    );
  };
  return (
    <div className="container checkout-page">
      <div className="breadcrumb">
        <Link href="/">الرئيسية</Link>
        <ChevronLeft size={14} />
        <strong>إتمام الطلب</strong>
      </div>
      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={submit}>
          <div className="checkout-heading">
            <span className="eyebrow">CHECKOUT / 01</span>
            <h1>أكمل طلبك</h1>
            <p>الدفع عند الاستلام — بسيط، واضح، ومتاح في كل الجزائر.</p>
          </div>
          <section className="form-section">
            <div className="form-section-title">
              <span>01</span>
              <div>
                <h2>بيانات التوصيل</h2>
                <p>سنستخدمها لتأكيد طلبك وشحنه.</p>
              </div>
            </div>
            <div className="form-grid">
              <label>
                <span>الاسم الكامل</span>
                <div className="input-with-icon">
                  <UserRound size={17} />
                  <input
                    required
                    value={form.customerName}
                    onChange={e => update("customerName", e.target.value)}
                    placeholder="مثال: محمد بن علي"
                  />
                </div>
              </label>
              <label>
                <span>رقم الهاتف</span>
                <div className="input-with-icon">
                  <Phone size={17} />
                  <input
                    required
                    value={form.phone}
                    onChange={e => update("phone", e.target.value)}
                    placeholder="05 XX XX XX XX"
                  />
                </div>
              </label>
              <label>
                <span>الولاية</span>
                <div className="input-with-icon">
                  <MapPin size={17} />
                  <select
                    required
                    value={form.wilaya}
                    onChange={e => update("wilaya", e.target.value)}
                  >
                    {(delivery?.wilayas || ["الجزائر", "وهران", "قسنطينة"]).map(
                      wilaya => (
                        <option key={wilaya}>{wilaya}</option>
                      )
                    )}
                  </select>
                </div>
              </label>
              <label className="full-field">
                <span>العنوان بالتفصيل</span>
                <textarea
                  required
                  value={form.address}
                  onChange={e => update("address", e.target.value)}
                  placeholder="الحي، الشارع، رقم المنزل..."
                />
              </label>
              <label className="full-field">
                <span>
                  ملاحظات إضافية <small>(اختياري)</small>
                </span>
                <textarea
                  value={form.notes}
                  onChange={e => update("notes", e.target.value)}
                  placeholder="وقت مناسب للتوصيل، لون مفضل..."
                />
              </label>
            </div>
          </section>
          <section className="form-section payment-section">
            <div className="form-section-title">
              <span>02</span>
              <div>
                <h2>طريقة الدفع</h2>
                <p>لا تحتاج إلى بطاقة بنكية.</p>
              </div>
            </div>
            <div className="payment-card selected">
              <div className="payment-icon">
                <Lock size={20} />
              </div>
              <div>
                <strong>الدفع عند الاستلام</strong>
                <p>ادفع نقداً عند استلام طلبك.</p>
              </div>
              <span className="radio-check">
                <Check size={14} />
              </span>
            </div>
          </section>
          <button
            disabled={createOrder.isPending}
            className="button button-orange button-wide submit-order"
          >
            {createOrder.isPending ? (
              "جارٍ تسجيل الطلب..."
            ) : (
              <>
                تأكيد الطلب · {formatDZD(subtotal + fee)}{" "}
                <ArrowLeft size={18} />
              </>
            )}
          </button>
          {createOrder.error && (
            <p className="form-error">
              تعذر تسجيل الطلب. تحقق من البيانات وحاول مرة أخرى.
            </p>
          )}
        </form>
        <aside className="checkout-summary">
          <div className="summary-sticky">
            <div className="summary-top">
              <span className="eyebrow">
                YOUR KIT / {String(items.length).padStart(2, "0")}
              </span>
              <h2>ملخص الطلب</h2>
            </div>
            <div className="checkout-items">
              {items.map(item => (
                <div className="checkout-item" key={item.slug}>
                  <img src={item.image} alt={item.nameAr} />
                  <div>
                    <strong>{item.nameAr}</strong>
                    <span>الكمية: {item.quantity}</span>
                  </div>
                  <b>{formatDZD(item.price * item.quantity)}</b>
                </div>
              ))}
            </div>
            <div className="summary-lines">
              <div>
                <span>المجموع الفرعي</span>
                <b>{formatDZD(subtotal)}</b>
              </div>
              <div>
                <span>التوصيل إلى {form.wilaya}</span>
                <b>{fee === 0 ? "مجاني" : formatDZD(fee)}</b>
              </div>
              {fee === 0 && <small>تهانينا — حصلت على توصيل مجاني!</small>}
              <div className="summary-total">
                <span>الإجمالي</span>
                <b>{formatDZD(subtotal + fee)}</b>
              </div>
            </div>
            <div className="secure-note">
              <ShieldCheck size={17} /> بياناتك محمية ويتم استخدامُها فقط
              لمعالجة الطلب.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
