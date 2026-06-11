import { useMemo, useState } from "react";
import { useBrand } from "../context/BrandContext";
import { useStore } from "../context/StoreContext";
import {
  formatNaira,
  getTotalStockValue,
  calculateProfitLoss,
  type DateRange,
  type Product,
} from "../data/store";
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Calendar,
  FileText,
} from "lucide-react";
import { exportPDF } from "../utils/export";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#4F46E5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

export default function Analytics() {
  const { brand } = useBrand();
  const { products, orders, logistics, expenses } = useStore();

  const [dateRange, setDateRange] = useState<DateRange>("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const stockStats = getTotalStockValue(products, logistics);

  const profitLoss = useMemo(
    () =>
      calculateProfitLoss(orders, expenses, dateRange, customStart, customEnd),
    [orders, expenses, dateRange, customStart, customEnd],
  );

  const getRetailPrice = (product: Product) =>
    product.tiers.find((t) => t.name === "Retail")?.sellingPrice || 0;

  const monthlyTrend = useMemo(() => {
    const byMonth: Record<
      string,
      { revenue: number; profit: number; expenses: number }
    > = {};
    orders
      .filter((o) => o.orderStatus === "delivered")
      .forEach((o) => {
        const month = (o.actualDeliveryDate || o.orderDate).slice(0, 7);
        if (!byMonth[month])
          byMonth[month] = { revenue: 0, profit: 0, expenses: 0 };
        byMonth[month].revenue += o.amountPaid;
        byMonth[month].profit += o.grossProfit;
      });
    expenses
      .filter((e) => e.status === "approved")
      .forEach((e) => {
        const month = e.date.slice(0, 7);
        if (!byMonth[month])
          byMonth[month] = { revenue: 0, profit: 0, expenses: 0 };
        byMonth[month].expenses += e.amount;
      });
    return Object.entries(byMonth)
      .sort()
      .slice(-12)
      .map(([month, data]) => ({ month: month.slice(5), ...data }));
  }, [orders, expenses]);

  const productPerformance = useMemo(() => {
    const byProduct: Record<string, { revenue: number; qty: number }> = {};
    orders
      .filter((o) => o.orderStatus === "delivered")
      .forEach((o) => {
        o.items.forEach((item) => {
          if (!byProduct[item.productName])
            byProduct[item.productName] = { revenue: 0, qty: 0 };
          byProduct[item.productName].revenue += item.unitPrice * item.quantity;
          byProduct[item.productName].qty += item.quantity;
        });
      });
    return Object.entries(byProduct)
      .map(([name, data]) => ({
        name: name.length > 15 ? name.slice(0, 15) + "…" : name,
        ...data,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const dealTypeBreakdown = useMemo(() => {
    const byType: Record<string, number> = {};
    orders
      .filter((o) => o.orderStatus === "delivered")
      .forEach((o) => {
        const dt = o.dealType || "retail";
        byType[dt] = (byType[dt] || 0) + o.amountPaid;
      });
    return Object.entries(byType).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [orders]);

  const categoryInventory = useMemo(() => {
    const byCategory: Record<string, { count: number; value: number }> = {};
    logistics.forEach((loc) => {
      loc.inventory.forEach((inv) => {
        const product = products.find((p) => p.id === inv.productId);
        if (product) {
          if (!byCategory[product.category])
            byCategory[product.category] = { count: 0, value: 0 };
          byCategory[product.category].count += inv.quantity;
          byCategory[product.category].value +=
            inv.quantity * getRetailPrice(product);
        }
      });
    });
    return Object.entries(byCategory).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [products, logistics]);

  const rangeLabels: { value: DateRange; label: string }[] = [
    { value: "daily", label: "Today" },
    { value: "weekly", label: "This Week" },
    { value: "monthly", label: "This Month" },
    { value: "yearly", label: "This Year" },
    { value: "infinite", label: "All Time" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          {rangeLabels.map((r) => (
            <button
              key={r.value}
              onClick={() => setDateRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateRange === r.value
                  ? "text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
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
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="input-field w-auto text-xs"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="input-field w-auto text-xs"
              />
            </div>
          )}
        </div>
        <button
          onClick={() => exportPDF("Analytics Report", "analytics-content")}
          className="btn-secondary text-xs flex items-center gap-1 shrink-0"
        >
          <FileText size={14} /> Export PDF
        </button>
      </div>

      <div id="analytics-content">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Revenue",
              value: formatNaira(profitLoss.totalRevenue),
              icon: <DollarSign size={20} />,
              color: "#10B981",
            },
            {
              label: "Total Cost",
              value: formatNaira(profitLoss.totalCost),
              icon: <ShoppingCart size={20} />,
              color: "#EF4444",
            },
            {
              label: "Delivery Fees",
              value: formatNaira(profitLoss.totalDeliveryFees),
              icon: <Package size={20} />,
              color: "#F59E0B",
            },
            {
              label: "Expenses",
              value: formatNaira(profitLoss.totalExpenses),
              icon: <ShoppingCart size={20} />,
              color: "#8B5CF6",
            },
            {
              label: "Net Profit",
              value: formatNaira(profitLoss.netProfit),
              icon: <TrendingUp size={20} />,
              color: profitLoss.netProfit >= 0 ? brand.primaryColor : "#EF4444",
            },
          ].map((kpi, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                  <p
                    className="text-xl font-bold mt-1"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                </div>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: kpi.color }}
                >
                  {kpi.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-400">
          Orders: {profitLoss.orderCount} | Expenses: {profitLoss.expenseCount}{" "}
          | Calculation: Revenue - Cost - Delivery Fees - Expenses = Net Profit
        </div>

        {/* Revenue Trend */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Revenue & Profit Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
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
              <Tooltip formatter={(value: any) => formatNaira(Number(value))} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={brand.primaryColor}
                fill="url(#gradRevenue)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#10B981"
                fill="url(#gradProfit)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Product Performance
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={productPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => formatNaira(Number(value))}
                />
                <Bar
                  dataKey="revenue"
                  fill={brand.primaryColor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Sales by Deal Type
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={dealTypeBreakdown}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {dealTypeBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatNaira(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Inventory Value
              </h3>
              <div className="space-y-3">
                {categoryInventory.map((cat, i) => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">{cat.name}</span>
                      <span className="font-medium">
                        {formatNaira(cat.value)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (cat.value / Math.max(...categoryInventory.map((c) => c.value))) * 100)}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Stock:</span>
                    <span className="font-semibold">
                      {stockStats.totalUnits.toLocaleString()} units
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
