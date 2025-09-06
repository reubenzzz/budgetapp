import React, { useEffect, useMemo, useState } from "react";
// React Budget Manager - Single-file app (App.jsx)
// - Tailwind classes used for styling (no imports required in this preview)
// - Uses localStorage to persist transactions and settings
// - Uses recharts for simple visualisations (install: recharts)
// - Responsive layout with forms to add income/expense, category filtering, quick summaries

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const LOCAL_KEY = "budget_manager_data_v1";

const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Rent",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Salary",
  "Other",
];

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [form, setForm] = useState({ type: "expense", amount: "", category: "Food", note: "", date: "" });
  const [filter, setFilter] = useState({ type: "all", category: "all", month: "all" });

  useEffect(() => {
    // load from localStorage
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) setTransactions(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to parse local data", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const resetForm = () => setForm({ type: "expense", amount: "", category: categories[0], note: "", date: "" });

  const addTransaction = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || isNaN(amount)) return alert("Please enter a valid amount");
    const tx = {
      id: Date.now(),
      type: form.type,
      amount: Math.abs(amount),
      category: form.category,
      note: form.note,
      date: form.date || new Date().toISOString().slice(0, 10),
    };
    setTransactions((t) => [tx, ...t]);
    resetForm();
  };

  const removeTransaction = (id) => {
    if (!confirm("Delete this transaction?")) return;
    setTransactions((t) => t.filter((x) => x.id !== id));
  };

  const months = useMemo(() => {
    const set = new Set();
    transactions.forEach((t) => set.add(t.date.slice(0, 7))); // YYYY-MM
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // filtered transactions based on filter state
  const filtered = transactions.filter((t) => {
    if (filter.type !== "all" && t.type !== filter.type) return false;
    if (filter.category !== "all" && t.category !== filter.category) return false;
    if (filter.month !== "all" && t.date.slice(0, 7) !== filter.month) return false;
    return true;
  });

  const totals = useMemo(() => {
    let income = 0,
      expense = 0;
    filtered.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, balance: income - expense };
  }, [filtered]);

  // Data for charts
  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      if (t.type === "expense") {
        map[t.category] = (map[t.category] || 0) + t.amount;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const monthlyData = useMemo(() => {
    const m = {};
    transactions.forEach((t) => {
      const key = t.date.slice(0, 7);
      if (!m[key]) m[key] = { month: key, income: 0, expense: 0 };
      if (t.type === "income") m[key].income += t.amount;
      else m[key].expense += t.amount;
    });
    return Object.values(m).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a29bfe", "#00cec9", "#fd79a8"];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Budget Manager</h1>
            <p className="text-sm text-gray-600">Quick, responsive app to track income & expenses (saved locally)</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-700">Balance</div>
            <div className={`text-xl font-semibold ${totals.balance < 0 ? "text-red-500" : "text-green-600"}`}>
              ₹{totals.balance.toFixed(2)}
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Form + Filters */}
          <section className="lg:col-span-1 bg-white p-4 rounded-2xl shadow-sm">
            <h2 className="font-semibold mb-3">Add Transaction</h2>
            <form onSubmit={addTransaction} className="space-y-3">
              <div className="flex gap-2">
                <label className={`flex-1 p-2 rounded-xl border ${form.type === "expense" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                  <input type="radio" name="type" checked={form.type === "expense"} onChange={() => setForm((f) => ({ ...f, type: "expense" }))} /> Expense
                </label>
                <label className={`flex-1 p-2 rounded-xl border ${form.type === "income" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <input type="radio" name="type" checked={form.type === "income"} onChange={() => setForm((f) => ({ ...f, type: "income" }))} /> Income
                </label>
              </div>

              <div>
                <input
                  className="w-full rounded-lg border p-2"
                  placeholder="Amount (₹)"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  inputMode="decimal"
                />
              </div>

              <div>
                <select className="w-full rounded-lg border p-2" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input className="w-full rounded-lg border p-2" placeholder="Note (optional)" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
              </div>

              <div>
                <input type="date" className="w-full rounded-lg border p-2" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-medium">Add</button>
                <button type="button" onClick={resetForm} className="flex-1 py-2 rounded-xl border">Reset</button>
              </div>
            </form>

            <hr className="my-4" />

            <h3 className="font-semibold mb-2">Filters</h3>
            <div className="space-y-2">
              <div>
                <select className="w-full rounded-lg border p-2" value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}>
                  <option value="all">All</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <select className="w-full rounded-lg border p-2" value={filter.category} onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}>
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select className="w-full rounded-lg border p-2" value={filter.month} onChange={(e) => setFilter((f) => ({ ...f, month: e.target.value }))}>
                  <option value="all">All Months</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setFilter({ type: "all", category: "all", month: "all" })} className="flex-1 py-2 rounded-xl border">
                  Clear
                </button>
                <button
                  onClick={() => {
                    // export JSON
                    const data = { transactions };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "budget-data.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 py-2 rounded-xl bg-gray-100"
                >
                  Export
                </button>
              </div>
            </div>
          </section>

          {/* Middle column: Transactions + Summary */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <h2 className="font-semibold mb-3">Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-xl border">
                  <div className="text-sm text-gray-600">Income</div>
                  <div className="text-lg font-semibold">₹{totals.income.toFixed(2)}</div>
                </div>
                <div className="p-3 rounded-xl border">
                  <div className="text-sm text-gray-600">Expense</div>
                  <div className="text-lg font-semibold">₹{totals.expense.toFixed(2)}</div>
                </div>
                <div className="p-3 rounded-xl border">
                  <div className="text-sm text-gray-600">Balance</div>
                  <div className={`text-lg font-semibold ${totals.balance < 0 ? "text-red-500" : "text-green-600"}`}>₹{totals.balance.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <h2 className="font-semibold mb-3">Transactions ({filtered.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-600">
                    <tr>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Note</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="py-2">{t.date}</td>
                        <td className="py-2 capitalize">{t.type}</td>
                        <td className="py-2">{t.category}</td>
                        <td className="py-2">{t.note}</td>
                        <td className={`py-2 font-semibold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>₹{t.amount.toFixed(2)}</td>
                        <td className="py-2">
                          <button onClick={() => removeTransaction(t.id)} className="text-xs px-2 py-1 rounded bg-red-50 border text-red-600">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-500">
                          No transactions match current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm h-72">
                <h3 className="font-semibold mb-2">Spending by Category (expenses)</h3>
                {byCategory.length === 0 ? (
                  <div className="text-gray-500">No expense data to show</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                        {byCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm h-72">
                <h3 className="font-semibold mb-2">Income vs Expense (monthly)</h3>
                {monthlyData.length === 0 ? (
                  <div className="text-gray-500">Add transactions to generate monthly chart</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="income" stackId="a" />
                      <Bar dataKey="expense" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className="text-center mt-8 text-sm text-gray-500">
          Built by reubensamphilip@mulearn
        </footer>
      </div>
    </div>
  );
}

