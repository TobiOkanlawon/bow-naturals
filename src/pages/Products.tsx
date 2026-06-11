import { useState } from "react";
import { useBrand } from "../context/BrandContext";
import { useStore } from "../context/StoreContext";
import { type Product, type PriceTier, formatNaira } from "../data/store";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Products() {
  const { brand } = useBrand();
  const { products, addProduct, updateProduct, deleteProduct } = useStore();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formTiers, setFormTiers] = useState<PriceTier[]>([]);
  const [newTierName, setNewTierName] = useState("");
  const [newTierCost, setNewTierCost] = useState("");
  const [newTierPrice, setNewTierPrice] = useState("");

  const categories = [...new Set(products.map((p) => p.category))];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" || p.status === filter || p.category === filter;
    return matchSearch && matchFilter;
  });

  const openAdd = () => {
    setEditing(null);
    setFormName("");
    setFormCategory("");
    setFormTiers([
      { name: "Retail", costPrice: 0, sellingPrice: 0 },
      { name: "Wholesale", costPrice: 0, sellingPrice: 0 },
      { name: "DM/Group", costPrice: 0, sellingPrice: 0 },
    ]);
    setNewTierName("");
    setNewTierCost("");
    setNewTierPrice("");
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormTiers([...product.tiers]);
    setNewTierName("");
    setNewTierCost("");
    setNewTierPrice("");
    setShowModal(true);
  };

  const addTier = () => {
    if (!newTierName || !newTierPrice) return;
    setFormTiers([
      ...formTiers,
      {
        name: newTierName,
        costPrice: Number(newTierCost) || 0,
        sellingPrice: Number(newTierPrice),
      },
    ]);
    setNewTierName("");
    setNewTierCost("");
    setNewTierPrice("");
  };

  const removeTier = (index: number) =>
    setFormTiers(formTiers.filter((_, i) => i !== index));

  const updateTier = (index: number, field: keyof PriceTier, value: string) => {
    const updated = [...formTiers];
    if (field === "name") updated[index].name = value;
    else updated[index][field] = Number(value);
    setFormTiers(updated);
  };

  const save = async () => {
    if (!formName || !formCategory || formTiers.length === 0) return;
    if (editing) {
      const stock = editing.totalStock;
      await updateProduct(editing.id, {
        name: formName,
        category: formCategory,
        tiers: formTiers,
        status: stock === 0 ? "out-of-stock" : "in-stock",
      });
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formName,
        category: formCategory,
        tiers: formTiers,
        totalStock: 0,
        status: "in-stock",
      };
      await addProduct(newProduct);
    }
    setShowModal(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await deleteProduct(id);
  };

  const getProfitPercent = (sellingPrice: number, costPrice: number) => {
    if (costPrice <= 0) return "0";
    return (((sellingPrice - costPrice) / costPrice) * 100).toFixed(0);
  };

  return (
    <div className="space-y-4">
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
              placeholder="Search products..."
              className="input-field pl-9"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All</option>
            <option value="in-stock">In Stock</option>
            <option value="out-of-stock">Out of Stock</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((product) => (
          <div key={product.id} className="card overflow-hidden">
            <div
              className="p-4 flex items-center gap-4 cursor-pointer"
              onClick={() =>
                setExpandedId(expandedId === product.id ? null : product.id)
              }
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${brand.primaryColor}15` }}
              >
                <Package size={20} style={{ color: brand.primaryColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {product.name}
                  </h4>
                  <span
                    className={`badge text-[10px] ${product.status === "in-stock" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                  >
                    {product.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {product.category} • {product.tiers.length} price tiers
                </p>
              </div>
              <div className="text-right hidden sm:block">
                {product.tiers
                  .filter((t) => t.name === "Retail")
                  .map((t) => (
                    <p key="r" className="text-sm font-bold text-gray-900">
                      {formatNaira(t.sellingPrice)}
                    </p>
                  ))}
                <p className="text-xs text-gray-500">
                  Stock: {product.totalStock}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(product);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(product.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
                {expandedId === product.id ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </div>
            </div>

            {expandedId === product.id && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-2">
                  Pricing Tiers (Cost vs Selling)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {product.tiers.map((tier, i) => {
                    const profit = tier.sellingPrice - tier.costPrice;
                    const pct = getProfitPercent(
                      tier.sellingPrice,
                      tier.costPrice,
                    );
                    const colors = [
                      "border-l-green-500",
                      "border-l-blue-500",
                      "border-l-purple-500",
                      "border-l-amber-500",
                      "border-l-pink-500",
                      "border-l-cyan-500",
                    ];
                    return (
                      <div
                        key={i}
                        className={`bg-gray-50 rounded-lg p-3 border-l-4 ${colors[i % colors.length]}`}
                      >
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">
                          {tier.name}
                        </p>
                        <div className="flex items-baseline justify-between mt-1">
                          <p className="text-lg font-bold text-gray-900">
                            {formatNaira(tier.sellingPrice)}
                          </p>
                          <p className="text-xs text-green-600 font-semibold">
                            +{formatNaira(profit)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-gray-400">
                            Cost: {formatNaira(tier.costPrice)}
                          </span>
                          <span className="text-green-600 font-medium">
                            ({pct}% margin)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-8 text-center">
          <Package size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">No products found.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">
                {editing ? "Edit Product" : "Add Product"}
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    className="input-field"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    className="input-field"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Price Tiers (Each has its own Cost & Selling Price)
                </h4>
                {formTiers.map((tier, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        className="input-field w-28 text-sm font-semibold"
                        value={tier.name}
                        onChange={(e) => updateTier(i, "name", e.target.value)}
                        placeholder="Tier name"
                      />
                      {i >= 3 && (
                        <button
                          onClick={() => removeTier(i)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase">
                          Cost Price (₦)
                        </label>
                        <input
                          className="input-field text-sm"
                          type="number"
                          value={tier.costPrice || ""}
                          onChange={(e) =>
                            updateTier(i, "costPrice", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase">
                          Selling Price (₦)
                        </label>
                        <input
                          className="input-field text-sm"
                          type="number"
                          value={tier.sellingPrice || ""}
                          onChange={(e) =>
                            updateTier(i, "sellingPrice", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    {tier.costPrice > 0 && tier.sellingPrice > 0 && (
                      <p className="text-[10px] text-green-600 mt-1">
                        Profit:{" "}
                        {formatNaira(tier.sellingPrice - tier.costPrice)} (
                        {getProfitPercent(tier.sellingPrice, tier.costPrice)}%
                        margin)
                      </p>
                    )}
                  </div>
                ))}

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Add Custom Tier
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      className="input-field text-sm"
                      placeholder="Tier name"
                      value={newTierName}
                      onChange={(e) => setNewTierName(e.target.value)}
                    />
                    <input
                      className="input-field text-sm"
                      type="number"
                      placeholder="Cost (₦)"
                      value={newTierCost}
                      onChange={(e) => setNewTierCost(e.target.value)}
                    />
                    <div className="flex gap-1">
                      <input
                        className="input-field text-sm flex-1"
                        type="number"
                        placeholder="Sell (₦)"
                        value={newTierPrice}
                        onChange={(e) => setNewTierPrice(e.target.value)}
                      />
                      <button
                        onClick={addTier}
                        className="btn-secondary px-3 text-xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
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
                {editing ? "Update" : "Add"} Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
