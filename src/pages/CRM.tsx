import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useBrand } from "../context/BrandContext";
import { useStore } from "../context/StoreContext";
import {
  type Order,
  formatNaira,
  orderMatchesPhone,
  getNextOrderSerial,
} from "../data/store";
import {
  Plus,
  Search,
  X,
  Phone,
  MessageCircle,
  Edit2,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Package,
  Trash2,
  UserCheck,
  AlertCircle,
  Download,
  FileText,
} from "lucide-react";
import { exportCSV, exportOrdersPDF } from "../utils/export";

const dealTypeLabels: Record<string, string> = {
  retail: "Retail",
  wholesale: "Wholesale",
  dm: "DM/Group",
  custom: "Custom",
};
const orderStatusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  uncommitted: "bg-gray-100 text-gray-600",
  delivered: "bg-green-50 text-green-700",
};
const paymentStatusColors: Record<string, string> = {
  unpaid: "bg-red-50 text-red-700",
  partial: "bg-amber-50 text-amber-700",
  paid: "bg-green-50 text-green-700",
};

export default function CRM() {
  const { user } = useAuth();
  const { brand } = useBrand();
  const isCEO = user?.role === "ceo";

  const {
    orders: allOrders,
    products,
    logistics,
    addOrder,
    updateOrder,
    deleteOrder: deleteOrderFromStore,
    setOrders,
    setLogistics,
  } = useStore();

  // Staff only see their own orders; CEO sees all — derived, not local state
  const orders = isCEO
    ? allOrders
    : allOrders.filter((o) => o.createdBy === user?.name);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Order>>({});
  const [deliveryForm, setDeliveryForm] = useState({
    deliveryFee: 0,
    logisticsCompanyId: "",
    actualDeliveryDate: "",
  });
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] =
    useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<Order["items"]>([]);
  const [selectedTier, setSelectedTier] = useState<string>("Retail");

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.phoneNumber.includes(search) ||
      o.city.toLowerCase().includes(search.toLowerCase()) ||
      String(o.serialNumber).includes(search);
    const matchStatus =
      statusFilter === "all" ||
      o.orderStatus === statusFilter ||
      o.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.orderStatus === "pending").length;
    const delivered = orders.filter(
      (o) => o.orderStatus === "delivered",
    ).length;
    const revenue = orders
      .filter((o) => o.orderStatus === "delivered")
      .reduce((s, o) => s + o.amountPaid, 0);
    const profit = orders
      .filter((o) => o.orderStatus === "delivered")
      .reduce((s, o) => s + o.grossProfit, 0);
    const today = new Date();
    const followUps = orders.filter((o) => {
      if (!o.followUpDate) return false;
      return new Date(o.followUpDate) <= today;
    }).length;
    return { total, pending, delivered, revenue, profit, followUps };
  }, [orders]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      dealType: "retail",
      orderStatus: "pending",
      paymentStatus: "unpaid",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: "",
      deliveryFee: 0,
      amountPaid: 0,
      notes: "",
    });
    setOrderItems([]);
    setSelectedTier("Retail");
    setShowModal(true);
  };

  const openEdit = (order: Order) => {
    setEditing(order);
    setForm({ ...order });
    setOrderItems([...order.items]);
    setShowModal(true);
  };

  const openDeliveryModal = (order: Order) => {
    setSelectedOrderForDelivery(order);
    setDeliveryForm({
      deliveryFee: order.deliveryFee || 0,
      logisticsCompanyId: order.logisticsCompanyId || "",
      actualDeliveryDate:
        order.actualDeliveryDate || new Date().toISOString().split("T")[0],
    });
    setShowDeliveryModal(true);
  };

  const addItem = () => {
    if (products.length === 0) return;
    const prod = products[0];
    const tier =
      prod.tiers.find((t) => t.name === selectedTier) || prod.tiers[0];
    setOrderItems([
      ...orderItems,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: 1,
        unitPrice: tier.sellingPrice,
        costPrice: tier.costPrice,
        tierName: tier.name,
      },
    ]);
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...orderItems];
    if (field === "productId") {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        const tier =
          prod.tiers.find((t) => t.name === selectedTier) || prod.tiers[0];
        updated[idx] = {
          ...updated[idx],
          productId: value,
          productName: prod.name,
          unitPrice: tier.sellingPrice,
          costPrice: tier.costPrice,
          tierName: tier.name,
        };
      }
    } else if (field === "tierName") {
      const prod = products.find((p) => p.id === updated[idx].productId);
      if (prod) {
        const tier = prod.tiers.find((t) => t.name === value) || prod.tiers[0];
        updated[idx] = {
          ...updated[idx],
          tierName: value,
          unitPrice: tier.sellingPrice,
          costPrice: tier.costPrice,
        };
      }
    } else {
      (updated[idx] as any)[field] = value;
    }
    setOrderItems(updated);
  };

  const removeItem = (idx: number) =>
    setOrderItems(orderItems.filter((_, i) => i !== idx));

  const calculateTotals = () => ({
    totalAmount: orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    totalCost: orderItems.reduce((s, i) => s + i.costPrice * i.quantity, 0),
  });

  const checkCustomer = (phone: string, whatsapp?: string) => {
    if (!phone && !whatsapp) return null;
    const phones = [phone, whatsapp].filter(Boolean) as string[];
    // Match against the full unfiltered list
    const matched = allOrders.filter((o) =>
      phones.some((p) => orderMatchesPhone(o, p)),
    );
    if (matched.length === 0) return null;
    const delivered = matched.find((o) => o.orderStatus === "delivered");
    const hasUnconverted = matched.some(
      (o) => o.orderStatus === "uncommitted" || o.orderStatus === "pending",
    );
    if (delivered)
      return { type: "return" as const, prevOrder: delivered.serialNumber };
    if (hasUnconverted)
      return { type: "uncommitted" as const, prevOrder: null };
    return { type: "existing" as const, prevOrder: null };
  };

  const save = async () => {
    if (!form.customerName || !form.phoneNumber || orderItems.length === 0)
      return;
    const { totalAmount, totalCost } = calculateTotals();
    const amountPaid = form.amountPaid || 0;
    const customerInfo = checkCustomer(
      form.phoneNumber || "",
      form.whatsappNumber || "",
    );

    if (editing) {
      await updateOrder(editing.id, {
        ...form,
        items: orderItems,
        totalAmount,
        totalCost,
        grossProfit:
          editing.orderStatus === "delivered"
            ? amountPaid - totalCost - (form.deliveryFee || 0)
            : 0,
      });
    } else {
      const newOrder: Order = {
        id: Date.now().toString(),
        serialNumber: getNextOrderSerial(allOrders),
        customerName: form.customerName || "",
        phoneNumber: form.phoneNumber || "",
        whatsappNumber: form.whatsappNumber || form.phoneNumber || "",
        deliveryAddress: form.deliveryAddress || "",
        city: form.city || "",
        state: form.state || "",
        items: orderItems,
        dealType: (form.dealType as Order["dealType"]) || "retail",
        orderDate: form.orderDate || "",
        expectedDeliveryDate: form.expectedDeliveryDate || "",
        orderStatus: "pending",
        deliveryFee: 0,
        logisticsCompanyId: "",
        logisticsLocation: "",
        actualDeliveryDate: "",
        followUpDate: "",
        paymentStatus:
          (form.paymentStatus as Order["paymentStatus"]) || "unpaid",
        amountPaid,
        totalAmount,
        totalCost,
        grossProfit: 0,
        notes: form.notes || "",
        createdBy: user?.name || "",
        isReturnCustomer: customerInfo?.type === "return",
        previousOrderId: customerInfo?.prevOrder
          ? String(customerInfo.prevOrder)
          : null,
        followUpStatus: "pending",
        followUpNotes: "",
        followUpContactedAt: "",
      };
      await addOrder(newOrder);
    }
    setShowModal(false);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this order? This action cannot be undone.",
      )
    )
      return;
    await deleteOrderFromStore(orderId);
  };

  const markAsDelivered = async () => {
    if (
      !selectedOrderForDelivery ||
      !deliveryForm.logisticsCompanyId ||
      !deliveryForm.actualDeliveryDate
    )
      return;

    const loc = logistics.find((l) => l.id === deliveryForm.logisticsCompanyId);
    const followUpDate = new Date(deliveryForm.actualDeliveryDate);
    followUpDate.setDate(followUpDate.getDate() + 30);

    const order = selectedOrderForDelivery;

    // Deduct inventory from the logistics location
    const updatedLogistics = logistics.map((l) => {
      if (l.id !== deliveryForm.logisticsCompanyId) return l;
      return {
        ...l,
        inventory: l.inventory.map((inv) => {
          const orderItem = order.items.find(
            (i) => i.productId === inv.productId,
          );
          if (orderItem)
            return {
              ...inv,
              quantity: Math.max(0, inv.quantity - orderItem.quantity),
            };
          return inv;
        }),
      };
    });
    await setLogistics(updatedLogistics);

    const grossProfit =
      order.amountPaid - order.totalCost - deliveryForm.deliveryFee;

    await updateOrder(order.id, {
      orderStatus: "delivered",
      deliveryFee: deliveryForm.deliveryFee,
      logisticsCompanyId: deliveryForm.logisticsCompanyId,
      logisticsLocation: loc?.location || "",
      actualDeliveryDate: deliveryForm.actualDeliveryDate,
      followUpDate: followUpDate.toISOString().split("T")[0],
      grossProfit,
    });

    setShowDeliveryModal(false);
  };

  const updateOrderStatus = async (
    orderId: string,
    status: Order["orderStatus"],
  ) => {
    if (status === "delivered" && !isCEO) {
      alert("Only CEO can mark orders as delivered");
      return;
    }
    if (status === "delivered") {
      const order = orders.find((o) => o.id === orderId);
      if (order) openDeliveryModal(order);
      return;
    }
    await updateOrder(orderId, { orderStatus: status });
  };

  const openWhatsApp = (number: string) =>
    window.open(`https://wa.me/${number.replace(/[^0-9]/g, "")}`, "_blank");
  const callCustomer = (number: string) =>
    window.open(`tel:${number}`, "_self");

  const getTotalItems = (order: Order) =>
    order.items.reduce((sum, item) => sum + item.quantity, 0);

  const getProductsSummary = (order: Order) => {
    if (order.items.length === 0) return "No items";
    if (order.items.length === 1)
      return `${order.items[0].productName} (${order.items[0].quantity})`;
    return `${order.items[0].productName} +${order.items.length - 1} more`;
  };

  const customerInfo =
    form.phoneNumber || form.whatsappNumber
      ? checkCustomer(form.phoneNumber || "", form.whatsappNumber || "")
      : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { v: stats.total, l: "Total", c: "text-gray-900" },
          { v: stats.pending, l: "Pending", c: "text-amber-600" },
          { v: stats.delivered, l: "Delivered", c: "text-green-600" },
          { v: formatNaira(stats.revenue), l: "Revenue", c: "text-blue-600" },
          { v: formatNaira(stats.profit), l: "Profit", c: "text-purple-600" },
          { v: stats.followUps, l: "Follow-ups", c: "text-red-600" },
        ].map((s, i) => (
          <div key={i} className="card p-3 text-center">
            <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
            <p className="text-[10px] text-gray-500">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3 max-w-lg">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="input-field pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="uncommitted">Uncommitted</option>
            <option value="delivered">Delivered</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {isCEO && (
            <>
              <button
                onClick={() => exportCSV(filtered, "orders")}
                className="btn-secondary text-xs flex items-center gap-1"
                title="Download CSV"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={() => exportOrdersPDF(filtered, "Orders Report")}
                className="btn-secondary text-xs flex items-center gap-1"
                title="Download PDF"
              >
                <FileText size={14} /> PDF
              </button>
            </>
          )}
          <button
            onClick={openAdd}
            className="btn-primary flex items-center gap-2"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <Plus size={16} /> New Order
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((order) => (
          <div key={order.id} className="card overflow-hidden">
            <div
              className="p-4 flex items-start gap-3 cursor-pointer"
              onClick={() =>
                setExpandedId(expandedId === order.id ? null : order.id)
              }
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: brand.primaryColor }}
              >
                #{order.serialNumber}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {order.customerName}
                  </h4>
                  {(() => {
                    // Use allOrders (already in scope) — no dataStore call needed
                    const others = allOrders.filter(
                      (o) =>
                        o.id !== order.id &&
                        (orderMatchesPhone(o, order.phoneNumber) ||
                          (order.whatsappNumber &&
                            orderMatchesPhone(o, order.whatsappNumber))),
                    );
                    const prevDelivered = others.find(
                      (o) => o.orderStatus === "delivered",
                    );
                    const prevUnconverted = others.some(
                      (o) =>
                        o.orderStatus === "uncommitted" ||
                        o.orderStatus === "pending",
                    );
                    if (prevDelivered)
                      return (
                        <span className="badge text-[10px] bg-green-100 text-green-700 flex items-center gap-1">
                          <UserCheck size={10} /> Return Customer (#
                          {prevDelivered.serialNumber})
                        </span>
                      );
                    if (prevUnconverted)
                      return (
                        <span className="badge text-[10px] bg-orange-100 text-orange-700 flex items-center gap-1">
                          <AlertCircle size={10} /> Previous unconverted
                        </span>
                      );
                    return null;
                  })()}
                  <span
                    className={`badge text-[10px] ${orderStatusColors[order.orderStatus]}`}
                  >
                    {order.orderStatus}
                  </span>
                  <span
                    className={`badge text-[10px] ${paymentStatusColors[order.paymentStatus]}`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {order.city}, {order.state} •{" "}
                  {dealTypeLabels[order.dealType] || order.dealType} •{" "}
                  {order.orderDate}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Package size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-600 font-medium">
                    {getProductsSummary(order)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    ({getTotalItems(order)} items)
                  </span>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">
                  {formatNaira(order.totalAmount)}
                </p>
                <p className="text-xs text-gray-500">
                  Paid: {formatNaira(order.amountPaid)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    callCustomer(order.phoneNumber);
                  }}
                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                  title="Call"
                >
                  <Phone size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openWhatsApp(order.whatsappNumber);
                  }}
                  className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"
                  title="WhatsApp"
                >
                  <MessageCircle size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(order);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                {isCEO && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOrder(order.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                {expandedId === order.id ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </div>
            </div>

            {expandedId === order.id && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                  <div>
                    <p className="text-gray-400">Phone</p>
                    <button
                      onClick={() => callCustomer(order.phoneNumber)}
                      className="text-blue-600 flex items-center gap-1 hover:underline"
                    >
                      <Phone size={10} /> {order.phoneNumber}
                    </button>
                  </div>
                  <div>
                    <p className="text-gray-400">WhatsApp</p>
                    <button
                      onClick={() => openWhatsApp(order.whatsappNumber)}
                      className="text-green-600 flex items-center gap-1 hover:underline"
                    >
                      <MessageCircle size={10} /> {order.whatsappNumber}
                    </button>
                  </div>
                  <div>
                    <p className="text-gray-400">Address</p>
                    <p className="text-gray-700 flex items-center gap-1">
                      <MapPin size={10} /> {order.deliveryAddress}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Expected Delivery</p>
                    <p className="text-gray-700 flex items-center gap-1">
                      <Calendar size={10} />{" "}
                      {order.expectedDeliveryDate || "Not set"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <Package size={12} /> Order Items ({order.items.length}{" "}
                    products, {getTotalItems(order)} units)
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <div>
                          <span className="font-medium text-gray-900">
                            {item.productName}
                          </span>
                          <span className="text-gray-500">
                            {" "}
                            × {item.quantity}
                          </span>
                          <span className="text-gray-400 ml-1">
                            ({item.tierName})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-gray-900">
                            {formatNaira(item.unitPrice * item.quantity)}
                          </span>
                          <span className="text-gray-400 ml-2">
                            Cost: {formatNaira(item.costPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium">
                          {formatNaira(order.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Total Cost</span>
                        <span className="text-gray-600">
                          {formatNaira(order.totalCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {order.orderStatus === "delivered" && (
                  <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400">Delivery Fee</p>
                      <p className="text-gray-700">
                        {formatNaira(order.deliveryFee)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Delivered From</p>
                      <p className="text-gray-700">
                        {order.logisticsLocation || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Actual Delivery</p>
                      <p className="text-gray-700">
                        {order.actualDeliveryDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Follow-up</p>
                      <p
                        className={`font-medium ${new Date(order.followUpDate) <= new Date() ? "text-red-600" : "text-gray-700"}`}
                      >
                        {order.followUpDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Net Profit</p>
                      <p
                        className={`font-bold ${order.grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatNaira(order.grossProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Calculation</p>
                      <p className="text-[10px] text-gray-500">
                        {formatNaira(order.amountPaid)} -{" "}
                        {formatNaira(order.totalCost)} -{" "}
                        {formatNaira(order.deliveryFee)}
                      </p>
                    </div>
                  </div>
                )}

                {order.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400">Notes</p>
                    <p className="text-xs text-gray-600">{order.notes}</p>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-2">
                  <select
                    value={order.orderStatus}
                    onChange={(e) =>
                      updateOrderStatus(
                        order.id,
                        e.target.value as Order["orderStatus"],
                      )
                    }
                    className="input-field text-xs py-1 w-auto"
                    disabled={order.orderStatus === "delivered"}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="uncommitted">Uncommitted</option>
                    <option value="delivered" disabled={!isCEO}>
                      Delivered (CEO only)
                    </option>
                  </select>
                  <span className="text-xs text-gray-400 self-center">
                    by: {order.createdBy}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-8 text-center">
          <Package size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">No orders found.</p>
        </div>
      )}

      {/* Order Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-gray-900">
                {editing ? "Edit Order" : "New Order"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    className="input-field"
                    value={form.customerName || ""}
                    onChange={(e) =>
                      setForm({ ...form, customerName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    className="input-field"
                    value={form.phoneNumber || ""}
                    onChange={(e) =>
                      setForm({ ...form, phoneNumber: e.target.value })
                    }
                    placeholder="+234"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    className="input-field"
                    value={form.whatsappNumber || ""}
                    onChange={(e) =>
                      setForm({ ...form, whatsappNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Deal Type *
                  </label>
                  <select
                    className="input-field"
                    value={form.dealType || "retail"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dealType: e.target.value as Order["dealType"],
                      })
                    }
                  >
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="dm">DM/Group</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              {customerInfo && (
                <div
                  className={`rounded-lg p-3 text-xs ${customerInfo.type === "return" ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"}`}
                >
                  {customerInfo.type === "return" ? (
                    <p className="text-green-700 flex items-center gap-1">
                      <UserCheck size={14} />{" "}
                      <strong>Returning Customer!</strong> Previously delivered
                      Order #{customerInfo.prevOrder}
                    </p>
                  ) : (
                    <p className="text-orange-700 flex items-center gap-1">
                      <AlertCircle size={14} />{" "}
                      <strong>Previous unconverted order!</strong> This customer
                      had an order that wasn't delivered.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    className="input-field"
                    value={form.deliveryAddress || ""}
                    onChange={(e) =>
                      setForm({ ...form, deliveryAddress: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    className="input-field"
                    value={form.city || ""}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    className="input-field"
                    value={form.state || ""}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Order Date
                  </label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.orderDate || ""}
                    onChange={(e) =>
                      setForm({ ...form, orderDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Expected Delivery
                  </label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.expectedDeliveryDate || ""}
                    onChange={(e) =>
                      setForm({ ...form, expectedDeliveryDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Order Items
                  </h4>
                  <div className="flex items-center gap-2">
                    <select
                      className="input-field text-xs py-1 w-auto"
                      value={selectedTier}
                      onChange={(e) => setSelectedTier(e.target.value)}
                    >
                      {products.length > 0 &&
                        products[0].tiers.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={addItem}
                      className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                </div>
                {orderItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No items added yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item, idx) => {
                      const prod = products.find(
                        (p) => p.id === item.productId,
                      );
                      return (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <select
                              className="input-field flex-1 text-xs"
                              value={item.productId}
                              onChange={(e) =>
                                updateItem(idx, "productId", e.target.value)
                              }
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            <select
                              className="input-field w-24 text-xs"
                              value={item.tierName}
                              onChange={(e) =>
                                updateItem(idx, "tierName", e.target.value)
                              }
                            >
                              {prod?.tiers.map((t) => (
                                <option key={t.name} value={t.name}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              className="input-field w-16 text-xs"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                              min={1}
                            />
                            <button
                              onClick={() => removeItem(idx)}
                              className="text-red-500 p-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          {!isCEO && (
                            <div className="flex justify-end mt-1 text-[10px] text-gray-400">
                              {formatNaira(item.unitPrice * item.quantity)}
                            </div>
                          )}
                          {isCEO && (
                            <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                              <span>
                                Cost: {formatNaira(item.costPrice)} ×{" "}
                                {item.quantity} ={" "}
                                {formatNaira(item.costPrice * item.quantity)}
                              </span>
                              <span>
                                Sell: {formatNaira(item.unitPrice)} ×{" "}
                                {item.quantity} ={" "}
                                {formatNaira(item.unitPrice * item.quantity)}
                              </span>
                              <span className="text-green-600 font-medium">
                                Profit:{" "}
                                {formatNaira(
                                  (item.unitPrice - item.costPrice) *
                                    item.quantity,
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {isCEO && (
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Total Cost:</span>
                          <span>
                            {formatNaira(calculateTotals().totalCost)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Total Amount:</span>
                          <span className="font-semibold">
                            {formatNaira(calculateTotals().totalAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold text-green-600">
                          <span>Expected Profit:</span>
                          <span>
                            {formatNaira(
                              calculateTotals().totalAmount -
                                calculateTotals().totalCost,
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    className="input-field"
                    value={form.paymentStatus || "unpaid"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        paymentStatus: e.target.value as Order["paymentStatus"],
                      })
                    }
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount Paid (₦)
                  </label>
                  <input
                    className="input-field"
                    type="number"
                    value={form.amountPaid || ""}
                    onChange={(e) =>
                      setForm({ ...form, amountPaid: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="btn-primary flex-1"
                style={{ backgroundColor: brand.primaryColor }}
              >
                {editing ? "Update" : "Create"} Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && selectedOrderForDelivery && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeliveryModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900">Mark as Delivered</h3>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-900">
                  Order #{selectedOrderForDelivery.serialNumber}
                </p>
                <p className="text-gray-600">
                  {selectedOrderForDelivery.customerName}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Total: {formatNaira(selectedOrderForDelivery.totalAmount)} |
                  Paid: {formatNaira(selectedOrderForDelivery.amountPaid)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Delivery Fee (₦)
                </label>
                <input
                  className="input-field"
                  type="number"
                  value={deliveryForm.deliveryFee}
                  onChange={(e) =>
                    setDeliveryForm({
                      ...deliveryForm,
                      deliveryFee: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Delivered From (Logistics Location) *
                </label>
                <select
                  className="input-field"
                  value={deliveryForm.logisticsCompanyId}
                  onChange={(e) =>
                    setDeliveryForm({
                      ...deliveryForm,
                      logisticsCompanyId: e.target.value,
                    })
                  }
                >
                  <option value="">Select location...</option>
                  {logistics.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} - {l.location}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Inventory will be deducted from this location
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Actual Delivery Date *
                </label>
                <input
                  className="input-field"
                  type="date"
                  value={deliveryForm.actualDeliveryDate}
                  onChange={(e) =>
                    setDeliveryForm({
                      ...deliveryForm,
                      actualDeliveryDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs">
                  <strong>Net Profit Calculation:</strong>
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {formatNaira(selectedOrderForDelivery.amountPaid)} -{" "}
                  {formatNaira(selectedOrderForDelivery.totalCost)} (Cost) -{" "}
                  {formatNaira(deliveryForm.deliveryFee)} (Delivery Fee)
                </p>
                <p className="text-sm font-bold text-green-700 mt-1">
                  ={" "}
                  {formatNaira(
                    selectedOrderForDelivery.amountPaid -
                      selectedOrderForDelivery.totalCost -
                      deliveryForm.deliveryFee,
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={markAsDelivered}
                className="btn-primary flex-1 bg-green-600 hover:bg-green-700"
              >
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
