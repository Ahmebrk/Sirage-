import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Edit3,
  LogIn,
  Package,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDZD } from "@/lib/cart";
import { ManusLoginConfigurationError, startLogin } from "@/const";

const statuses = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
const statusLabels: Record<(typeof statuses)[number], string> = {
  pending: "جديد",
  confirmed: "قيد التحضير",
  shipped: "تم الشحن",
  delivered: "مكتمل",
  cancelled: "ملغي",
};
export default function Admin() {
  const access = trpc.auth.adminAccess.useQuery();
  const isAdmin = access.data?.authenticated === true;
  const setupToken = new URLSearchParams(window.location.search).get("setup");
  const stats = trpc.admin.stats.useQuery(undefined, { enabled: isAdmin });
  const orders = trpc.admin.orders.useQuery(undefined, { enabled: isAdmin });
  const products = trpc.admin.products.useQuery(undefined, {
    enabled: isAdmin,
  });
  const updateStatus = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => orders.refetch(),
  });
  const saveDelivery = trpc.admin.saveDelivery.useMutation({
    onSuccess: () => stats.refetch(),
  });
  const saveProduct = trpc.admin.saveProduct.useMutation({
    onSuccess: () => {
      products.refetch();
      stats.refetch();
      setEditingProduct(null);
    },
  });
  const deleteProduct = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => {
      products.refetch();
      stats.refetch();
    },
  });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.reload(),
  });
  const passwordLogout = trpc.adminAuth.logout.useMutation({
    onSuccess: () => window.location.reload(),
  });
  const createSetup = trpc.admin.createClientSetup.useMutation({
    onSuccess: result =>
      setSetupLink(
        `${window.location.origin}/admin?setup=${encodeURIComponent(result.token)}`
      ),
  });
  const [tab, setTab] = useState<
    "overview" | "orders" | "catalog" | "delivery"
  >("overview");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [setupLink, setSetupLink] = useState("");
  const [loginError, setLoginError] = useState("");
  if (access.isLoading)
    return (
      <div className="container page-loading">
        جارٍ التحقق من صلاحيات الدخول...
      </div>
    );
  if (!isAdmin && setupToken) return <ClientAdminSetup token={setupToken} />;
  if (!isAdmin)
    return (
      <div className="container admin-gate">
        <div className="admin-gate-icon">
          <ShieldCheck size={34} />
        </div>
        <span className="eyebrow">SIRAGE CONTROL / PRIVATE</span>
        <h1>لوحة إدارة المتجر</h1>
        <p>
          هذه المنطقة مخصصة لفريق SIRAGE SPORT. سجّل الدخول بحساب المدير للوصول
          إلى الطلبات والمخزون وإعدادات التوصيل.
        </p>
        <button
          className="button button-orange"
          onClick={() => {
            setLoginError("");
            try {
              startLogin();
            } catch (error) {
              if (error instanceof ManusLoginConfigurationError) {
                setLoginError(
                  "تسجيل الدخول غير مفعّل بعد. يجب إضافة إعدادات Manus OAuth في Netlify."
                );
              } else {
                setLoginError("تعذر بدء تسجيل الدخول. حاول مرة أخرى.");
              }
            }
          }}
        >
          <LogIn size={17} /> تسجيل الدخول للمدير
        </button>
        {loginError && (
          <small className="admin-dialog-error">{loginError}</small>
        )}
        <Link href="/" className="text-link">
          العودة للمتجر <ArrowLeft size={17} />
        </Link>
      </div>
    );
  const config = stats.data?.config;
  return (
    <div className="container admin-page">
      <div className="admin-header">
        <div>
          <span className="eyebrow">SIRAGE CONTROL / 01</span>
          <h1>لوحة التحكم</h1>
          <p>إدارة يومية بسيطة وواضحة لمتجرك.</p>
        </div>
        <div className="admin-header-actions">
          <button
            className="button button-outline"
            onClick={() => createSetup.mutate()}
            disabled={createSetup.isPending}
          >
            <ShieldCheck size={16} />{" "}
            {createSetup.isPending
              ? "جارٍ إنشاء الرابط..."
              : "رابط تسليم للعميل"}
          </button>
          <button
            className="button button-outline"
            onClick={() => {
              stats.refetch();
              orders.refetch();
              products.refetch();
            }}
          >
            <RefreshCw size={16} /> تحديث البيانات
          </button>
          <button
            className="button button-outline"
            onClick={() =>
              access.data?.method === "password"
                ? passwordLogout.mutate()
                : logout.mutate()
            }
          >
            <LogIn size={16} /> تسجيل الخروج
          </button>
        </div>
      </div>
      {setupLink && (
        <div className="client-setup-link">
          <strong>
            رابط تهيئة العميل — صالح لمدة 24 ساعة ويُستخدم مرة واحدة
          </strong>
          <code>{setupLink}</code>
          <small>
            انسخه إلى قناة خاصة وآمنة للعميل فقط. لن يظهر مجدداً بعد مغادرة هذه
            الصفحة.
          </small>
        </div>
      )}
      <div className="admin-tabs">
        {[
          { id: "overview", label: "نظرة عامة", icon: BarChart3 },
          { id: "orders", label: "الطلبات", icon: ShoppingBag },
          { id: "catalog", label: "المنتجات", icon: Package },
          { id: "delivery", label: "التوصيل", icon: Truck },
        ].map(item => (
          <button
            className={tab === item.id ? "active" : ""}
            key={item.id}
            onClick={() => setTab(item.id as typeof tab)}
          >
            <item.icon size={17} />
            {item.label}
          </button>
        ))}
      </div>
      {tab === "overview" && (
        <div className="admin-overview">
          <div className="stat-grid">
            <div>
              <span>إجمالي المبيعات</span>
              <strong>{formatDZD(stats.data?.revenue || 0)}</strong>
              <small>من الطلبات المسجلة</small>
            </div>
            <div>
              <span>الطلبات</span>
              <strong>{stats.data?.orderCount || 0}</strong>
              <small>طلب يحتاج متابعة</small>
            </div>
            <div>
              <span>المنتجات</span>
              <strong>{stats.data?.productCount || 0}</strong>
              <small>منتج في الكتالوج</small>
            </div>
            <div className="stat-warning">
              <span>مخزون منخفض</span>
              <strong>{stats.data?.lowStock || 0}</strong>
              <small>يحتاج إعادة تعبئة</small>
            </div>
          </div>
          <div className="admin-panels">
            <div className="admin-panel">
              <div className="panel-head">
                <h2>آخر الطلبات</h2>
                <button onClick={() => setTab("orders")}>
                  عرض الكل <ArrowLeft size={15} />
                </button>
              </div>
              {(orders.data || []).slice(0, 5).map(order => (
                <div className="admin-order-row" key={order.orderNumber}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>
                      {order.customerName} · {order.wilaya}
                    </span>
                  </div>
                  <b>{formatDZD(order.total)}</b>
                  <select
                    value={order.status}
                    onChange={e =>
                      updateStatus.mutate({
                        orderNumber: order.orderNumber,
                        status: e.target.value as (typeof statuses)[number],
                      })
                    }
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {!orders.data?.length && (
                <p className="admin-empty">لا توجد طلبات بعد.</p>
              )}
            </div>
            <div className="admin-panel accent-panel">
              <Settings2 size={24} />
              <h2>إعدادات التوصيل</h2>
              <p>
                التوصيل الافتراضي: {formatDZD(config?.defaultFee || 800)}
                <br />
                التوصيل المجاني فوق: {formatDZD(config?.freeAbove || 30000)}
              </p>
              <button className="text-link" onClick={() => setTab("delivery")}>
                تعديل الإعدادات <ArrowLeft size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
      {tab === "orders" && (
        <div className="admin-panel full-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">ORDERS / LIVE</span>
              <h2>إدارة الطلبات</h2>
            </div>
            <span>{orders.data?.length || 0} طلب</span>
          </div>
          <div className="admin-table">
            <div className="admin-table-head">
              <span>الطلب</span>
              <span>العميل</span>
              <span>الإجمالي</span>
              <span>الحالة</span>
            </div>
            {(orders.data || []).map(order => (
              <div className="admin-table-row" key={order.orderNumber}>
                <strong>{order.orderNumber}</strong>
                <span>
                  {order.customerName}
                  <small>
                    {order.phone} · {order.wilaya}
                  </small>
                </span>
                <b>{formatDZD(order.total)}</b>
                <select
                  value={order.status}
                  onChange={e =>
                    updateStatus.mutate({
                      orderNumber: order.orderNumber,
                      status: e.target.value as (typeof statuses)[number],
                    })
                  }
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "catalog" && (
        <div className="admin-panel full-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">CATALOG / STOCK</span>
              <h2>المنتجات والمخزون</h2>
            </div>
            <div className="panel-head-actions">
              <button
                className="button button-orange"
                onClick={() =>
                  setEditingProduct({
                    slug: "",
                    nameAr: "",
                    category: "المعدات",
                    price: 0,
                    stock: 0,
                    description: "",
                    images: [""],
                    features: [],
                    badge: "",
                  })
                }
              >
                <Plus size={15} /> منتج جديد
              </button>
              <Link href="/catalog" className="text-link">
                عرض المتجر <ArrowLeft size={15} />
              </Link>
            </div>
          </div>
          {editingProduct && (
            <ProductEditor
              product={editingProduct}
              saving={saveProduct.isPending}
              onCancel={() => setEditingProduct(null)}
              onSave={product => saveProduct.mutate(product)}
            />
          )}
          <div className="admin-table">
            <div className="admin-table-head">
              <span>المنتج</span>
              <span>الفئة</span>
              <span>السعر</span>
              <span>المخزون</span>
            </div>
            {(products.data || []).map(product => (
              <div className="admin-table-row" key={product.slug}>
                <span className="product-admin-cell">
                  <img src={product.images[0]} alt="" />
                  <strong>{product.nameAr}</strong>
                </span>
                <span>{product.category}</span>
                <b>{formatDZD(product.price)}</b>
                <span className={product.stock < 10 ? "low-stock" : "stock-ok"}>
                  {product.stock} قطعة
                </span>
                <div className="admin-product-actions">
                  <button
                    aria-label="تعديل المنتج"
                    onClick={() => setEditingProduct(product)}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    aria-label="حذف المنتج"
                    onClick={() => {
                      if (window.confirm("حذف هذا المنتج؟"))
                        deleteProduct.mutate({ id: product.id });
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "delivery" && (
        <DeliveryPanel
          config={config}
          onSave={payload => saveDelivery.mutate(payload)}
          saving={saveDelivery.isPending}
        />
      )}
    </div>
  );
}

function ProductEditor({
  product,
  saving,
  onCancel,
  onSave,
}: {
  product: any;
  saving: boolean;
  onCancel: () => void;
  onSave: (product: any) => void;
}) {
  const [form, setForm] = useState({
    id: product.id,
    slug: product.slug || "",
    nameAr: product.nameAr || "",
    category: product.category || "المعدات",
    price: product.price || 0,
    stock: product.stock || 0,
    description: product.description || "",
    images: product.images?.join("\n") || "",
    features: product.features?.join("، ") || "",
    badge: product.badge || "",
  });
  return (
    <div className="product-editor">
      <div className="product-editor-head">
        <span className="eyebrow">PRODUCT / EDITOR</span>
        <button className="icon-button" onClick={onCancel}>
          ×
        </button>
      </div>
      <div className="product-editor-grid">
        <label>
          اسم المنتج
          <input
            value={form.nameAr}
            onChange={e => setForm({ ...form, nameAr: e.target.value })}
          />
        </label>
        <label>
          الرابط المختصر
          <input
            value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })}
          />
        </label>
        <label>
          الفئة
          <input
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          />
        </label>
        <label>
          السعر (دج)
          <input
            type="number"
            value={form.price}
            onChange={e => setForm({ ...form, price: Number(e.target.value) })}
          />
        </label>
        <label>
          المخزون
          <input
            type="number"
            value={form.stock}
            onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
          />
        </label>
        <label>
          الشارة
          <input
            value={form.badge}
            onChange={e => setForm({ ...form, badge: e.target.value })}
          />
        </label>
        <label className="full-field">
          الوصف
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label className="full-field">
          روابط الصور <small>رابط واحد في كل سطر</small>
          <textarea
            value={form.images}
            onChange={e => setForm({ ...form, images: e.target.value })}
          />
        </label>
        <label className="full-field">
          المزايا <small>افصل بينها بفاصلة</small>
          <input
            value={form.features}
            onChange={e => setForm({ ...form, features: e.target.value })}
          />
        </label>
      </div>
      <div className="product-editor-actions">
        <button className="button button-outline" onClick={onCancel}>
          إلغاء
        </button>
        <button
          className="button button-orange"
          disabled={saving}
          onClick={() =>
            onSave({
              ...form,
              images: form.images
                .split("\n")
                .map((item: string) => item.trim())
                .filter(Boolean),
              features: form.features
                .split("،")
                .map((item: string) => item.trim())
                .filter(Boolean),
            })
          }
        >
          {saving ? (
            "جارٍ الحفظ..."
          ) : (
            <>
              <Check size={15} /> حفظ المنتج
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ClientAdminSetup({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [complete, setComplete] = useState(false);
  const setup = trpc.adminAuth.setup.useMutation({
    onSuccess: () => setComplete(true),
  });
  if (complete)
    return (
      <div className="container admin-gate">
        <div className="admin-gate-icon">
          <Check size={34} />
        </div>
        <span className="eyebrow">SIRAGE CONTROL / CLIENT SETUP</span>
        <h1>تم إعداد كلمة المرور</h1>
        <p>
          احتفظ بها لدى فريق العميل فقط. يمكنك الآن فتح لوحة الإدارة وتسجيل
          الدخول بكلمة المرور الجديدة.
        </p>
        <Link href="/admin" className="button button-orange">
          فتح لوحة الإدارة <ArrowLeft size={17} />
        </Link>
      </div>
    );
  return (
    <div className="container admin-gate">
      <div className="admin-gate-icon">
        <ShieldCheck size={34} />
      </div>
      <span className="eyebrow">SIRAGE CONTROL / CLIENT SETUP</span>
      <h1>إعداد إدارة العميل</h1>
      <p>
        أنشئ كلمة مرور قوية من 12 حرفاً أو أكثر. لن تُعرض كلمة المرور أو تُرسل
        إلى أي شخص.
      </p>
      <label className="admin-dialog-field">
        <span>كلمة مرور العميل</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
      </label>
      <label className="admin-dialog-field">
        <span>تأكيد كلمة المرور</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={event => setConfirmation(event.target.value)}
        />
      </label>
      <button
        className="button button-orange"
        disabled={
          password.length < 12 || password !== confirmation || setup.isPending
        }
        onClick={() => setup.mutate({ token, password })}
      >
        {setup.isPending ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
      </button>
      {setup.error && (
        <small className="admin-dialog-error">
          انتهت صلاحية رابط التهيئة أو تم استخدامه. اطلب رابطاً جديداً من
          المالك.
        </small>
      )}
    </div>
  );
}

function DeliveryPanel({
  config,
  onSave,
  saving,
}: {
  config: any;
  onSave: (payload: {
    defaultFee: number;
    freeAbove: number;
    fees: Record<string, number>;
    whatsappNumber: string;
  }) => void;
  saving: boolean;
}) {
  const [defaultFee, setDefaultFee] = useState(config?.defaultFee || 800);
  const [freeAbove, setFreeAbove] = useState(config?.freeAbove || 30000);
  const [fees, setFees] = useState<Record<string, number>>(config?.fees || {});
  const [whatsappNumber, setWhatsappNumber] = useState(
    config?.whatsappNumber || ""
  );
  const wilayas = Object.keys(fees);
  return (
    <div className="admin-panel delivery-editor">
      <div className="panel-head">
        <div>
          <span className="eyebrow">DELIVERY / SETTINGS</span>
          <h2>إعدادات التوصيل</h2>
        </div>
        <Truck size={25} />
      </div>
      <div className="delivery-settings-grid">
        <label>
          <span>السعر الافتراضي (دج)</span>
          <input
            type="number"
            value={defaultFee}
            onChange={e => setDefaultFee(Number(e.target.value))}
          />
        </label>
        <label>
          <span>توصيل مجاني فوق (دج)</span>
          <input
            type="number"
            value={freeAbove}
            onChange={e => setFreeAbove(Number(e.target.value))}
          />
        </label>
        <label>
          <span>واتساب المتجر</span>
          <input
            placeholder="0555000000 أو 213555000000"
            value={whatsappNumber}
            onChange={e => setWhatsappNumber(e.target.value)}
          />
          <small>يُستخدم لبناء رابط wa.me بعد حفظ الطلب.</small>
        </label>
      </div>
      <div className="wilaya-fees">
        <h3>أسعار الولايات</h3>
        {wilayas.map(wilaya => (
          <label key={wilaya}>
            <span>{wilaya}</span>
            <input
              type="number"
              value={fees[wilaya]}
              onChange={e =>
                setFees(current => ({
                  ...current,
                  [wilaya]: Number(e.target.value),
                }))
              }
            />
          </label>
        ))}
      </div>
      <button
        className="button button-orange"
        onClick={() => onSave({ defaultFee, freeAbove, fees, whatsappNumber })}
      >
        {saving ? (
          "جارٍ الحفظ..."
        ) : (
          <>
            <Check size={17} /> حفظ إعدادات التوصيل
          </>
        )}
      </button>
    </div>
  );
}
