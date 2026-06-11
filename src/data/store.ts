// Pure types and utility functions — no storage concerns here.

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  joinDate: string;
  phone: string;
  salary: number;
  permissions: {
    canAddEditInventory: boolean;
    canAddLogistics: boolean;
  };
}

export interface PriceTier {
  name: string;
  costPrice: number;
  sellingPrice: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  tiers: PriceTier[];
  totalStock: number;
  status: 'in-stock' | 'out-of-stock';
}

export interface LogisticsInventoryItem {
  productId: string;
  quantity: number;
  minStock: number;
}

export interface LogisticsCompany {
  id: string;
  name: string;
  phone: string;
  location: string;
  inventory: LogisticsInventoryItem[];
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  tierName: string;
}

export interface Order {
  id: string;
  serialNumber: number;
  customerName: string;
  phoneNumber: string;
  whatsappNumber: string;
  deliveryAddress: string;
  city: string;
  state: string;
  items: OrderItem[];
  dealType: 'retail' | 'wholesale' | 'dm' | 'custom';
  orderDate: string;
  expectedDeliveryDate: string;
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'uncommitted' | 'delivered';
  deliveryFee: number;
  logisticsCompanyId: string;
  logisticsLocation: string;
  actualDeliveryDate: string;
  followUpDate: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  amountPaid: number;
  totalAmount: number;
  totalCost: number;
  grossProfit: number;
  notes: string;
  createdBy: string;
  isReturnCustomer: boolean;
  previousOrderId: string | null;
  followUpStatus: 'pending' | 'reached' | 'responded' | 'good-feedback' | 'bad-feedback' | 'no-answer';
  followUpNotes: string;
  followUpContactedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'review' | 'done';
  dueDate: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'ceo' | 'staff';
  message: string;
  timestamp: string;
  channel: string;
  recipientId?: string;
  recipientName?: string;
  isDirectMessage: boolean;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
  submittedBy: string;
  receipt?: string;
}

// ─── Phone utilities ──────────────────────────────────────────────────────────

export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^0-9]/g, '');
  if (digits.startsWith('234') && digits.length > 10) digits = digits.slice(3);
  if (digits.startsWith('0') && digits.length > 9) digits = digits.slice(1);
  return digits;
}

export function phonesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  return normalizePhone(a) === normalizePhone(b);
}

export function orderMatchesPhone(order: Order, phone: string): boolean {
  const norm = normalizePhone(phone);
  if (!norm) return false;
  return normalizePhone(order.phoneNumber) === norm || normalizePhone(order.whatsappNumber) === norm;
}

// ─── Pure computation helpers (operate on data passed in, not from storage) ──

export function getNextOrderSerial(orders: Order[]): number {
  if (orders.length === 0) return 1;
  return Math.max(...orders.map(o => o.serialNumber)) + 1;
}

export function checkReturnCustomer(
  orders: Order[],
  phone: string,
  whatsapp?: string
): { isReturn: boolean; previousDelivered: number | null; previousUncommitted: boolean } {
  const phones = [phone, whatsapp].filter(Boolean) as string[];
  const customerOrders = orders.filter(o =>
    phones.some(p => orderMatchesPhone(o, p))
  );
  const delivered = customerOrders.find(o => o.orderStatus === 'delivered');
  const hasUncommitted = customerOrders.some(
    o => o.orderStatus === 'uncommitted' || o.orderStatus === 'pending'
  );
  return {
    isReturn: customerOrders.length > 0,
    previousDelivered: delivered ? delivered.serialNumber : null,
    previousUncommitted: hasUncommitted,
  };
}

export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString();
}

export function calculateExpectedRevenue(
  products: Product[],
  logistics: LogisticsCompany[],
  tierName: string
): number {
  let total = 0;
  logistics.forEach(loc => {
    loc.inventory.forEach(inv => {
      const product = products.find(p => p.id === inv.productId);
      if (product) {
        const tier = product.tiers.find(t => t.name === tierName);
        if (tier) total += tier.sellingPrice * inv.quantity;
      }
    });
  });
  return total;
}

export function getTotalStockValue(
  products: Product[],
  logistics: LogisticsCompany[]
): { totalUnits: number; costValue: number; retailValue: number; wholesaleValue: number } {
  let totalUnits = 0, costValue = 0, retailValue = 0, wholesaleValue = 0;
  logistics.forEach(loc => {
    loc.inventory.forEach(inv => {
      const product = products.find(p => p.id === inv.productId);
      if (product) {
        totalUnits += inv.quantity;
        const retailTier = product.tiers.find(t => t.name === 'Retail');
        const wholesaleTier = product.tiers.find(t => t.name === 'Wholesale');
        costValue += (product.tiers[0]?.costPrice || 0) * inv.quantity;
        retailValue += (retailTier?.sellingPrice || 0) * inv.quantity;
        wholesaleValue += (wholesaleTier?.sellingPrice || 0) * inv.quantity;
      }
    });
  });
  return { totalUnits, costValue, retailValue, wholesaleValue };
}

export type DateRange = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'infinite';

export function getDateRangeFilter(
  range: DateRange,
  customStart?: string,
  _customEnd?: string
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start: Date;
  switch (range) {
    case 'daily':
      start = new Date(now); start.setHours(0, 0, 0, 0); break;
    case 'weekly':
      start = new Date(now); start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0); break;
    case 'monthly':
      start = new Date(now); start.setMonth(now.getMonth() - 1); start.setHours(0, 0, 0, 0); break;
    case 'yearly':
      start = new Date(now); start.setFullYear(now.getFullYear() - 1); start.setHours(0, 0, 0, 0); break;
    case 'custom':
      start = customStart ? new Date(customStart) : new Date(0); break;
    default:
      start = new Date(0);
  }
  return { start, end };
}

export function calculateProfitLoss(
  orders: Order[],
  expenses: Expense[],
  range: DateRange,
  customStart?: string,
  customEnd?: string
) {
  const { start, end } = getDateRangeFilter(range, customStart, customEnd);
  const filteredOrders = orders.filter(o => {
    if (o.orderStatus !== 'delivered') return false;
    const date = new Date(o.actualDeliveryDate || o.orderDate);
    return date >= start && date <= end;
  });
  const filteredExpenses = expenses.filter(e => {
    if (e.status !== 'approved') return false;
    return new Date(e.date) >= start && new Date(e.date) <= end;
  });
  const totalRevenue = filteredOrders.reduce((s, o) => s + o.amountPaid, 0);
  const totalCost = filteredOrders.reduce((s, o) => s + o.totalCost, 0);
  const totalDeliveryFees = filteredOrders.reduce((s, o) => s + o.deliveryFee, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  return {
    totalRevenue,
    totalCost,
    totalDeliveryFees,
    totalExpenses,
    netProfit: totalRevenue - totalCost - totalDeliveryFees - totalExpenses,
    orderCount: filteredOrders.length,
    expenseCount: filteredExpenses.length,
  };
}
