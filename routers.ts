import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { deliverySettings, orders, products } from "../drizzle/schema";
import { getDb } from "./db";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import {
  completeClientSetup,
  isPasswordConfigured,
  issueClientSetupToken,
  loginWithPassword,
  logoutPassword,
} from "./admin-auth";

const productImages = {
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&q=85",
  ],
  apparel: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1506629905607-d9c297d43aa9?auto=format&fit=crop&w=1000&q=85",
  ],
  gear: [
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=85",
  ],
  accessories: [
    "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=1000&q=85",
  ],
} as const;

type StoreProduct = {
  id: number;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  category: string;
  subcategory?: string | null;
  price: number;
  compareAt?: number | null;
  stock: number;
  badge?: string | null;
  description: string;
  images: readonly string[];
  features: string[];
  featured: boolean;
};

const seedProducts: StoreProduct[] = [
  {
    id: 1,
    slug: "aero-runner-blue",
    nameAr: "حذاء Aero Runner",
    nameEn: "Aero Runner",
    category: "الأحذية",
    subcategory: "الجري",
    price: 12900,
    compareAt: 15900,
    stock: 18,
    badge: "الأكثر مبيعاً",
    description:
      "حذاء جري خفيف وسريع الاستجابة، مصمم ليوفر لك راحة ثابتة من أول كيلومتر حتى آخره.",
    images: productImages.shoes,
    features: [
      "وسادة امتصاص صدمات",
      "شبك تنفسي خفيف",
      "نعل مطاطي مقاوم للانزلاق",
    ],
    featured: true,
  },
  {
    id: 2,
    slug: "pulse-training-set",
    nameAr: "طقم Pulse Training",
    nameEn: "Pulse Training Set",
    category: "الملابس",
    subcategory: "التدريب",
    price: 7900,
    compareAt: 9500,
    stock: 32,
    badge: "جديد",
    description:
      "طقم تدريبي عملي بخامة سريعة الجفاف وقصة تمنحك حرية الحركة أثناء التمرين.",
    images: productImages.apparel,
    features: ["خامة Quick-Dry", "خصر مرن", "قصة رياضية مريحة"],
    featured: true,
  },
  {
    id: 3,
    slug: "power-grip-gloves",
    nameAr: "قفازات Power Grip",
    nameEn: "Power Grip Gloves",
    category: "الإكسسوارات",
    subcategory: "الجيم",
    price: 3500,
    compareAt: null,
    stock: 44,
    badge: "اختيار المدربين",
    description:
      "قبضة ثابتة وحماية مريحة لليدين في جلسات الحديد والتمارين الوظيفية.",
    images: productImages.accessories,
    features: ["راحة يد مبطنة", "إغلاق قابل للتعديل", "نسيج مقاوم للتعرق"],
    featured: true,
  },
  {
    id: 4,
    slug: "elite-training-bag",
    nameAr: "حقيبة Elite Training",
    nameEn: "Elite Training Bag",
    category: "الإكسسوارات",
    subcategory: "الحقائب",
    price: 6200,
    compareAt: 7400,
    stock: 12,
    badge: "محدود",
    description:
      "حقيبة تدريب متعددة الجيوب، تجمع بين التنظيم العملي والمظهر الرياضي الأنيق.",
    images: productImages.gear,
    features: ["جيب أحذية منفصل", "قماش مقاوم للماء", "حزام كتف مبطن"],
    featured: false,
  },
  {
    id: 5,
    slug: "force-lifting-belt",
    nameAr: "حزام Force لرفع الأوزان",
    nameEn: "Force Lifting Belt",
    category: "المعدات",
    subcategory: "القوة",
    price: 4800,
    compareAt: null,
    stock: 20,
    badge: null,
    description:
      "دعم قوي وثابت لأسفل الظهر خلال تمارين القوة والسكوات والرفعة الميتة.",
    images: productImages.gear,
    features: ["إغلاق سريع", "دعم عريض للظهر", "مقاسات متعددة"],
    featured: false,
  },
  {
    id: 6,
    slug: "flow-yoga-mat",
    nameAr: "حصيرة Flow لليوغا",
    nameEn: "Flow Yoga Mat",
    category: "المعدات",
    subcategory: "المرونة",
    price: 3900,
    compareAt: 4500,
    stock: 27,
    badge: "سهل الحمل",
    description:
      "حصيرة مريحة بسطح ثابت لممارسات اليوغا والتمدد والتمارين المنزلية.",
    images: productImages.accessories,
    features: ["سطح مانع للانزلاق", "سمك 6 مم", "حزام حمل مرفق"],
    featured: false,
  },
  {
    id: 7,
    slug: "pro-match-jersey",
    nameAr: "قميص Pro Match",
    nameEn: "Pro Match Jersey",
    category: "الملابس",
    subcategory: "كرة القدم",
    price: 5600,
    compareAt: 6800,
    stock: 36,
    badge: "الأكثر طلباً",
    description:
      "قميص رياضي خفيف مستوحى من طاقة الملاعب، مناسب للمباريات والتمارين اليومية.",
    images: productImages.apparel,
    features: ["تهوية جانبية", "خامة خفيفة", "ياقة رياضية"],
    featured: false,
  },
  {
    id: 8,
    slug: "speed-rope-carbon",
    nameAr: "حبل Speed Rope Carbon",
    nameEn: "Speed Rope Carbon",
    category: "الإكسسوارات",
    subcategory: "الكارديو",
    price: 2200,
    compareAt: null,
    stock: 64,
    badge: "قيمة ممتازة",
    description:
      "حبل سرعة خفيف للدورات السريعة وتمارين الكارديو في النادي أو المنزل.",
    images: productImages.accessories,
    features: ["مقابض مريحة", "طول قابل للتعديل", "دوران سريع"],
    featured: false,
  },
];

