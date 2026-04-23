/**
 * SILL - Sistema Inteligente de Logística Local
 * Integração com Google Sheets (Leitura e Escrita)
 */

// Sua URL gerada no Google Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwNpjzwAH9VhS9pf-A7k5JQ8yDc3NLQq8nDOWZtuxfjXu8krWx34U42Gs0OC_NBg3U/exec";

// URL da sua planilha para leitura (CSV)
const USERS_SHEET_URL = "https://docs.google.com/spreadsheets/d/1O_gNcCvvf0fBfnY1Qs37T3n00EQB3AH4Auqm9PSgSig/gviz/tq?tqx=out:csv&sheet=USUÁRIOS";
const DELIVERIES_SHEET_URL =  "https://docs.google.com/spreadsheets/d/1O_gNcCvvf0fBfnY1Qs37T3n00EQB3AH4Auqm9PSgSig/gviz/tq?tqx=out:csv&sheet=ENTREGAS";
// Função para buscar usuários (Leitura)
export const fetchUsers = async () => {
  try {
    const response = await fetch(USERS_SHEET_URL);
    const csvText = await response.text();
    // Aqui o sistema processa o CSV da sua planilha
    return processCSV(csvText);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
};

// Função para cadastrar novo usuário (Escrita)
export const saveUser = async (userData: any) => {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Necessário para Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
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

// Função para atualizar status de entrega (Escrita)
export const updateDeliveryStatus = async (pedidoId: string, status: string) => {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
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

// Auxiliar para processar CSV
const processCSV = (csv: string) => {
  const lines = csv.split('\n');
  const result = [];
  const headers = lines[0].split(',');

  for (let i = 1; i < lines.length; i++) {
    const obj: any = {};
    const currentline = lines[i].split(',');

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j].trim()] = currentline[j]?.trim();
    }
    result.push(obj);
  }
  return result;
}; 