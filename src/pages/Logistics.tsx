import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useBrand } from "../context/BrandContext";
import { useStore } from "../context/StoreContext";
import {
  type LogisticsCompany,
  type LogisticsInventoryItem,
  type Product,
  formatNaira,
  getTotalStockValue,
} from "../data/store";
import {
  Plus,
  Search,
  X,
  MapPin,
  Phone,
  Package,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

export default function Logistics() {
  const { user } = useAuth();
  const { brand } = useBrand();
  const {
    logistics,
    products,
    staff,
    addLogisticsCompany,
    updateLogisticsCompany,
    deleteLogisticsCompany,
    setLogistics,
    setProducts,
  } = useStore();

  const currentStaff = staff.find((s) => s.name === user?.name);
  const isCEO = user?.role === "ceo";
  const canAddLogistics = isCEO || currentStaff?.permissions.canAddLogistics;
  const canAddInventory =
    isCEO || currentStaff?.permissions.canAddEditInventory;

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editing, setEditing] = useState<LogisticsCompany | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<LogisticsCompany | null>(null);
  const [form, setForm] = useState<Partial<LogisticsCompany>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inventoryForm, setInventoryForm] = useState<LogisticsInventoryItem[]>(
    [],
  );

  const filtered = logistics.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase()),
  );

  const stockStats = useMemo(
    () => getTotalStockValue(products, logistics),
    [products, logistics],
  );

  const openAdd = () => {
    if (!canAddLogistics)
      return alert("You do not have permission to add logistics companies");
    setEditing(null);
    setForm({ inventory: [] });
    setShowModal(true);
  };

  const openEdit = (loc: LogisticsCompany) => {
    if (!canAddLogistics)
      return alert("You do not have permission to edit logistics companies");
    setEditing(loc);
    setForm({ ...loc });
    setShowModal(true);
  };

  const openInventoryModal = (loc: LogisticsCompany) => {
    if (!canAddInventory)
      return alert("You do not have permission to add/edit inventory");
    setSelectedLocation(loc);
    setInventoryForm(loc.inventory.map((i) => ({ ...i })));
    setShowInventoryModal(true);
  };

  const save = async () => {
    if (!form.name || !form.phone || !form.location) return;
    if (editing) {
      await updateLogisticsCompany(editing.id, { ...form });
    } else {
      const newLoc: LogisticsCompany = {
        id: Date.now().toString(),
        name: form.name || "",
        phone: form.phone || "",
        location: form.location || "",
        inventory: [],
        createdAt: new Date().toISOString().split("T")[0],
      };
      await addLogisticsCompany(newLoc);
    }
    setShowModal(false);
  };

  const saveInventory = async () => {
    if (!selectedLocation) return;
    const validInventory = inventoryForm.filter(
      (i) => i.quantity > 0 || i.minStock > 0,
    );

    // Update the logistics company's inventory
    await updateLogisticsCompany(selectedLocation.id, {
      inventory: validInventory,
    });

    // Recalculate totalStock for each product across all locations,
    // replacing the selected location's old inventory with the new one
    const updatedLogistics = logistics.map((l) =>
      l.id === selectedLocation.id ? { ...l, inventory: validInventory } : l,
    );
    const updatedProducts = products.map((p) => {
      const totalStock = updatedLogistics.reduce((sum, loc) => {
        const inv = loc.inventory.find((i) => i.productId === p.id);
        return sum + (inv?.quantity || 0);
      }, 0);
      return {
        ...p,
        totalStock,
        status: totalStock === 0 ? "out-of-stock" : "in-stock",
      } as Product;
    });
    await setProducts(updatedProducts);

    setShowInventoryModal(false);
  };

  const addProductToInventory = () => {
    const unusedProduct = products.find(
      (p) => !inventoryForm.some((i) => i.productId === p.id),
    );
    if (unusedProduct) {
      setInventoryForm([
        ...inventoryForm,
        { productId: unusedProduct.id, quantity: 0, minStock: 0 },
      ]);
    }
  };

  const remove = async (id: string) => {
    if (!canAddLogistics) return;
    await deleteLogisticsCompany(id);
  };

  const getLocationStock = (loc: LogisticsCompany) =>
    loc.inventory.reduce((sum, inv) => sum + inv.quantity, 0);

  const getLocationValue = (
    loc: LogisticsCompany,
    priceType: "cost" | "retail" | "wholesale",
  ) =>
    loc.inventory.reduce((sum, inv) => {
      const product = products.find((p) => p.id === inv.productId);
      if (!product) return sum;
      if (priceType === "cost")
        return sum + (product.tiers[0]?.costPrice || 0) * inv.quantity;
      if (priceType === "retail") {
        const retail = product.tiers.find((t) => t.name === "Retail");
        return sum + (retail?.sellingPrice || 0) * inv.quantity;
      }
      const wholesale = product.tiers.find((t) => t.name === "Wholesale");
      return sum + (wholesale?.sellingPrice || 0) * inv.quantity;
    }, 0);

  const getProductSellingPrice = (
    product: Product,
    tierName: string = "Retail",
  ) => {
    const tier = product.tiers.find((t) => t.name === tierName);
    return tier?.sellingPrice || product.tiers[0]?.sellingPrice || 0;
  };

  const isLowStock = (inv: LogisticsInventoryItem) =>
    inv.minStock > 0 && inv.quantity <= inv.minStock;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Units",
            value: stockStats.totalUnits.toLocaleString(),
            icon: <Package size={20} />,
            color: "blue",
          },
          {
            label: "Cost Value",
            value: formatNaira(stockStats.costValue),
            icon: <TrendingUp size={20} />,
            color: "gray",
          },
          {
            label: "Retail Value",
            value: formatNaira(stockStats.retailValue),
            icon: <TrendingUp size={20} />,
            color: "green",
          },
          {
            label: "Wholesale Value",
            value: formatNaira(stockStats.wholesaleValue),
            icon: <TrendingUp size={20} />,
            color: "purple",
          },
        ].map((s, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  s.color === "blue"
                    ? "bg-blue-100 text-blue-600"
                    : s.color === "green"
                      ? "bg-green-100 text-green-600"
                      : s.color === "purple"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-gray-100 text-gray-600"
                }`}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

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
            placeholder="Search locations..."
            className="input-field pl-9"
          />
        </div>
        {canAddLogistics && (
          <button
            onClick={openAdd}
            className="btn-primary flex items-center gap-2"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <Plus size={16} /> Add Logistics Company
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((loc) => {
          const stock = getLocationStock(loc);
          const retailVal = getLocationValue(loc, "retail");
          const hasLowStock = loc.inventory.some((inv) => isLowStock(inv));

          return (
            <div key={loc.id} className="card overflow-hidden">
              <div
                className="p-4 flex items-center gap-4 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === loc.id ? null : loc.id)
                }
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${brand.primaryColor}15` }}
                >
                  <MapPin size={20} style={{ color: brand.primaryColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {loc.name}
                    </h4>
                    {hasLowStock && (
                      <AlertTriangle size={14} className="text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin size={10} /> {loc.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={10} /> {loc.phone}
                    </span>
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">
                    {stock} units
                  </p>
                  <p className="text-xs text-green-600">
                    {formatNaira(retailVal)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {canAddInventory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openInventoryModal(loc);
                      }}
                      className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg text-xs"
                      title="Manage Inventory"
                    >
                      <Package size={14} />
                    </button>
                  )}
                  {canAddLogistics && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(loc);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(loc.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  {expandedId === loc.id ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </div>

              {expandedId === loc.id && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-2">
                    Inventory at this location
                  </p>
                  {loc.inventory.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">
                      No inventory at this location
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {loc.inventory.map((inv) => {
                        const product = products.find(
                          (p) => p.id === inv.productId,
                        );
                        if (!product) return null;
                        const lowStock = isLowStock(inv);
                        const price = getProductSellingPrice(product);
                        return (
                          <div
                            key={inv.productId}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              {lowStock && (
                                <AlertTriangle
                                  size={12}
                                  className="text-amber-500"
                                />
                              )}
                              <span className="text-sm text-gray-900">
                                {product.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span
                                className={`font-semibold ${lowStock ? "text-amber-600" : "text-gray-700"}`}
                              >
                                {inv.quantity} units
                              </span>
                              <span className="text-gray-400">
                                Min: {inv.minStock}
                              </span>
                              <span className="text-gray-400">
                                {formatNaira(price * inv.quantity)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 text-xs">
                    <span className="text-gray-500">
                      Cost:{" "}
                      <strong className="text-gray-700">
                        {formatNaira(getLocationValue(loc, "cost"))}
                      </strong>
                    </span>
                    <span className="text-gray-500">
                      Wholesale:{" "}
                      <strong className="text-purple-600">
                        {formatNaira(getLocationValue(loc, "wholesale"))}
                      </strong>
                    </span>
                    <span className="text-gray-500">
                      Retail:{" "}
                      <strong className="text-green-600">
                        {formatNaira(getLocationValue(loc, "retail"))}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-8 text-center">
          <MapPin size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">No logistics companies found.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
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
                {editing ? "Edit" : "Add"} Logistics Company
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
                  Company Name
                </label>
                <input
                  className="input-field"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  className="input-field"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  className="input-field"
                  value={form.location || ""}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="e.g. Lagos - Ikeja"
                />
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
                {editing ? "Update" : "Add"} Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventoryModal && selectedLocation && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInventoryModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Manage Inventory
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedLocation.name} - {selectedLocation.location}
                </p>
              </div>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-500">
                Set quantity and minimum stock level for each product at this
                location.
              </p>
              {inventoryForm.map((inv, idx) => {
                const product = products.find((p) => p.id === inv.productId);
                return (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <select
                        className="input-field flex-1 text-sm"
                        value={inv.productId}
                        onChange={(e) => {
                          const updated = [...inventoryForm];
                          updated[idx].productId = e.target.value;
                          setInventoryForm(updated);
                        }}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          setInventoryForm(
                            inventoryForm.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase">
                          Quantity
                        </label>
                        <input
                          type="number"
                          className="input-field text-sm"
                          value={inv.quantity}
                          onChange={(e) => {
                            const updated = [...inventoryForm];
                            updated[idx].quantity = Number(e.target.value);
                            setInventoryForm(updated);
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase">
                          Min Stock Alert
                        </label>
                        <input
                          type="number"
                          className="input-field text-sm"
                          value={inv.minStock}
                          onChange={(e) => {
                            const updated = [...inventoryForm];
                            updated[idx].minStock = Number(e.target.value);
                            setInventoryForm(updated);
                          }}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    {product && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        Value:{" "}
                        {formatNaira(
                          getProductSellingPrice(product) * inv.quantity,
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
              <button
                onClick={addProductToInventory}
                className="btn-secondary w-full text-sm"
              >
                <Plus size={14} className="inline mr-1" /> Add Product
              </button>
            </div>
            <div className="flex gap-3 p-5 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setShowInventoryModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={saveInventory}
                className="btn-primary flex-1"
                style={{ backgroundColor: brand.primaryColor }}
              >
                Save Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