const memoryOrders = new Map<string, StoreOrder>();
const wilayas = [
  "أدرار",
  "الشلف",
  "الأغواط",
  "أم البواقي",
  "باتنة",
  "بجاية",
  "بسكرة",
  "بشار",
  "البليدة",
  "البويرة",
  "تمنراست",
  "تبسة",
  "تلمسان",
  "تيارت",
  "تيزي وزو",
  "الجزائر",
  "الجلفة",
  "جيجل",
  "سطيف",
  "سعيدة",
  "سكيكدة",
  "سيدي بلعباس",
  "عنابة",
  "قالمة",
  "قسنطينة",
  "المدية",
  "مستغانم",
  "المسيلة",
  "معسكر",
  "ورقلة",
  "وهران",
  "البيض",
  "إليزي",
  "برج بوعريريج",
  "بومرداس",
  "الطارف",
  "تندوف",
  "تيسمسيلت",
  "الوادي",
  "خنشلة",
  "سوق أهراس",
  "تيبازة",
  "ميلة",
  "عين الدفلى",
  "النعامة",
  "عين تموشنت",
  "غليزان",
  "غرداية",
  "تيميمون",
  "برج باجي مختار",
  "أولاد جلال",
  "بني عباس",
  "عين صالح",
  "عين قزام",
  "تقرت",
  "جانت",
  "المغير",
  "المنيعة",
];
const defaultFees: Record<string, number> = Object.fromEntries(
  wilayas.map((name, index) => [
    name,
    index < 4 ? 600 : index < 20 ? 800 : 1000,
  ])
);

type StoreOrder = {
  id?: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  wilaya: string;
  address: string;
  items: Array<{
    slug: string;
    nameAr: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function fromDbProduct(row: typeof products.$inferSelect): StoreProduct {
  return {
    id: row.id,
    slug: row.slug,
    nameAr: row.nameAr,
    nameEn: row.nameEn,
    category: row.category,
    subcategory: row.subcategory,
    price: row.price,
    compareAt: row.compareAt,
    stock: row.stock,
    badge: row.badge,
    description: row.description,
    images: parseJson<string[]>(row.images, []),
    features: parseJson<string[]>(row.features, []),
    featured: Boolean(row.featured),
  };
}

async function getProducts(): Promise<StoreProduct[]> {
  const db = await getDb();
  if (!db) return seedProducts;
  try {
    const rows = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));
    return rows.length ? rows.map(fromDbProduct) : seedProducts;
  } catch {
    return seedProducts;
  }
}

async function getDeliveryConfig() {
  const db = await getDb();
  if (!db)
    return {
      defaultFee: 800,
      freeAbove: 30000,
      fees: defaultFees,
      whatsappNumber: ENV.netlifyWhatsAppNumber,
    };
  try {
    const rows = await db
      .select()
      .from(deliverySettings)
      .where(eq(deliverySettings.id, 1))
      .limit(1);
    if (rows[0])
      return {
        defaultFee: rows[0].defaultFee,
        freeAbove: rows[0].freeAbove,
        fees: parseJson<Record<string, number>>(rows[0].fees, defaultFees),
        whatsappNumber:
          ENV.netlifyWhatsAppNumber || (rows[0].whatsappNumber ?? ""),
      };
  } catch {
    // Preview remains usable with defaults while the managed DB is provisioning.
  }
  return {
    defaultFee: 800,
    freeAbove: 30000,
    fees: defaultFees,
    whatsappNumber: ENV.netlifyWhatsAppNumber,
  };
}

