/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LogIn, 
  Truck, 
  LayoutDashboard, 
  Search, 
  LogOut, 
  Globe, 
  Package, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Camera,
  ChevronRight,
  Filter,
  Map,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Language, User, Delivery, UserRole, DeliveryStatus } from './types';
import { translations } from './translations';
import { mockUsers, mockDeliveries } from './mockData';
import { fetchUsuarios, fetchEntregas } from './googleSheets';

export default function App() {
  const [lang, setLang] = useState<Language>('pt');
  const [user, setUser] = useState<User | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries);
  const [currentScreen, setCurrentScreen] = useState<'login' | 'driver' | 'manager' | 'customer'>('login');

  const t = translations[lang];

  useEffect(() => {
    const interval = setInterval(() => {
      setDeliveries(prev => prev.map(d => {
        if (d.status === 'in-transit' && d.startTime) {
          const start = new Date(d.startTime).getTime();
          const now = Date.now();
          const diffMinutes = (now - start) / 60000;
          if (diffMinutes > 45) {
            return { ...d, status: 'delayed' as DeliveryStatus };
          }
        }
        return d;
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (nameOrId: string, pin: string, role: UserRole) => {
    if (role === 'customer') {
      setCurrentScreen('customer');
      return;
    }
    const foundUser = mockUsers.find(u => (u.name === nameOrId || u.id === nameOrId) && u.pin === pin && u.role === role);
    if (foundUser) {
      setUser(foundUser);
      setCurrentScreen(role === 'manager' ? 'manager' : 'driver');
    } else {
      alert(t.invalidLogin);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
  };

  const updateDeliveryStatus = (id: string, status: DeliveryStatus, extra?: Partial<Delivery>) => {
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status, ...extra } : d));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-blue-700 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Truck className="w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold leading-none">{t.title}</h1>
            <p className="text-[10px] opacity-80 uppercase tracking-wider">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-sm transition-colors"
          >
            <Globe className="w-4 h-4" />
            {lang.toUpperCase()}
          </button>
          {user && (
            <button 
              onClick={handleLogout}
              className="p-1 hover:bg-blue-600 rounded transition-colors"
              title={t.logout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-20">
        <AnimatePresence mode="wait">
          {currentScreen === 'login' && (
            <LoginScreen key="login" t={t} onLogin={handleLogin} />
          )}
          {currentScreen === 'driver' && user && (
            <DriverScreen 
              key="driver" 
              t={t} 
              user={user} 
              deliveries={deliveries.filter(d => !d.driverId || d.driverId === user.id)} 
              onUpdate={updateDeliveryStatus}
            />
          )}
          {currentScreen === 'manager' && user && (
            <ManagerDashboard 
              key="manager" 
              t={t} 
              deliveries={deliveries} 
            />
          )}
          {currentScreen === 'customer' && (
            <CustomerTracking 
              key="customer" 
              t={t} 
              deliveries={deliveries}
              onBack={() => setCurrentScreen('login')}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 text-center text-[10px] text-slate-400 uppercase tracking-widest">
        SILL &copy; 2026 - Logistics Intelligence
      </footer>
    </div>
  );
}

// ── LOGIN ──────────────────────────────────────────────────────
function LoginScreen({ t, onLogin }: { key?: string, t: any, onLogin: (n: string, p: string, r: UserRole) => void }) {
  const [role, setRole] = useState<UserRole>('driver');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 mt-8"
    >
      <div className="text-center mb-8">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="text-blue-700 w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{t.login}</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">{t.role}</label>
          <div className="grid grid-cols-3 gap-2">
            {(['manager', 'driver', 'customer'] as UserRole[]).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all border ${
                  role === r 
                    ? 'bg-blue-700 text-white border-blue-700 shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                }`}
              >
                {t[r]}
              </button>
            ))}
          </div>
        </div>

        {role !== 'customer' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t.nameOrId}</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Ex: D001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t.pin}</label>
              <input 
                type="password" 
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="****"
              />
            </div>
          </>
        )}

        <button 
          onClick={() => onLogin(name, pin, role)}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {t.login}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

// ── DRIVER ─────────────────────────────────────────────────────
function DriverScreen({ t, user, deliveries, onUpdate }: { key?: string, t: any, user: User, deliveries: Delivery[], onUpdate: any }) {
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleComplete = (id: string) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          onUpdate(id, 'delivered', {
            endTime: new Date().toISOString(),
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
          });
        },
        () => {
          onUpdate(id, 'delivered', { endTime: new Date().toISOString() });
        }
      );
    } else {
      onUpdate(id, 'delivered', { endTime: new Date().toISOString() });
    }
    setCompletingId(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mt-4">
      <h2 className="text-2xl font-bold text-slate-800">{t.myDeliveries}</h2>
      {deliveries.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Nenhuma entrega atribuída</p>
        </div>
      )}
      {deliveries.map(d => (
        <div key={d.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-mono text-xs font-bold text-blue-700">{d.packageId}</p>
              <p className="font-semibold text-slate-800">{d.customerName}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
              d.status === 'delivered' ? 'bg-green-100 text-green-700' :
              d.status === 'in-transit' ? 'bg-blue-100 text-blue-700' :
              d.status === 'delayed' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {t[d.status.replace('-', '') as keyof typeof t] || d.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{d.address}</span>
          </div>
          {d.status === 'pending' && (
            <button
              onClick={() => onUpdate(d.id, 'in-transit', { driverId: user.id, driverName: user.name, startTime: new Date().toISOString() })}
              className="w-full py-3 rounded-xl bg-blue-700 text-white font-bold text-sm hover:bg-blue-800 transition-colors"
            >
              {t.outForDelivery}
            </button>
          )}
          {(d.status === 'in-transit' || d.status === 'delayed') && (
            <button
              onClick={() => setCompletingId(d.id)}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors"
            >
              {t.delivered}
            </button>
          )}
        </div>
      ))}

      <AnimatePresence>
        {completingId && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-800">{t.confirmDelivery}</h3>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl text-green-700 text-sm">
                <MapPin className="w-5 h-5" />
                <span>{t.locationCaptured}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCompletingId(null)}
                  className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleComplete(completingId)}
                  className="flex-[2] py-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  {t.confirmDelivery}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── MAPA ───────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  'pending':    '#7B5B00',
  'in-transit': '#2E75B6',
  'delivered':  '#1D6B4F',
  'delayed':    '#E26B0A',
  'failed':     '#C00000',
};

function getCoords(delivery: Delivery): [number, number] {
  const addr = delivery.address || '';
  if (addr.includes('Paulista'))  return [-4.9686, -39.0166];
  if (addr.includes('Augusta'))   return [-4.9670, -39.0190];
  if (addr.includes('Santos'))    return [-4.9710, -39.0140];
  if (addr.includes('Oscar'))     return [-4.9580, -39.0180];
  if (addr.includes('Faria'))     return [-4.9550, -39.0200];
  if (addr.includes('Pamplona'))  return [-4.9800, -39.0160];
  const seed = delivery.id.charCodeAt(0) * 0.001;
  return [-4.9686 + seed * 0.01 - 0.005, -39.0166 + seed * 0.008 - 0.004];
}

function MapaEntregas({ deliveries, t }: { deliveries: Delivery[], t: any }) {
  const mapRef    = useRef<L.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;
    const map = L.map(mapDivRef.current, { zoomControl: true }).setView([-4.9686, -39.0166], 14);
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap | SILL'
    }).addTo(map);
    const galpaoIcon = L.divIcon({
      html: `<div style="background:#1A3E6E;color:white;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.4)">🏭 Galpão Central</div>`,
      className: '', iconAnchor: [65, 12],
    });
    L.marker([-4.9686, -39.0166], { icon: galpaoIcon }).addTo(map);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        const html = (layer.options as any)?.icon?.options?.html || '';
        if (html.includes('Galpão')) return;
        map.removeLayer(layer);
      }
    });
    deliveries.forEach(d => {
      const coords = getCoords(d);
      const cor = statusColors[d.status] || '#888';
      const statusPT: Record<string,string> = {
        'pending':'Pendente','in-transit':'Em Rota',
        'delivered':'Entregue','delayed':'Atrasado','failed':'Insucesso'
      };
      const icon = L.divIcon({
        html: `<div style="width:16px;height:16px;background:${cor};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,0.4);"></div>`,
        className: '', iconAnchor: [8, 8],
      });
      L.marker(coords, { icon })
        .bindPopup(`
          <div style="font-family:Arial;min-width:180px;">
            <b style="color:#1A3E6E;font-size:13px;">${d.packageId}</b><br/>
            <span style="font-size:11px;color:#444;">${d.customerName}</span><br/>
            <span style="font-size:10px;color:#888;">${d.address}</span><br/>
            <span style="font-size:11px;font-weight:bold;color:${cor};margin-top:4px;display:block;">● ${statusPT[d.status] || d.status}</span>
            ${d.driverName ? `<span style="font-size:10px;color:#555;">🚴 ${d.driverName}</span>` : ''}
          </div>
        `)
        .addTo(map);
    });
  }, [deliveries]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
      <div style={{ background: '#1A3E6E', color: 'white', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontWeight: 'bold', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Map size={16}/> Mapa de Entregas — Quixadá, CE
        </span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            ['pending','#7B5B00','Pendente'],
            ['in-transit','#2E75B6','Em Rota'],
            ['delivered','#1D6B4F','Entregue'],
            ['delayed','#E26B0A','Atrasado'],
          ].map(([,cor,label]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: cor as string, display: 'inline-block', border: '1.5px solid white' }}/>
              {label}
            </span>
          ))}
        </div>
      </div>
      <div ref={mapDivRef} style={{ height: '380px', width: '100%' }} />
      <div style={{ background: '#f8fafc', padding: '6px 14px', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
        Clique em qualquer ponto para ver os detalhes · © OpenStreetMap
      </div>
    </div>
  );
}

