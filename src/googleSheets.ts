/**
 * SILL — Serviço de integração com Google Sheets
 * Lê e escreve dados na planilha do cliente
 */

const API_KEY = 'AIzaSyDpT6oXIYEURu19f4970JWE8JPgCTXS3uQ';
const SHEET_ID = '1qQz2DVIFUEUo3oA-u7n2md7r-ggzRG0m';
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

// ── Nomes das abas na planilha ──────────────────────────────────
const ABAS = {
  usuarios:  '👥 Usuários',
  entregas:  '📦 Entregas',
  clientes:  '👤 Clientes',
  galpoes:   '🏭 Galpões',
  zonas:     '🗺️ Zonas Quixadá',
  kpis:      '📈 KPIs',
};

// ── Helper: buscar intervalo da planilha ───────────────────────
async function getRange(aba: string, range: string): Promise<any[][]> {
  const encodedAba = encodeURIComponent(`${aba}!${range}`);
  const url = `${BASE_URL}/values/${encodedAba}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao ler planilha: ${res.statusText}`);
  const data = await res.json();
  return data.values || [];
}

// ── Helper: escrever em intervalo da planilha ──────────────────
async function setRange(aba: string, range: string, values: any[][]): Promise<void> {
  const encodedAba = encodeURIComponent(`${aba}!${range}`);
  const url = `${BASE_URL}/values/${encodedAba}?valueInputOption=USER_ENTERED&key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) throw new Error(`Erro ao escrever planilha: ${res.statusText}`);
}

// ── Helper: adicionar linha na planilha ────────────────────────
async function appendRow(aba: string, range: string, values: any[][]): Promise<void> {
  const encodedAba = encodeURIComponent(`${aba}!${range}`);
  const url = `${BASE_URL}/values/${encodedAba}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS&key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) throw new Error(`Erro ao adicionar linha: ${res.statusText}`);
}

// ══════════════════════════════════════════════════════════════
// USUÁRIOS
// ══════════════════════════════════════════════════════════════
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

export async function fetchUsuarios(): Promise<SheetUser[]> {
  // Linha 2 em diante (linha 1 é cabeçalho)
  const rows = await getRange(ABAS.usuarios, 'A3:L200');
  return rows
    .filter(r => r[0] && r[10] !== 'NÃO') // tem ID e está ativo
    .map(r => ({
      id:       r[0] || '',
      name:     r[1] || '',
      role:     (r[2] === 'gestor' ? 'manager' : 'driver') as 'manager' | 'driver',
      pin:      String(r[3] || ''),
      whatsapp: r[4] || '',
      email:    r[5] || '',
      galpao:   r[6] || '',
      veiculo:  r[7] || '',
      placa:    r[8] || '',
      ativo:    r[10] || 'SIM',
    }));
}

// ══════════════════════════════════════════════════════════════
// ENTREGAS
// ══════════════════════════════════════════════════════════════
export interface SheetDelivery {
  id: string;          // linha index como ID interno
  packageId: string;   // Cód. Rastreio
  pedidoId: string;    // Cód. Pedido
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
  rowIndex: number;    // índice real na planilha (para updates)
}

// Mapeia status em português para o padrão do app
function mapStatus(s: string): SheetDelivery['status'] {
  const map: Record<string, SheetDelivery['status']> = {
    'pendente':   'pending',
    'em rota':    'in-transit',
    'entregue':   'delivered',
    'atrasado':   'delayed',
    'insucesso':  'delayed',
  };
  return map[s?.toLowerCase()] || 'pending';
}

// Mapeia status do app para português
function mapStatusPT(s: string): string {
  const map: Record<string, string> = {
    'pending':    'pendente',
    'in-transit': 'em rota',
    'delivered':  'entregue',
    'delayed':    'atrasado',
  };
  return map[s] || 'pendente';
}

export async function fetchEntregas(): Promise<SheetDelivery[]> {
  const rows = await getRange(ABAS.entregas, 'A3:U500');
  return rows
    .filter(r => r[0]) // tem código de pedido
    .map((r, idx) => ({
      id:            String(idx + 1),
      pedidoId:      r[0]  || '',
      packageId:     r[1]  || r[0] || '',  // Cód. Rastreio ou Pedido
      customerName:  r[3]  || '',
      customerPhone: r[4]  || '',
      address:       `${r[5] || ''}, ${r[6] || ''} - Quixadá, CE`,
      bairro:        r[6]  || '',
      cep:           r[7]  || '',
      galpaoOrigem:  r[8]  || '',
      driverId:      r[9]  || '',
      driverName:    r[10] || '',
      status:        mapStatus(r[11] || 'pendente'),
      startTime:     r[12] && r[12] !== '—' ? r[12] : undefined,
      endTime:       r[13] && r[13] !== '—' ? r[13] : undefined,
      lat:           r[15] || '',
      lng:           r[16] || '',
      photoProof:    r[17] || '',
      tentativas:    r[18] || '0',
      motivoInsucesso: r[19] || '',
      rowIndex:      idx + 3, // linha real na planilha (começa na 3)
    }));
}

// Atualiza status de uma entrega na planilha
export async function updateEntregaStatus(
  rowIndex: number,
  status: string,
  driverId?: string,
  driverName?: string,
  startTime?: string,
  endTime?: string,
  lat?: string,
  lng?: string,
): Promise<void> {
  const statusPT = mapStatusPT(status);
  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Coluna L = status (índice 11 = coluna 12 = L)
  await setRange(ABAS.entregas, `J${rowIndex}:Q${rowIndex}`, [[
    driverId   || '—',
    driverName || '—',
    statusPT,
    startTime  || (status === 'in-transit' ? now : '—'),
    endTime    || (status === 'delivered'  ? now : '—'),
    '',  // tempo calculado pela fórmula
    lat  || '—',
    lng  || '—',
  ]]);
}

// ══════════════════════════════════════════════════════════════
// CICLO MENSAL — Verificação e renovação automática
// ══════════════════════════════════════════════════════════════

const CYCLE_KEY = 'sill_cycle_start';

export function getCycleInfo(): { startDate: Date; daysLeft: number; isExpired: boolean } {
  const stored = localStorage.getItem(CYCLE_KEY);
  let startDate: Date;

  if (stored) {
    startDate = new Date(stored);
  } else {
    // Primeiro uso: inicia ciclo agora
    startDate = new Date();
    localStorage.setItem(CYCLE_KEY, startDate.toISOString());
  }

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = 31 - diffDays;
  const isExpired = diffDays >= 31;

  return { startDate, daysLeft, isExpired };
}

// Renova o ciclo: arquiva entregas antigas e limpa a aba
export async function renewCycle(): Promise<void> {
  // 1. Busca todas as entregas atuais
  const entregas = await fetchEntregas();

  // 2. Cria nova aba de arquivo com timestamp (via API batchUpdate seria necessário OAuth)
  //    Como usamos API Key (somente leitura para escrita via PUT), apenas limpamos as linhas de dados
  //    e mantemos o cabeçalho. Para arquivamento real precisaria de OAuth2.
  //    Por ora: limpa os dados das entregas (linhas 3 em diante), preservando cabeçalho

  if (entregas.length > 0) {
    // Cria array de linhas vazias para sobrescrever dados antigos
    const emptyRows = entregas.map(() => Array(21).fill(''));
    await setRange(ABAS.entregas, `A3:U${entregas.length + 2}`, emptyRows);
  }

  // 3. Reinicia o ciclo
  localStorage.setItem(CYCLE_KEY, new Date().toISOString());
}