function toPublicOrder(row: typeof orders.$inferSelect): StoreOrder {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    phone: row.phone,
    wilaya: row.wilaya,
    address: row.address,
    items: parseJson(row.items, []),
    subtotal: row.subtotal,
    deliveryFee: row.deliveryFee,
    total: row.total,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

function toCustomerTrackOrder(
  order: StoreOrder
): Omit<StoreOrder, "phone" | "address"> {
  const { phone: _phone, address: _address, ...safeOrder } = order;
  return safeOrder;
}

export const appRouter = router({
  system: router({
    health: publicProcedure.query(() => ({ ok: true, brand: "SIRAGE SPORT" })),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    adminAccess: publicProcedure.query(async ({ ctx }) => ({
      authenticated: ctx.isAdmin,
      method: ctx.adminAuth,
      passwordConfigured: await isPasswordConfigured(),
    })),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  adminAuth: router({
    login: publicProcedure
      .input(z.object({ password: z.string().min(12).max(200) }))
      .mutation(async ({ ctx, input }) => {
        const success = await loginWithPassword(
          ctx.req,
          ctx.res,
          input.password
        );
        if (!success)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "بيانات الدخول غير صحيحة أو لم يتم إعداد كلمة المرور بعد",
          });
        return { success: true } as const;
      }),
    setup: publicProcedure
      .input(
        z.object({
          token: z.string().min(20),
          password: z.string().min(12).max(200),
        })
      )
      .mutation(async ({ input }) => {
        const success = await completeClientSetup(input.token, input.password);
        if (!success)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "رابط التهيئة غير صالح أو منتهي الصلاحية",
          });
        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await logoutPassword(ctx.req, ctx.res);
      return { success: true } as const;
    }),
  }),
  catalog: router({
    list: publicProcedure
      .input(
        z.object({
          query: z.string().optional(),
          category: z.string().optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          sort: z
            .enum(["featured", "priceAsc", "priceDesc"])
            .default("featured"),
        })
      )
      .query(async ({ input }) => {
        let result = await getProducts();
        const q = input.query?.trim().toLowerCase();
        if (q)
          result = result.filter(product =>
            `${product.nameAr} ${product.nameEn ?? ""} ${product.category} ${product.subcategory ?? ""}`
              .toLowerCase()
              .includes(q)
          );
        if (input.category && input.category !== "الكل")
          result = result.filter(
            product => product.category === input.category
          );
        if (input.minPrice !== undefined)
          result = result.filter(product => product.price >= input.minPrice!);
        if (input.maxPrice !== undefined)
          result = result.filter(product => product.price <= input.maxPrice!);
        if (input.sort === "priceAsc") result.sort((a, b) => a.price - b.price);
        if (input.sort === "priceDesc")
          result.sort((a, b) => b.price - a.price);
        if (input.sort === "featured")
          result.sort((a, b) => Number(b.featured) - Number(a.featured));
        return result;
      }),
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = (await getProducts()).find(
          item => item.slug === input.slug
        );
        if (!product) throw new Error("المنتج غير موجود");
        return product;
      }),
    categories: publicProcedure.query(async () => {
      const result = await getProducts();
      return [
        "الكل",
        ...Array.from(new Set(result.map(product => product.category))),
      ];
    }),
  }),
  delivery: router({
    config: publicProcedure.query(async () => {
      const config = await getDeliveryConfig();
      return { ...config, wilayas };
    }),
  }),
  orders: router({
    create: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(2),
          phone: z.string().min(8),
          wilaya: z.string().min(2),
          address: z.string().min(5),
          items: z
            .array(
              z.object({
                slug: z.string(),
                nameAr: z.string(),
                price: z.number(),
                quantity: z.number().int().min(1),
                image: z.string(),
              })
            )
            .min(1),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const catalog = await getProducts();
        const validItems = input.items.map(item => {
          const catalogItem = catalog.find(
            product => product.slug === item.slug
          );
          return {
            ...item,
            price: catalogItem?.price ?? item.price,
            nameAr: catalogItem?.nameAr ?? item.nameAr,
            image: catalogItem?.images[0] ?? item.image,
          };
        });
        const subtotal = validItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const delivery = await getDeliveryConfig();
        const deliveryFee =
          subtotal >= delivery.freeAbove
            ? 0
            : (delivery.fees[input.wilaya] ?? delivery.defaultFee);
        const orderNumber = `SRG-${Date.now().toString(36).toUpperCase().slice(-7)}`;
        const createdAt = new Date().toISOString();
        const order: StoreOrder = {
          orderNumber,
          customerName: input.customerName,
          phone: input.phone,
          wilaya: input.wilaya,
          address: input.address,
          items: validItems,
          subtotal,
          deliveryFee,
          total: subtotal + deliveryFee,
          status: "pending",
          createdAt,
        };
        const db = await getDb();
        if (db) {
          try {
            await db.insert(orders).values({
              orderNumber,
              customerName: input.customerName,
              phone: input.phone,
              wilaya: input.wilaya,
              address: input.address,
              items: JSON.stringify(validItems),
              subtotal,
              deliveryFee,
              total: subtotal + deliveryFee,
              status: "pending",
              notes: input.notes,
            });
          } catch (error) {
            console.warn(
              "[Orders] Persist failed, retaining preview order:",
              error
            );
          }
        }
        memoryOrders.set(orderNumber, order);
        return order;
      }),
    track: publicProcedure
      .input(
        z.object({ orderNumber: z.string().min(4), phone: z.string().min(8) })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (db) {
          try {
            const rows = await db
              .select()
              .from(orders)
              .where(
                and(
                  eq(orders.orderNumber, input.orderNumber.toUpperCase()),
                  eq(orders.phone, input.phone)
                )
              )
              .limit(1);
            if (rows[0]) return toCustomerTrackOrder(toPublicOrder(rows[0]));
          } catch {
            // fall back to the in-process order created in preview
          }
        }
        const order = memoryOrders.get(input.orderNumber.toUpperCase());
        if (!order || order.phone !== input.phone)
          throw new Error("لم نعثر على طلب بهذه البيانات");
        return toCustomerTrackOrder(order);
      }),
  }),
  admin: router({
    products: adminProcedure.query(async () => getProducts()),
    orders: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return Array.from(memoryOrders.values()).reverse();
      try {
        const rows = await db
          .select()
          .from(orders)
          .orderBy(desc(orders.createdAt));
        return rows.map(toPublicOrder);
      } catch {
        return Array.from(memoryOrders.values()).reverse();
      }
    }),
    stats: adminProcedure.query(async () => {
      const [catalog, config] = await Promise.all([
        getProducts(),
        getDeliveryConfig(),
      ]);
      const db = await getDb();
      let orderCount = memoryOrders.size;
      let revenue = Array.from(memoryOrders.values()).reduce(
        (sum, order) => sum + order.total,
        0
      );
      if (db) {
        try {
          const rows = await db.select().from(orders);
          orderCount = rows.length;
          revenue = rows
            .filter(row => row.status !== "cancelled")
            .reduce((sum, row) => sum + row.total, 0);
        } catch {
          // retain memory values
        }
      }
      return {
        productCount: catalog.length,
        lowStock: catalog.filter(product => product.stock < 10).length,
        orderCount,
        revenue,
        config,
      };
    }),
    createClientSetup: adminProcedure.mutation(async () =>
      issueClientSetupToken()
    ),
    updateOrderStatus: adminProcedure
      .input(
        z.object({
          orderNumber: z.string(),
          status: z.enum([
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled",
          ]),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (db)
          await db
            .update(orders)
            .set({ status: input.status })
            .where(eq(orders.orderNumber, input.orderNumber));
        const cached = memoryOrders.get(input.orderNumber);
        if (cached)
          memoryOrders.set(input.orderNumber, {
            ...cached,
            status: input.status,
          });
        return { success: true };
      }),
    saveDelivery: adminProcedure
      .input(
        z.object({
          defaultFee: z.number().int().min(0),
          freeAbove: z.number().int().min(0),
          fees: z.record(z.string(), z.number().int().min(0)),
          whatsappNumber: z.string().max(32).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false, previewOnly: true };
        await db
          .insert(deliverySettings)
          .values({
            id: 1,
            defaultFee: input.defaultFee,
            freeAbove: input.freeAbove,
            fees: JSON.stringify(input.fees),
            whatsappNumber: input.whatsappNumber ?? null,
          })
          .onDuplicateKeyUpdate({
            set: {
              defaultFee: input.defaultFee,
              freeAbove: input.freeAbove,
              fees: JSON.stringify(input.fees),
              whatsappNumber: input.whatsappNumber ?? null,
            },
          });
        return { success: true };
      }),
    deleteProduct: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false, previewOnly: true };
        await db.delete(products).where(eq(products.id, input.id));
        return { success: true };
      }),
    saveProduct: adminProcedure
      .input(
        z.object({
          id: z.number().optional(),
          slug: z.string(),
          nameAr: z.string(),
          category: z.string(),
          price: z.number().int().min(0),
          stock: z.number().int().min(0),
          description: z.string(),
          images: z.array(z.string()),
          features: z.array(z.string()),
          badge: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false, previewOnly: true };
        const values = {
          slug: input.slug,
          nameAr: input.nameAr,
          nameEn: null,
          category: input.category,
          subcategory: null,
          price: input.price,
          compareAt: null,
          stock: input.stock,
          badge: input.badge ?? null,
          description: input.description,
          images: JSON.stringify(input.images),
          features: JSON.stringify(input.features),
          featured: 0,
        };
        if (input.id)
          await db
            .update(products)
            .set(values)
            .where(eq(products.id, input.id));
        else await db.insert(products).values(values);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
