import { useState } from "react";
import { useBrand } from "../context/BrandContext";
import { useStore } from "../context/StoreContext";
import { type StaffMember, formatNaira } from "../data/store";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Mail,
  Shield,
  ShieldOff,
} from "lucide-react";

export default function Staff() {
  const { brand } = useBrand();
  const { staff, addStaffMember, updateStaffMember, deleteStaffMember } =
    useStore();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<Partial<StaffMember>>({});

  const filtered = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditing(null);
    setForm({
      status: "active",
      joinDate: new Date().toISOString().split("T")[0],
      permissions: { canAddEditInventory: false, canAddLogistics: false },
    });
    setShowModal(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditing(member);
    setForm({ ...member });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name || !form.email || !form.role || !form.department) return;
    if (editing) {
      await updateStaffMember(editing.id, { ...form });
    } else {
      const newMember: StaffMember = {
        id: Date.now().toString(),
        name: form.name || "",
        email: form.email || "",
        password: form.password || "staff123",
        role: form.role || "",
        department: form.department || "",
        status: form.status || "active",
        joinDate: form.joinDate || "",
        phone: form.phone || "",
        salary: form.salary || 0,
        permissions: form.permissions || {
          canAddEditInventory: false,
          canAddLogistics: false,
        },
      };
      await addStaffMember(newMember);
    }
    setShowModal(false);
  };

  const remove = async (id: string) => {
    await deleteStaffMember(id);
  };

  const togglePermission = async (
    id: string,
    perm: "canAddEditInventory" | "canAddLogistics",
  ) => {
    const member = staff.find((s) => s.id === id);
    if (!member) return;
    await updateStaffMember(id, {
      permissions: {
        ...member.permissions,
        [perm]: !member.permissions[perm],
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff..."
            className="input-field pl-9"
          />
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                  Salary
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                  Permissions
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                        style={{ backgroundColor: brand.primaryColor }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail size={10} /> {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                    {member.role}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                    {member.department}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${member.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                    {formatNaira(member.salary)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() =>
                          togglePermission(member.id, "canAddEditInventory")
                        }
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                          member.permissions.canAddEditInventory
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                        title="Add/Edit Inventory"
                      >
                        {member.permissions.canAddEditInventory ? (
                          <Shield size={12} />
                        ) : (
                          <ShieldOff size={12} />
                        )}
                        <span className="hidden xl:inline">Inv</span>
                      </button>
                      <button
                        onClick={() =>
                          togglePermission(member.id, "canAddLogistics")
                        }
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                          member.permissions.canAddLogistics
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                        title="Add Logistics"
                      >
                        {member.permissions.canAddLogistics ? (
                          <Shield size={12} />
                        ) : (
                          <ShieldOff size={12} />
                        )}
                        <span className="hidden xl:inline">Log</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(member)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => remove(member.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">
            No staff members found.
          </p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900">
                {editing ? "Edit Staff" : "Add Staff"}
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
                  Name
                </label>
                <input
                  className="input-field"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Login Email
                </label>
                <input
                  className="input-field"
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Used for login. Only admin can change.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  className="input-field"
                  type="text"
                  value={form.password || ""}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Only admin can set/change passwords.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    className="input-field"
                    value={form.role || ""}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    className="input-field"
                    value={form.department || ""}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    className="input-field"
                    value={form.phone || ""}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary (₦)
                  </label>
                  <input
                    className="input-field"
                    type="number"
                    value={form.salary || ""}
                    onChange={(e) =>
                      setForm({ ...form, salary: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="input-field"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.permissions?.canAddEditInventory || false}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          permissions: {
                            ...form.permissions!,
                            canAddEditInventory: e.target.checked,
                          },
                        })
                      }
                      className="rounded"
                    />
                    Can add/edit inventory at logistics locations
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.permissions?.canAddLogistics || false}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          permissions: {
                            ...form.permissions!,
                            canAddLogistics: e.target.checked,
                          },
                        })
                      }
                      className="rounded"
                    />
                    Can add logistics companies
                  </label>
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
                {editing ? "Update" : "Add"} Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
