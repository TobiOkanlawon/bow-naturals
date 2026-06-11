import { useState, useMemo } from "react";
import { useBrand } from "../context/BrandContext";
import { useStore } from "../context/StoreContext";
import {
  formatNaira,
  type DateRange,
  type Order,
  type Expense,
} from "../data/store";
import {
  Calendar,
  FileText,
  ShoppingCart,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { exportPDF } from "../utils/export";

interface DaySummary {
  date: string;
  label: string;
  ordersIn: number;
  delivered: number;
  confirmed: number;
  pending: number;
  shipped: number;
  uncommitted: number;
  revenue: number;
  cost: number;
  deliveryFees: number;
  profit: number;
  expenses: number;
  marketingExpenses: number;
  netProfit: number;
}

function getDaysInRange(
  range: DateRange,
  customStart?: string,
  customEnd?: string,
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start: Date;
  switch (range) {
    case "daily":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case "yearly":
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "custom":
      start = customStart ? new Date(customStart) : new Date(now);
      start.setHours(0, 0, 0, 0);
      if (customEnd) {
        end.setTime(new Date(customEnd).getTime());
        end.setHours(23, 59, 59, 999);
      }
      break;
    case "infinite":
    default:
      start = new Date(0);
      break;
  }
  return { start, end };
}

function buildDailySummaries(
  orders: Order[],
  expenses: Expense[],
  range: DateRange,
  customStart?: string,
  customEnd?: string,
): DaySummary[] {
  const { start, end } = getDaysInRange(range, customStart, customEnd);
  const dateMap: Record<string, DaySummary> = {};

  const ensureDate = (dateStr: string) => {
    if (!dateMap[dateStr]) {
      dateMap[dateStr] = {
        date: dateStr,
        label: "",
        ordersIn: 0,
        delivered: 0,
        confirmed: 0,
        pending: 0,
        shipped: 0,
        uncommitted: 0,
        revenue: 0,
        cost: 0,
        deliveryFees: 0,
        profit: 0,
        expenses: 0,
        marketingExpenses: 0,
        netProfit: 0,
      };
    }
    return dateMap[dateStr];
  };

  orders.forEach((o) => {
    const orderDate = new Date(o.orderDate);
    if (orderDate < start || orderDate > end) return;
    const day = ensureDate(o.orderDate);
    day.ordersIn++;
    if (o.orderStatus === "pending") day.pending++;
    if (o.orderStatus === "confirmed") day.confirmed++;
    if (o.orderStatus === "shipped") day.shipped++;
    if (o.orderStatus === "uncommitted") day.uncommitted++;
  });

  orders
    .filter((o) => o.orderStatus === "delivered" && o.actualDeliveryDate)
    .forEach((o) => {
      const delivDate = new Date(o.actualDeliveryDate);
      if (delivDate < start || delivDate > end) return;
      const day = ensureDate(o.actualDeliveryDate);
      day.delivered++;
      day.revenue += o.amountPaid;
      day.cost += o.totalCost;
      day.deliveryFees += o.deliveryFee;
      day.profit += o.grossProfit;
    });

  expenses
    .filter((e) => e.status === "approved")
    .forEach((e) => {
      const eDate = new Date(e.date);
      if (eDate < start || eDate > end) return;
      const day = ensureDate(e.date);
      day.expenses += e.amount;
      if (e.category === "Marketing") day.marketingExpenses += e.amount;
    });

  Object.values(dateMap).forEach((day) => {
    day.netProfit = day.profit - day.expenses;
    const d = new Date(day.date);
    day.label = d.toLocaleDateString("en-NG", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  });

  return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
}

export default function SalesTracker() {
  const { brand } = useBrand();
  const { orders, expenses } = useStore();

  const [dateRange, setDateRange] = useState<DateRange>("weekly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const dailySummaries = useMemo(
    () =>
      buildDailySummaries(orders, expenses, dateRange, customStart, customEnd),
    [orders, expenses, dateRange, customStart, customEnd],
  );

  const totals = useMemo(
    () => ({
      ordersIn: dailySummaries.reduce((s, d) => s + d.ordersIn, 0),
      delivered: dailySummaries.reduce((s, d) => s + d.delivered, 0),
      pending: dailySummaries.reduce((s, d) => s + d.pending, 0),
      confirmed: dailySummaries.reduce((s, d) => s + d.confirmed, 0),
      shipped: dailySummaries.reduce((s, d) => s + d.shipped, 0),
      uncommitted: dailySummaries.reduce((s, d) => s + d.uncommitted, 0),
      revenue: dailySummaries.reduce((s, d) => s + d.revenue, 0),
      cost: dailySummaries.reduce((s, d) => s + d.cost, 0),
      deliveryFees: dailySummaries.reduce((s, d) => s + d.deliveryFees, 0),
      profit: dailySummaries.reduce((s, d) => s + d.profit, 0),
      expenses: dailySummaries.reduce((s, d) => s + d.expenses, 0),
      marketing: dailySummaries.reduce((s, d) => s + d.marketingExpenses, 0),
      netProfit: dailySummaries.reduce((s, d) => s + d.netProfit, 0),
    }),
    [dailySummaries],
  );

  const chartData = dailySummaries.map((d) => ({
    name: d.date.slice(5),
    orders: d.ordersIn,
    delivered: d.delivered,
    revenue: d.revenue,
    profit: d.netProfit,
  }));

  const rangeLabels: { value: DateRange; label: string }[] = [
    { value: "daily", label: "Today" },
    { value: "weekly", label: "Last 7 Days" },
    { value: "monthly", label: "Last 30 Days" },
    { value: "yearly", label: "This Year" },
    { value: "infinite", label: "All Time" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-4">
      {/* Date Range + Export */}
      <div className="card p-4 flex flex-wrap items-center gap-2 justify-between">
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
          onClick={() =>
            exportPDF("Sales Tracker Report", "sales-tracker-content")
          }
          className="btn-secondary text-xs flex items-center gap-1"
        >
          <FileText size={14} /> Export PDF
        </button>
      </div>

      <div id="sales-tracker-content">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
          {[
            {
              label: "Orders In",
              value: totals.ordersIn,
              icon: <ShoppingCart size={16} />,
              color: brand.primaryColor,
            },
            {
              label: "Delivered",
              value: totals.delivered,
              icon: <CheckCircle size={16} />,
              color: "#10B981",
            },
            {
              label: "Pending",
              value: totals.pending,
              icon: <Clock size={16} />,
              color: "#F59E0B",
            },
            {
              label: "Confirmed",
              value: totals.confirmed,
              icon: <Package size={16} />,
              color: "#3B82F6",
            },
            {
              label: "Shipped",
              value: totals.shipped,
              icon: <Truck size={16} />,
              color: "#8B5CF6",
            },
            {
              label: "Uncommitted",
              value: totals.uncommitted,
              icon: <XCircle size={16} />,
              color: "#6B7280",
            },
            {
              label: "Revenue",
              value: formatNaira(totals.revenue),
              icon: <DollarSign size={16} />,
              color: "#059669",
            },
          ].map((s, i) => (
            <div key={i} className="card p-3">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.icon}
                </div>
                <span className="text-[10px] text-gray-500">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {[
            {
              label: "Cost of Goods",
              value: formatNaira(totals.cost),
              color: "text-red-600",
            },
            {
              label: "Delivery Fees",
              value: formatNaira(totals.deliveryFees),
              color: "text-orange-600",
            },
            {
              label: "Total Expenses",
              value: formatNaira(totals.expenses),
              color: "text-amber-600",
            },
            {
              label: "Marketing Spend",
              value: formatNaira(totals.marketing),
              color: "text-purple-600",
            },
            {
              label: "Gross Profit",
              value: formatNaira(totals.profit),
              color: "text-green-600",
            },
            {
              label: "Net Profit",
              value: formatNaira(totals.netProfit),
              color: totals.netProfit >= 0 ? "text-green-700" : "text-red-700",
            },
          ].map((s, i) => (
            <div key={i} className="card p-3 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Orders & Deliveries by Day
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
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
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                />
                <Tooltip />
                <Bar
                  dataKey="orders"
                  fill={brand.primaryColor}
                  name="Orders In"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="delivered"
                  fill="#10B981"
                  name="Delivered"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Revenue & Profit by Day
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
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
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => formatNaira(Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={brand.primaryColor}
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Net Profit"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Breakdown Table */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">
              Daily Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-semibold text-gray-500 uppercase">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-center">Orders In</th>
                  <th className="px-3 py-2 text-center">Pending</th>
                  <th className="px-3 py-2 text-center">Confirmed</th>
                  <th className="px-3 py-2 text-center">Shipped</th>
                  <th className="px-3 py-2 text-center">Delivered</th>
                  <th className="px-3 py-2 text-center">Uncommit</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                  <th className="px-3 py-2 text-right">Expenses</th>
                  <th className="px-3 py-2 text-right hidden sm:table-cell">
                    Marketing
                  </th>
                  <th className="px-3 py-2 text-right">Net Profit</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {dailySummaries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-8 text-center text-gray-400 text-sm"
                    >
                      No data for this period
                    </td>
                  </tr>
                ) : (
                  dailySummaries.map((day) => (
                    <>
                      <tr
                        key={day.date}
                        className="border-b border-gray-50 hover:bg-gray-50/50 text-xs cursor-pointer"
                        onClick={() =>
                          setExpandedDate(
                            expandedDate === day.date ? null : day.date,
                          )
                        }
                      >
                        <td className="px-3 py-2.5 font-medium text-gray-900">
                          {day.label}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="badge bg-blue-50 text-blue-700">
                            {day.ordersIn}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {day.pending > 0 ? (
                            <span className="badge bg-amber-50 text-amber-700">
                              {day.pending}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {day.confirmed > 0 ? (
                            <span className="badge bg-blue-50 text-blue-700">
                              {day.confirmed}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {day.shipped > 0 ? (
                            <span className="badge bg-purple-50 text-purple-700">
                              {day.shipped}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {day.delivered > 0 ? (
                            <span className="badge bg-green-50 text-green-700">
                              {day.delivered}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {day.uncommitted > 0 ? (
                            <span className="badge bg-gray-100 text-gray-600">
                              {day.uncommitted}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                          {day.revenue > 0 ? formatNaira(day.revenue) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-red-600">
                          {day.expenses > 0 ? formatNaira(day.expenses) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-purple-600 hidden sm:table-cell">
                          {day.marketingExpenses > 0
                            ? formatNaira(day.marketingExpenses)
                            : "—"}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right font-semibold ${day.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {day.netProfit !== 0
                            ? formatNaira(day.netProfit)
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {expandedDate === day.date ? (
                            <ChevronUp size={12} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={12} className="text-gray-400" />
                          )}
                        </td>
                      </tr>
                      {expandedDate === day.date && (
                        <tr key={`${day.date}-detail`} className="bg-gray-50">
                          <td colSpan={12} className="px-4 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                              <div>
                                <p className="text-gray-400">Revenue</p>
                                <p className="font-semibold text-gray-900">
                                  {formatNaira(day.revenue)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Cost of Goods</p>
                                <p className="font-semibold text-red-600">
                                  {formatNaira(day.cost)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Delivery Fees</p>
                                <p className="font-semibold text-orange-600">
                                  {formatNaira(day.deliveryFees)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Gross Profit</p>
                                <p className="font-semibold text-green-600">
                                  {formatNaira(day.profit)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">All Expenses</p>
                                <p className="font-semibold text-amber-600">
                                  {formatNaira(day.expenses)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Marketing</p>
                                <p className="font-semibold text-purple-600">
                                  {formatNaira(day.marketingExpenses)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-2">
                              {day.netProfit >= 0 ? (
                                <TrendingUp
                                  size={14}
                                  className="text-green-500"
                                />
                              ) : (
                                <TrendingDown
                                  size={14}
                                  className="text-red-500"
                                />
                              )}
                              <span
                                className={`text-sm font-bold ${day.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}
                              >
                                Net: {formatNaira(day.netProfit)}
                              </span>
                              <span className="text-[10px] text-gray-400 ml-2">
                                = Revenue - Cost - Delivery - Expenses
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
              {dailySummaries.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50 text-xs font-bold">
                    <td className="px-3 py-3 text-gray-700">TOTALS</td>
                    <td className="px-3 py-3 text-center">{totals.ordersIn}</td>
                    <td className="px-3 py-3 text-center">{totals.pending}</td>
                    <td className="px-3 py-3 text-center">
                      {totals.confirmed}
                    </td>
                    <td className="px-3 py-3 text-center">{totals.shipped}</td>
                    <td className="px-3 py-3 text-center">
                      {totals.delivered}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {totals.uncommitted}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-900">
                      {formatNaira(totals.revenue)}
                    </td>
                    <td className="px-3 py-3 text-right text-red-600">
                      {formatNaira(totals.expenses)}
                    </td>
                    <td className="px-3 py-3 text-right text-purple-600 hidden sm:table-cell">
                      {formatNaira(totals.marketing)}
                    </td>
                    <td
                      className={`px-3 py-3 text-right ${totals.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}
                    >
                      {formatNaira(totals.netProfit)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
