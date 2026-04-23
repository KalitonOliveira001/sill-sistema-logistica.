c/**
 * SILL - Sistema Inteligente de Logística Local
 * Integração com Google Sheets (Leitura e Escrita)
 * CORRIGIDO: Nomes das funções sincronizados com App.tsx
 */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwNpjzwAH9VhS9pf-A7k5JQ8yDc3NLQq8nDOWZtuxfjXu8krWx34U42Gs0OC_NBg3U/exec";

const USERS_SHEET_URL = "https://docs.google.com/spreadsheets/d/1O_gNcCvvf0fBfnY1Qs37T3n00EQB3AH4Auqm9PSgSig/gviz/tq?tqx=out:csv&sheet=USUÁRIOS";
const DELIVERIES_SHEET_URL = "https://docs.google.com/spreadsheets/d/1O_gNcCvvf0fBfnY1Qs37T3n00EQB3AH4Auqm9PSgSig/gviz/tq?tqx=out:csv&sheet=ENTREGAS";

// 1. FUNÇÃO DE BUSCAR USUÁRIOS (Corrigida para fetchUsuarios)
export const fetchUsuarios = async () => {
  try {
    const response = await fetch(USERS_SHEET_URL);
    const csvText = await response.text();
    return processCSV(csvText);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
};

// 2. FUNÇÃO DE BUSCAR ENTREGAS (Adicionada)
export const fetchEntregas = async () => {
  try {
    const response = await fetch(DELIVERIES_SHEET_URL);
    const csvText = await response.text();
    return processCSV(csvText);
  } catch (error) {
    console.error("Erro ao buscar entregas:", error);
    return [];
  }
};

// 3. FUNÇÃO DE SALVAR USUÁRIO
export const saveUser = async (userData: any) => {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addUser',
        ...userData
      }),
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar usuário:", error);
    return { success: false };
  }
};

// 4. FUNÇÃO DE ATUALIZAR STATUS
export const updateDeliveryStatus = async (pedidoId: string, status: string) => {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateStatus',
        pedidoId,
        status
      }),
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return { success: false };
  }
};

// AUXILIAR PARA PROCESSAR CSV
const processCSV = (csv: string) => {
  if (!csv) return [];
  const lines = csv.split('\n');
  const result = [];
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  for (let i = 1; i < lines.length; i++) {
    const obj: any = {};
    const currentline = lines[i].split(',').map(c => c.replace(/"/g, '').trim());

    if (currentline.length === headers.length) {
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }
      result.push(obj);
    }
  }
  return result;
};