import { formatDZD } from "./cart";

type ConfirmedOrder = {
  orderNumber: string;
  customerName: string;
  wilaya: string;
  total: number;
  items: Array<{ nameAr: string; quantity: number }>;
};

export function normalizeAlgerianWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("213")) return digits;
  return `213${digits.replace(/^0/, "")}`;
}

export function buildWhatsAppConfirmationUrl(
  number: string,
  order: ConfirmedOrder
) {
  const cleanNumber = number.replace(/\D/g, "");
  if (!cleanNumber) return "";
  const message = [
    "السلام عليكم، أريد تأكيد طلبي من SIRAGE SPORT",
    `رقم الطلب: ${order.orderNumber}`,
    `الاسم: ${order.customerName}`,
    `الولاية: ${order.wilaya}`,
    `الإجمالي: ${formatDZD(order.total)}`,
    `المنتجات: ${order.items.map(item => `${item.nameAr} × ${item.quantity}`).join("، ")}`,
  ].join("\n");
  return `https://wa.me/${normalizeAlgerianWhatsApp(cleanNumber)}?text=${encodeURIComponent(message)}`;
}
