import { useMemo, useState } from "react";
import { useBrand } from "../context/BrandContext";
import {
  formatNaira,
  getTotalStockValue,
  calculateProfitLoss,
  type LogisticsInventoryItem,
  type DateRange,
} from "../data/store";
import {
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { exportPDF } from "../utils/export";
import { useStore } from "@/context/StoreContext";

export default function Dashboard() {
  const { brand } = useBrand();
  const { products, orders, logistics, expenses } = useStore();

  const [dateRange, setDateRange] = useState<DateRange>("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const stockStats = useMemo(
    () => getTotalStockValue(products, logistics),
    [products, logistics],
  );

  const profitLoss = useMemo(
    () =>
      calculateProfitLoss(orders, expenses, dateRange, customStart, customEnd),
    [orders, expenses, dateRange, customStart, customEnd],
  );

  const lowStockAlerts = useMemo(() => {
    const alerts: {
      productName: string;
      location: string;
      quantity: number;
      minStock: number;
    }[] = [];
    logistics.forEach((loc) => {
      loc.inventory.forEach((inv: LogisticsInventoryItem) => {
        if (inv.minStock > 0 && inv.quantity <= inv.minStock) {
          const product = products.find((p) => p.id === inv.productId);
          if (product)
            alerts.push({
              productName: product.name,
              location: loc.location,
              quantity: inv.quantity,
              minStock: inv.minStock,
            });
        }
      });
    });
    return alerts;
  }, [logistics, products]);

  const revenueData = useMemo(() => {
    const byMonth: Record<string, { revenue: number; profit: number }> = {};
    orders
      .filter((o) => o.orderStatus === "delivered")
      .forEach((o) => {
        const month =
          o.actualDeliveryDate?.slice(0, 7) || o.orderDate.slice(0, 7);
        if (!byMonth[month]) byMonth[month] = { revenue: 0, profit: 0 };
        byMonth[month].revenue += o.amountPaid;
        byMonth[month].profit += o.grossProfit;
      });
    return Object.entries(byMonth)
      .sort()
      .slice(-6)
      .map(([month, data]) => ({ month: month.slice(5), ...data }));
  }, [orders]);

  const categoryData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    orders
      .filter((o) => o.orderStatus === "delivered")
      .forEach((o) => {
        o.items.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (product)
            byCategory[product.category] =
              (byCategory[product.category] || 0) +
              item.unitPrice * item.quantity;
        });
      });
    return Object.entries(byCategory).map(([name, sales]) => ({ name, sales }));
  }, [orders, products]);

  const rangeLabels: { value: DateRange; label: string }[] = [
    { value: "daily", label: "Today" },
    { value: "weekly", label: "Week" },
    { value: "monthly", label: "Month" },
    { value: "yearly", label: "Year" },
    { value: "infinite", label: "All" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-6">
      {/* Date Range + Download */}
      <div className="card p-4 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          {rangeLabels.map((r) => (
            <button
              key={r.value}
              onClick={() => setDateRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dateRange === r.value ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              style={
                dateRange === r.value
                  ? { backgroundColor: brand.primaryColor }
                  : {}
              }
            >
              {r.label}
            </button>
          ))}
          {dateRange === "custom" && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="input-field w-auto text-xs py-1"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="input-field w-auto text-xs py-1"
              />
            </div>
          )}
        </div>
        <button
          onClick={() => exportPDF("Dashboard Report", "dashboard-content")}
          className="btn-secondary text-xs flex items-center gap-1"
        >
          <FileText size={14} /> Export PDF
        </button>
      </div>

      <div id="dashboard-content">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            {
              title: "Revenue",
              value: formatNaira(profitLoss.totalRevenue),
              icon: <DollarSign size={20} />,
              color: "#10B981",
              change: `${profitLoss.orderCount} orders`,
            },
            {
              title: "Cost + Delivery",
              value: formatNaira(
                profitLoss.totalCost + profitLoss.totalDeliveryFees,
              ),
              icon: <ShoppingCart size={20} />,
              color: "#EF4444",
              change: "Cost of goods",
            },
            {
              title: "Expenses",
              value: formatNaira(profitLoss.totalExpenses),
              icon: <Package size={20} />,
              color: "#F59E0B",
              change: `${profitLoss.expenseCount} items`,
            },
            {
              title: "Net Profit",
              value: formatNaira(profitLoss.netProfit),
              icon: <TrendingUp size={20} />,
              color: profitLoss.netProfit >= 0 ? brand.primaryColor : "#EF4444",
              change: profitLoss.netProfit >= 0 ? "Positive" : "Loss",
            },
            {
              title: "Stock (Retail)",
              value: formatNaira(stockStats.retailValue),
              icon: <Package size={20} />,
              color: "#8B5CF6",
              change: `${stockStats.totalUnits} units`,
            },
          ].map((stat, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: stat.color }}
                >
                  {stat.icon}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {profitLoss.netProfit >= 0 && i === 3 ? (
                  <ArrowUpRight size={14} className="text-green-500" />
                ) : (
                  <ArrowDownRight size={14} className="text-amber-500" />
                )}
                <span className="text-xs text-gray-500">{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Revenue & Profit
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: brand.primaryColor }}
                  />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  Profit
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={brand.primaryColor}
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="95%"
                      stopColor={brand.primaryColor}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatNaira(Number(value)), ""]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={brand.primaryColor}
                  fill="url(#revGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  fill="none"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Sales by Category
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  width={90}
                />
                <Tooltip
                  formatter={(value: any) => [
                    formatNaira(Number(value)),
                    "Sales",
                  ]}
                />
                <Bar
                  dataKey="sales"
                  fill={brand.primaryColor}
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Recent Orders
            </h3>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{order.serialNumber} - {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.city}, {order.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatNaira(order.totalAmount)}
                    </p>
                    <span
                      className={`badge text-[10px] ${order.orderStatus === "delivered" ? "bg-green-50 text-green-700" : order.orderStatus === "pending" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-500" />
              <h3 className="text-base font-semibold text-gray-900">
                Stock Alerts
              </h3>
              <span className="text-xs text-gray-400">
                ({lowStockAlerts.length})
              </span>
            </div>
            <div className="space-y-3">
              {lowStockAlerts.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  All stock levels healthy! ✅
                </p>
              ) : (
                lowStockAlerts.slice(0, 5).map((alert, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${alert.quantity === 0 ? "bg-red-500" : "bg-amber-500"}`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {alert.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {alert.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${alert.quantity === 0 ? "text-red-600" : "text-amber-600"}`}
                      >
                        {alert.quantity}
                      </p>
                      <p className="text-xs text-gray-400">
                        min: {alert.minStock}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
