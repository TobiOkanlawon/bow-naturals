import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useBrand } from "../context/BrandContext";
import { useStore } from "../context/StoreContext";
import { type Expense, formatNaira } from "../data/store";
import {
  Plus,
  Search,
  X,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Trash2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const statusConfig = {
  approved: {
    icon: <CheckCircle size={14} />,
    class: "bg-green-50 text-green-700",
  },
  pending: { icon: <Clock size={14} />, class: "bg-amber-50 text-amber-700" },
  rejected: { icon: <XCircle size={14} />, class: "bg-red-50 text-red-700" },
};

const COLORS = [
  "#4F46E5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

export default function Expenses() {
  const { user } = useAuth();
  const { brand } = useBrand();
  const isCEO = user?.role === "ceo";
  const { expenses, addExpense, updateExpense, deleteExpense } = useStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<Partial<Expense>>({});

  const filtered = expenses.filter((e) => {
    const matchSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = useMemo(() => {
    const total = expenses
      .filter((e) => e.status === "approved")
      .reduce((s, e) => s + e.amount, 0);
    const pending = expenses
      .filter((e) => e.status === "pending")
      .reduce((s, e) => s + e.amount, 0);
    const byCategory: Record<string, number> = {};
    expenses
      .filter((e) => e.status === "approved")
      .forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });
    const categoryData = Object.entries(byCategory).map(([name, value]) => ({
      name,
      value,
    }));
    return { total, pending, categoryData };
  }, [expenses]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      status: "pending",
      date: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({ ...expense });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.description || !form.amount || !form.category) return;
    if (editing) {
      await updateExpense(editing.id, { ...form });
    } else {
      const newExpense: Expense = {
        id: Date.now().toString(),
        category: form.category || "",
        description: form.description || "",
        amount: form.amount || 0,
        date: form.date || "",
        status: (form.status as Expense["status"]) || "pending",
        submittedBy: form.submittedBy || "",
      };
      await addExpense(newExpense);
    }
    setShowModal(false);
  };

  const updateStatus = async (id: string, status: Expense["status"]) => {
    await updateExpense(id, { status });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await deleteExpense(id);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-green-500">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatNaira(stats.total)}
            </p>
            <p className="text-xs text-gray-500">Total Approved Expenses</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-amber-500">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatNaira(stats.pending)}
            </p>
            <p className="text-xs text-gray-500">Pending Approval</p>
          </div>
        </div>
        <div className="card p-5">
          <h4 className="text-xs font-medium text-gray-500 mb-2">
            By Category
          </h4>
          <div className="flex items-center gap-2">
            <ResponsiveContainer width={80} height={80}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={22}
                  outerRadius={35}
                  paddingAngle={2}
                >
                  {stats.categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatNaira(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1">
              {stats.categoryData.slice(0, 4).map((cat, i) => (
                <div
                  key={cat.name}
                  className="flex items-center gap-1.5 text-[10px]"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-gray-600 truncate">{cat.name}</span>
                  <span className="ml-auto text-gray-400">
                    {formatNaira(cat.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
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
              placeholder="Search expenses..."
              className="input-field pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                  Submitted By
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((expense) => {
                const sc = statusConfig[expense.status];
                return (
                  <tr
                    key={expense.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">
                      {expense.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                      {expense.category}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {formatNaira(expense.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                      {expense.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                      {expense.submittedBy}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge flex items-center gap-1 w-fit ${sc.class}`}
                      >
                        {sc.icon} {expense.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isCEO && expense.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                updateStatus(expense.id, "approved")
                              }
                              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() =>
                                updateStatus(expense.id, "rejected")
                              }
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openEdit(expense)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 size={14} />
                        </button>
                        {isCEO && (
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900">
                {editing ? "Edit Expense" : "Add Expense"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  className="input-field"
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="input-field"
                    value={form.category || ""}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    <option value="">Select...</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Office">Office</option>
                    <option value="Software">Software</option>
                    <option value="Travel">Travel</option>
                    <option value="Salary">Salary</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₦)
                  </label>
                  <input
                    className="input-field"
                    type="number"
                    value={form.amount || ""}
                    onChange={(e) =>
                      setForm({ ...form, amount: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.date || ""}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Submitted By
                  </label>
                  <input
                    className="input-field"
                    value={form.submittedBy || ""}
                    onChange={(e) =>
                      setForm({ ...form, submittedBy: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
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
                {editing ? "Update" : "Add"} Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