// ── MANAGER DASHBOARD ──────────────────────────────────────────
function ManagerDashboard({ t, deliveries }: { key?: string, t: any, deliveries: Delivery[] }) {
  const [filterDriver, setFilterDriver] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showMap, setShowMap]           = useState(true);

  const stats = useMemo(() => ({
    total:     deliveries.length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    inTransit: deliveries.filter(d => d.status === 'in-transit').length,
    delayed:   deliveries.filter(d => d.status === 'delayed').length,
    pending:   deliveries.filter(d => d.status === 'pending').length,
  }), [deliveries]);

  const drivers = Array.from(new Set(deliveries.filter(d => d.driverName).map(d => d.driverName)));

  const filteredDeliveries = deliveries.filter(d => {
    const matchDriver = filterDriver === 'all' || d.driverName === filterDriver;
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchDriver && matchStatus;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">{t.dashboard}</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.totalDeliveries}</p>
          <p className="text-2xl font-black text-blue-700">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.delivered}</p>
          <p className="text-2xl font-black text-green-600">{stats.delivered}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.inTransit}</p>
          <p className="text-2xl font-black text-blue-500">{stats.inTransit}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.delayed}</p>
          <p className="text-2xl font-black text-red-500">{stats.delayed}</p>
        </div>
      </div>

      {/* Botão mostrar/ocultar mapa */}
      <button
        onClick={() => setShowMap(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 transition-colors"
      >
        <Map className="w-4 h-4" />
        {showMap ? 'Ocultar Mapa' : 'Ver Mapa de Entregas'}
      </button>

      {/* MAPA */}
      {showMap && <MapaEntregas deliveries={filteredDeliveries} t={t} />}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-bold uppercase tracking-tight">Filtros:</span>
        </div>
        <select 
          value={filterDriver}
          onChange={e => setFilterDriver(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{t.allDrivers}</option>
          {drivers.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select 
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{t.allStatus}</option>
          <option value="pending">{t.pending}</option>
          <option value="in-transit">{t.inTransit}</option>
          <option value="delivered">{t.delivered}</option>
          <option value="delayed">{t.delayed}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">{t.packageId}</th>
                <th className="px-6 py-4">{t.driverName}</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">{t.timestamp}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDeliveries.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-blue-700">{d.packageId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{d.driverName || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      d.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      d.status === 'in-transit' ? 'bg-blue-100 text-blue-700' :
                      d.status === 'delayed' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {t[d.status.replace('-', '') as keyof typeof t] || d.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {d.endTime ? new Date(d.endTime).toLocaleTimeString() : (d.startTime ? new Date(d.startTime).toLocaleTimeString() : '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// ── CUSTOMER TRACKING ──────────────────────────────────────────
function CustomerTracking({ t, deliveries, onBack }: { key?: string, t: any, deliveries: Delivery[], onBack: () => void }) {
  const [searchId, setSearchId] = useState('');
  const [result, setResult] = useState<Delivery | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    const found = deliveries.find(d => d.packageId.toLowerCase() === searchId.toLowerCase());
    setResult(found || null);
    setSearched(true);
  };

  const statusSteps = ['pending', 'in-transit', 'delivered'];
  const currentStepIndex = result ? (result.status === 'delayed' ? 1 : statusSteps.indexOf(result.status)) : -1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">{t.trackOrder}</h2>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              placeholder={t.enterOrderId}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-blue-700 text-white px-6 rounded-2xl font-bold hover:bg-blue-800 transition-all active:scale-95"
          >
            {t.track}
          </button>
        </div>
      </div>

      {searched && !result && (
        <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">{t.orderNotFound}</p>
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.orderStatus}</p>
              <h3 className="text-2xl font-black text-slate-800">{result.packageId}</h3>
            </div>
            <div className={`px-4 py-2 rounded-2xl text-sm font-bold uppercase ${
              result.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {t[result.status.replace('-', '') as keyof typeof t] || result.status}
            </div>
          </div>

          <div className="relative pt-12 pb-8 px-4">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-1000"
              style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}></div>
            <div className="relative flex justify-between">
              {statusSteps.map((step, idx) => {
                const isActive  = idx <= currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                      isActive ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-200' : 'bg-white border-2 border-slate-200 text-slate-300'
                    }`}>
                      {idx === 0 && <Package className="w-4 h-4" />}
                      {idx === 1 && <Truck className="w-4 h-4" />}
                      {idx === 2 && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                      {t[step.replace('-', '') as keyof typeof t] || step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {result.status === 'in-transit' && (
            <div className="bg-blue-50 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-xl text-white"><Clock className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">{t.estimatedDelivery}</p>
                <p className="text-lg font-bold text-slate-800">15 - 25 {t.minutes}</p>
              </div>
            </div>
          )}

          {result.status === 'delayed' && (
            <div className="bg-red-50 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-red-600 p-3 rounded-xl text-white"><AlertCircle className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider">{t.delayed}</p>
                <p className="text-sm font-medium text-slate-700">Estamos enfrentando um pequeno atraso. Seu pedido chegará em breve.</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
