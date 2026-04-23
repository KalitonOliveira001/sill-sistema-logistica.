/**
 * SILL - Sistema Inteligente de Logística Local
 * Versão Final Corrigida - Sem erros de referência
 */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwNpjzwAH9VhS9pf-A7k5JQ8yDc3NLQq8nDOWZtuxfjXu8krWx34U42Gs0OC_NBg3U/exec";

const USERS_SHEET_URL = "https://docs.google.com/spreadsheets/d/1O_gNcCvvf0fBfnY1Qs37T3n00EQB3AH4Auqm9PSgSig/gviz/tq?tqx=out:csv&sheet=USUÁRIOS";
const DELIVERIES_SHEET_URL = "https://docs.google.com/spreadsheets/d/1O_gNcCvvf0fBfnY1Qs37T3n00EQB3AH4Auqm9PSgSig/gviz/tq?tqx=out:csv&sheet=ENTREGAS";

// 1. BUSCAR USUÁRIOS
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

// 2. BUSCAR ENTREGAS
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

// 3. SALVAR USUÁRIO (Escrita)
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

// 4. ATUALIZAR STATUS (Escrita)
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

// AUXILIAR: PROCESSA O CSV DA PLANILHA (VERSÃO SEGURA)
const processCSV = (csv: string) => {
  if (!csv || !csv.includes('\n')) return [];
  
  const lines = csv.split('\n');
  const result = [];
  
  // Pega os cabeçalhos e limpa aspas/espaços
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  for (let i = 1; i < lines.length; i++) {
    const rowText = lines[i].trim();
    if (!rowText) continue;

    const obj: any = {};
    const currentline = rowText.split(',').map(item => item.replace(/"/g, '').trim());

    if (currentline.length >= headers.length) {
      for (let j = 0; j < headers.length; j++) {
        const headerName = headers[j];
        obj[headerName] = currentline[j] || "";
      }
      result.push(obj);
    }
  }
  return result;
};