import Papa from 'papaparse';

/**
 * SILL — Sistema Inteligente de Logística Local
 * Conexão via Link Público (CSV) e Apps Script
 */

// URL que você publicou na web (CSV)
const PUBLIC_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjijoAtdJuhYip-xHT0RJjzgV-JRmWFfuoqvFf_CZDkgkS_jRdI2UPJHcf_g-5Tw/pub?output=csv";

// ── Interfaces ──────────────────────────────────────────────────
export interface SheetUser {
  id: string;
  name: string;
  role: 'manager' | 'driver';
  pin: string;
  whatsapp?: string;
  email?: string;
  galpao?: string;
  veiculo?: string;
  placa?: string;
  ativo?: string;
}

export interface SheetDelivery {
  id: string;
  packageId: string;
  pedidoId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  bairro: string;
  cep: string;
  galpaoOrigem: string;
  driverId: string;
  driverName: string;
  status: 'pending' | 'in-transit' | 'delivered' | 'delayed';
  startTime?: string;
  endTime?: string;
  lat?: string;
  lng?: string;
  photoProof?: string;
  tentativas?: string;
  motivoInsucesso?: string;
  rowIndex: number;
}

// ── Funções de Leitura (Via PapaParse - Sem Erro 404) ────────────

/**
 * Busca todos os dados da planilha de uma vez só de forma otimizada
 */
const fetchAllSheetData = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(PUBLIC_SHEET_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
};

export async function fetchUsuarios(): Promise<SheetUser[]> {
  const data = await fetchAllSheetData();
  // Filtra apenas o que parece ser usuário (ajuste os nomes das colunas se necessário)
  return data
    .filter(r => r['ID'] || r['id']) 
    .map(r => ({
      id: r['ID'] || r['id'] || '',
      name: r['Nome'] || r['name'] || '',
      role: (r['Função'] === 'gestor' ? 'manager' : 'driver'),
      pin: String(r['PIN'] || r['pin'] || ''),
      whatsapp: r['WhatsApp'] || '',
      email: r['Email'] || '',
      ativo: r['Ativo'] || 'SIM',
    }));
}

export async function fetchEntregas(): Promise<SheetDelivery[]> {
  const data = await fetchAllSheetData();
  return data
    .filter(r => r['Cód. Pedido'] || r['pedidoId'])
    .map((r, idx) => ({
      id: String(idx + 1),
      pedidoId: r['Cód. Pedido'] || '',
      packageId: r['Cód. Rastreio'] || r['Cód. Pedido'] || '',
      customerName: r['Cliente'] || '',
      customerPhone: r['Telefone'] || '',
      address: r['Endereço'] || '',
      bairro: r['Bairro'] || '',
      cep: r['CEP'] || '',
      status: mapStatus(r['Status'] || 'pendente'),
      rowIndex: idx + 3,
    }));
}

// ── Helpers de Status ──────────────────────────────────────────
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

// ── Funções de Escrita (Importante!) ───────────────────────────
/**
 * Para que estas funções funcionem, você precisará colar o código do 
 * Apps Script (enviado anteriormente) na sua planilha e colocar a URL aqui.
 */
const APPS_SCRIPT_URL = "COLE_AQUI_A_URL_DO_SEU_APPS_SCRIPT_APOS_IMPLANTAR";

export async function updateEntregaStatus(payload: any): Promise<void> {
  if (APPS_SCRIPT_URL.includes("COLE_AQUI")) {
    console.warn("URL do Apps Script não configurada. A escrita não funcionará.");
    return;
  }

  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}