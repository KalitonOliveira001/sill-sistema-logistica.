import Papa from 'papaparse';

/**
 * SILL — Sistema Inteligente de Logística Local
 * URLs das abas específicas publicadas em CSV
 */

// Link da aba 👥 Usuários (conforme seu envio anterior)
const USERS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjijoAtdJuhYip-xHT0RJjzgV-JRmWFfuoqvFf_CZDkgkS_jRdI2UPJHcf_g-5Tw/pub?gid=256076925&single=true&output=csv";

// Link da aba 📦 Entregas (conforme seu envio mais recente)
const DELIVERIES_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjijoAtdJuhYip-xHT0RJjzgV-JRmWFfuoqvFf_CZDkgkS_jRdI2UPJHcf_g-5Tw/pub?gid=994745382&single=true&output=csv";

// ── Interfaces ──────────────────────────────────────────────────
export interface SheetUser {
  id: string;
  name: string;
  role: 'manager' | 'driver';
  pin: string;
  whatsapp?: string;
  email?: string;
  ativo?: string;
}

export interface SheetDelivery {
  id: string;
  pedidoId: string;
  packageId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  bairro: string;
  cep: string;
  status: 'pending' | 'in-transit' | 'delivered' | 'delayed';
  rowIndex: number;
}

// ── Funções de Leitura ──────────────────────────────────────────

const fetchSheetData = (url: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
};

export async function fetchUsuarios(): Promise<SheetUser[]> {
  const data = await fetchSheetData(USERS_SHEET_URL);
  return data.map(r => ({
    id: r['ID Usuário'] || '',
    name: r['Nome Completo'] || '',
    role: (r['Função']?.toLowerCase() === 'gestor' ? 'manager' : 'driver'),
    pin: String(r['PIN (senha)'] || ''),
    whatsapp: r['WhatsApp'] || '',
    email: r['E-mail'] || '',
    ativo: r['Ativo'] || 'SIM',
  }));
}

export async function fetchEntregas(): Promise<SheetDelivery[]> {
  const data = await fetchSheetData(DELIVERIES_SHEET_URL);
  return data.map((r, idx) => ({
    id: String(idx + 1),
    pedidoId: r['Cód. Pedido'] || '',
    packageId: r['Cód. Rastreio'] || '',
    customerName: r['Nome Cliente'] || '',
    customerPhone: r['Telefone Cliente'] || '',
    address: r['Endereço Entrega'] || '',
    bairro: r['Bairro'] || '',
    cep: r['CEP'] || '',
    status: mapStatus(r['Status'] || 'pendente'),
    rowIndex: idx + 2,
  }));
}

// ── Helpers ─────────────────────────────────────────────────────
function mapStatus(s: string): SheetDelivery['status'] {
  const map: Record<string, SheetDelivery['status']> = {
    'pendente': 'pending',
    'em rota': 'in-transit',
    'entregue': 'delivered',
    'atrasado': 'delayed',
    'insucesso': 'delayed',
  };
  return map[s?.toLowerCase()] || 'pending';
}