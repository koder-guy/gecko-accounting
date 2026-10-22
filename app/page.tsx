'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, PoundSterling, TrendingDown, DollarSign, Wallet, Calendar, 
  Plus, Edit2, Trash2, Download, Layers, CreditCard,
  ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

interface TaxYear {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface IncomingItem {
  id: string;
  taxYearId: string;
  date: string;
  source: 'Square' | 'Card' | 'Cash';
  description: string;
  cardAmount: number;
  cashAmount: number;
  notes: string;
}

interface OutgoingItem {
  id: string;
  taxYearId: string;
  date: string;
  seller: string;
  orderNo: string;
  invoiceNo: string;
  description: string;
  amount: number;
  paymentType: 'Card' | 'Cash' | 'Bank Transfer' | 'Direct Debit' | 'Other';
  notes: string;
}

export default function App() {
  const [taxYears, setTaxYears] = useState<TaxYear[]>([]);
  const [selectedTaxYearId, setSelectedTaxYearId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'incoming' | 'outgoing' | 'tax-years'>('dashboard');
  const [loading, setLoading] = useState(true);

  const [incomingList, setIncomingList] = useState<IncomingItem[]>([]);
  const [outgoingList, setOutgoingList] = useState<OutgoingItem[]>([]);

  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [editingIncoming, setEditingIncoming] = useState<IncomingItem | null>(null);
  const [showOutgoingModal, setShowOutgoingModal] = useState(false);
  const [editingOutgoing, setEditingOutgoing] = useState<OutgoingItem | null>(null);
  const [showTaxYearModal, setShowTaxYearModal] = useState(false);

  const [incForm, setIncForm] = useState<{ date: string; source: 'Square' | 'Card' | 'Cash'; description: string; cardAmount: string; cashAmount: string; notes: string }>({
    date: new Date().toISOString().split('T')[0], source: 'Square', description: '', cardAmount: '0', cashAmount: '0', notes: ''
  });

  const [outForm, setOutForm] = useState<{ date: string; seller: string; orderNo: string; invoiceNo: string; description: string; amount: string; paymentType: 'Card' | 'Cash' | 'Bank Transfer' | 'Direct Debit' | 'Other'; notes: string }>({
    date: new Date().toISOString().split('T')[0], seller: '', orderNo: '', invoiceNo: '', description: '', amount: '0', paymentType: 'Card', notes: ''
  });

  const [taxYearForm, setTaxYearForm] = useState({ label: '', startDate: '', endDate: '' });

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const tyRes = await fetch('/api/tax-years');
        const tyData = await tyRes.json();
        if (tyData && tyData.length > 0) {
          setTaxYears(tyData);
          const current = tyData.find((t: TaxYear) => t.isCurrent) || tyData[0];
          setSelectedTaxYearId(current.id);
        }
      } catch (err) {
        console.error('Failed to load tax years', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Fetch transactions when selected tax year changes
  useEffect(() => {
    if (!selectedTaxYearId) return;
    async function loadTransactions() {
      try {
        const [incRes, outRes] = await Promise.all([
          fetch(`/api/incoming?taxYearId=${selectedTaxYearId}`),
          fetch(`/api/outgoing?taxYearId=${selectedTaxYearId}`)
        ]);
        const incData = await incRes.json();
        const outData = await outRes.json();
        setIncomingList(Array.isArray(incData) ? incData.map((i: any) => ({ ...i, date: i.date.split('T')[0] })) : []);
        setOutgoingList(Array.isArray(outData) ? outData.map((o: any) => ({ ...o, date: o.date.split('T')[0] })) : []);
      } catch (err) {
        console.error('Failed to load transactions', err);
      }
    }
    loadTransactions();
  }, [selectedTaxYearId]);

  const activeTaxYearLabel = taxYears.find(t => t.id === selectedTaxYearId)?.label || 'All';

  const totalCardIncome = incomingList.reduce((sum, i) => sum + i.cardAmount, 0);
  const totalCashIncome = incomingList.reduce((sum, i) => sum + i.cashAmount, 0);
  const totalIncome = totalCardIncome + totalCashIncome;
  const totalExpenses = outgoingList.reduce((sum, o) => sum + o.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const handleSaveIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIncoming) {
        const res = await fetch(`/api/incoming/${editingIncoming.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...incForm, taxYearId: selectedTaxYearId })
        });
        const updated = await res.json();
        setIncomingList(prev => prev.map(item => item.id === editingIncoming.id ? { ...updated, date: updated.date.split('T')[0] } : item));
      } else {
        const res = await fetch('/api/incoming', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...incForm, taxYearId: selectedTaxYearId })
        });
        const created = await res.json();
        setIncomingList(prev => [{ ...created, date: created.date.split('T')[0] }, ...prev]);
      }
      setShowIncomingModal(false);
      setEditingIncoming(null);
    } catch (err) {
      console.error('Failed to save incoming transaction', err);
    }
  };

  const handleDeleteIncoming = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await fetch(`/api/incoming/${id}`, { method: 'DELETE' });
      setIncomingList(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleSaveOutgoing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOutgoing) {
        const res = await fetch(`/api/outgoing/${editingOutgoing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...outForm, taxYearId: selectedTaxYearId })
        });
        const updated = await res.json();
        setOutgoingList(prev => prev.map(item => item.id === editingOutgoing.id ? { ...updated, date: updated.date.split('T')[0] } : item));
      } else {
        const res = await fetch('/api/outgoing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...outForm, taxYearId: selectedTaxYearId })
        });
        const created = await res.json();
        setOutgoingList(prev => [{ ...created, date: created.date.split('T')[0] }, ...prev]);
      }
      setShowOutgoingModal(false);
      setEditingOutgoing(null);
    } catch (err) {
      console.error('Failed to save outgoing transaction', err);
    }
  };

  const handleDeleteOutgoing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await fetch(`/api/outgoing/${id}`, { method: 'DELETE' });
      setOutgoingList(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleCreateTaxYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxYearForm.label) return;
    try {
      const res = await fetch('/api/tax-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxYearForm)
      });
      const newTy = await res.json();
      setTaxYears(prev => [newTy, ...prev]);
      setSelectedTaxYearId(newTy.id);
      setShowTaxYearModal(false);
      setTaxYearForm({ label: '', startDate: '', endDate: '' });
    } catch (err) {
      console.error('Failed to create tax year', err);
    }
  };

  const exportCSV = (type: 'incoming' | 'outgoing') => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === 'incoming') {
      headers = ['Date', 'Source', 'Description', 'Card Amount (£)', 'Cash Amount (£)', 'Total (£)', 'Notes'];
      rows = incomingList.map(i => [
        i.date, i.source, `"${i.description}"`, i.cardAmount.toFixed(2), i.cashAmount.toFixed(2), (i.cardAmount + i.cashAmount).toFixed(2), `"${i.notes || ''}"`
      ]);
    } else {
      headers = ['Date', 'Seller', 'Order No', 'Invoice No', 'Description', 'Amount (£)', 'Payment Type', 'Notes'];
      rows = outgoingList.map(o => [
        o.date, `"${o.seller}"`, `"${o.orderNo || ''}"`, `"${o.invoiceNo || ''}"`, `"${o.description}"`, o.amount.toFixed(2), o.paymentType, `"${o.notes || ''}"`
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gecko_${type}_${activeTaxYearLabel.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



// Group transactions by month for the chart
  const monthlyMap: { [key: string]: { month: string; incoming: number; outgoing: number } } = {};

  incomingList.forEach(item => {
    if (!item.date) return;
    const monthKey = item.date.substring(0, 7); // e.g., "2024-05"
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: monthKey, incoming: 0, outgoing: 0 };
    }
    monthlyMap[monthKey].incoming += (item.cardAmount + item.cashAmount);
  });

  outgoingList.forEach(item => {
    if (!item.date) return;
    const monthKey = item.date.substring(0, 7);
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: monthKey, incoming: 0, outgoing: 0 };
    }
    monthlyMap[monthKey].outgoing += item.amount;
  });

  const chartData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));



  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <Wallet className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide text-white">Gecko</h1>
              <span className="text-xs text-emerald-400 font-medium tracking-wider uppercase">Accounting</span>
            </div>
          </div>

          <div className="p-4 border-b border-slate-800/80 bg-slate-900/50">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Active Tax Year
            </label>
            <div className="relative">
              <select
                value={selectedTaxYearId}
                onChange={(e) => setSelectedTaxYearId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none cursor-pointer"
              >
                {taxYears.map(ty => (
                  <option key={ty.id} value={ty.id}>
                    Tax Year {ty.label} {ty.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('incoming')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'incoming' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                Incoming
              </div>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{incomingList.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('outgoing')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'outgoing' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                Outgoing
              </div>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{outgoingList.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('tax-years')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'tax-years' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              Tax Years Management
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <p className="font-semibold text-slate-400">Gecko Bookkeeping v1.0</p>
          <p className="mt-1">MySQL Persistent Database</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Viewing data for UK Tax Year <span className="text-emerald-400 font-semibold">{activeTaxYearLabel}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(activeTab === 'incoming' || activeTab === 'outgoing') && (
              <button
                onClick={() => exportCSV(activeTab)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            )}

            {activeTab === 'incoming' && (
              <button
                onClick={() => {
                  setEditingIncoming(null);
                  setIncForm({ date: new Date().toISOString().split('T')[0], source: 'Square', description: '', cardAmount: '0', cashAmount: '0', notes: '' });
                  setShowIncomingModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Incoming
              </button>
            )}

            {activeTab === 'outgoing' && (
              <button
                type="button"
                onClick={() => {
                  setEditingOutgoing(null);
                  setOutForm({ date: new Date().toISOString().split('T')[0], seller: '', orderNo: '', invoiceNo: '', description: '', amount: '0', paymentType: 'Card', notes: '' });
                  setShowOutgoingModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Outgoing
              </button>
            )}

            {activeTab === 'tax-years' && (
              <button
                onClick={() => setShowTaxYearModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Plus className="w-4 h-4" /> New Tax Year
              </button>
            )}
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider">Total Income</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">£{totalIncome.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-2">Combined Card + Cash</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider">Square Card Income</span>
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">£{totalCardIncome.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-2">Card payments</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider">Total Outgoing</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">£{totalExpenses.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-2">Expenses recorded</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider">Net Profit</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <PoundSterling className="w-4 h-4" />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  £{netProfit.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-2">Income minus Outgoing</p>
              </div>
            </div>


{/* Monthly Financial Overview Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white text-sm mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Monthly Incoming vs Outgoing
              </h3>
              <div className="h-72 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                        formatter={(value: any) => [`£${Number(value).toFixed(2)}`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="incoming" name="Incoming (£)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="outgoing" name="Outgoing (£)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    No transaction data available for charting in this tax year.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4 text-emerald-400" /> Recent Incoming Sales
                  </h3>
                  <button onClick={() => setActiveTab('incoming')} className="text-xs text-emerald-400 hover:underline">View all</button>
                </div>
                <div className="space-y-3">
                  {incomingList.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{item.description}</p>
                        <p className="text-xs text-slate-500">{item.date} • {item.source}</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-400">+£{(item.cardAmount + item.cashAmount).toFixed(2)}</span>
                    </div>
                  ))}
                  {incomingList.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No incoming records for this tax year.</p>}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-rose-400" /> Recent Outgoing Payments
                  </h3>
                  <button onClick={() => setActiveTab('outgoing')} className="text-xs text-emerald-400 hover:underline">View all</button>
                </div>
                <div className="space-y-3">
                  {outgoingList.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{item.description}</p>
                        <p className="text-xs text-slate-500">{item.date} • {item.seller}</p>
                      </div>
                      <span className="text-sm font-semibold text-rose-400">-£{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {outgoingList.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No outgoing records for this tax year.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'incoming' && (
          <div className="p-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Source</th>
                      <th className="p-4 font-semibold">Description</th>
                      <th className="p-4 font-semibold text-right">Card Amount</th>
                      <th className="p-4 font-semibold text-right">Cash Amount</th>
                      <th className="p-4 font-semibold text-right">Total (£)</th>
                      <th className="p-4 font-semibold">Notes</th>
                      <th className="p-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {incomingList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-mono text-xs">{item.date}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            item.source === 'Square' 
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                              : item.source === 'Card'
                              ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {item.source}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-white">{item.description}</td>
                        <td className="p-4 text-right font-mono">£{item.cardAmount.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono">£{item.cashAmount.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-400">
                          £{(item.cardAmount + item.cashAmount).toFixed(2)}
                        </td>
                        <td className="p-4 text-xs text-slate-400 max-w-xs truncate">{item.notes || '-'}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingIncoming(item);
                                setIncForm({
                                  date: item.date,
                                  source: item.source,
                                  description: item.description,
                                  cardAmount: item.cardAmount.toString(),
                                  cashAmount: item.cashAmount.toString(),
                                  notes: item.notes || '',
                                });
                                setShowIncomingModal(true);
                              }}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteIncoming(item.id)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-rose-900/40 text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {incomingList.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          No incoming transactions found for this tax year.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'outgoing' && (
          <div className="p-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Seller</th>
                      <th className="p-4 font-semibold">Order #</th>
                      <th className="p-4 font-semibold">Invoice #</th>
                      <th className="p-4 font-semibold">Description</th>
                      <th className="p-4 font-semibold text-right">Amount (£)</th>
                      <th className="p-4 font-semibold">Payment Type</th>
                      <th className="p-4 font-semibold">Notes</th>
                      <th className="p-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {outgoingList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-mono text-xs">{item.date}</td>
                        <td className="p-4 font-medium text-white">{item.seller}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">{item.orderNo || '-'}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">{item.invoiceNo || '-'}</td>
                        <td className="p-4 text-slate-200">{item.description}</td>
                        <td className="p-4 text-right font-mono font-bold text-rose-400">£{item.amount.toFixed(2)}</td>
                        <td className="p-4 text-xs">
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            {item.paymentType}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-400 max-w-xs truncate">{item.notes || '-'}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOutgoing(item);
                                setOutForm({
                                  date: item.date,
                                  seller: item.seller,
                                  orderNo: item.orderNo || '',
                                  invoiceNo: item.invoiceNo || '',
                                  description: item.description,
                                  amount: item.amount.toString(),
                                  paymentType: item.paymentType,
                                  notes: item.notes || '',
                                });
                                setShowOutgoingModal(true);
                              }}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOutgoing(item.id)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-rose-900/40 text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {outgoingList.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-500">
                          No outgoing transactions found for this tax year.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax-years' && (
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {taxYears.map(ty => (
                <div key={ty.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Tax Year {ty.label}</h3>
                    {ty.isCurrent && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-xs text-slate-400">
                    <p>Start Date: <span className="text-slate-200">{ty.startDate.split('T')[0]}</span></p>
                    <p>End Date: <span className="text-slate-200">{ty.endDate.split('T')[0]}</span></p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedTaxYearId(ty.id)}
                      className="text-xs text-emerald-400 hover:underline font-medium"
                    >
                      Select Active Year
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showIncomingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingIncoming ? 'Edit Incoming Transaction' : 'Record Incoming Transaction'}
            </h3>
            <form onSubmit={handleSaveIncoming} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={incForm.date}
                  onChange={(e) => setIncForm({ ...incForm, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Source</label>
                <select
                  value={incForm.source}
                  onChange={(e) => setIncForm({ ...incForm, source: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                >
                  <option value="Square">Square</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pop-up Event Sales"
                  value={incForm.description}
                  onChange={(e) => setIncForm({ ...incForm, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Card Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={incForm.cardAmount}
                    onChange={(e) => setIncForm({ ...incForm, cardAmount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cash Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={incForm.cashAmount}
                    onChange={(e) => setIncForm({ ...incForm, cashAmount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes..."
                  value={incForm.notes}
                  onChange={(e) => setIncForm({ ...incForm, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowIncomingModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/20"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOutgoingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingOutgoing ? 'Edit Outgoing Transaction' : 'Record Outgoing Transaction'}
            </h3>
            <form onSubmit={handleSaveOutgoing} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={outForm.date}
                    onChange={(e) => setOutForm({ ...outForm, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Seller</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Supplier Name"
                    value={outForm.seller}
                    onChange={(e) => setOutForm({ ...outForm, seller: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Order Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-102"
                    value={outForm.orderNo}
                    onChange={(e) => setOutForm({ ...outForm, orderNo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-501"
                    value={outForm.invoiceNo}
                    onChange={(e) => setOutForm({ ...outForm, invoiceNo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Studio Rent or Materials"
                  value={outForm.description}
                  onChange={(e) => setOutForm({ ...outForm, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={outForm.amount}
                    onChange={(e) => setOutForm({ ...outForm, amount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payment Type</label>
                  <select
                    value={outForm.paymentType}
                    onChange={(e) => setOutForm({ ...outForm, paymentType: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                  >
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Direct Debit">Direct Debit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes..."
                  value={outForm.notes}
                  onChange={(e) => setOutForm({ ...outForm, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>
<div className="flex justify-end gap-3 pt-3">
  <button
    type="button"
    onClick={() => {
      setShowOutgoingModal(false);
      setEditingOutgoing(null);
    }}
    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
  >
    Cancel
  </button>
  <button
    type="submit"
    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition-all"
  >
    Save Record
  </button>
</div>
            </form>
          </div>
        </div>
      )}

      {showTaxYearModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create Tax Year</h3>
            <form onSubmit={handleCreateTaxYear} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tax Year Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2025/26"
                  value={taxYearForm.label}
                  onChange={(e) => setTaxYearForm({ ...taxYearForm, label: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={taxYearForm.startDate}
                  onChange={(e) => setTaxYearForm({ ...taxYearForm, startDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={taxYearForm.endDate}
                  onChange={(e) => setTaxYearForm({ ...taxYearForm, endDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTaxYearModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/20"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
