/**
 * Lucro Real — Motor de Precificação e Análise de Margem em TypeScript
 *
 * Premissa financeira principal:
 * Em marketplaces e vendas online, comissões percentuais costumam incidir sobre
 * o preço final de venda e não apenas sobre o custo de aquisição. Por isso, o
 * cálculo do preço sugerido utiliza a divisão por (1 - (taxa + margem) / 100),
 * garantindo que, após descontar a taxa da plataforma e cobrir os custos unitários,
 * a margem líquida real corresponda à meta planejada.
 */

type StatusSaude = "saudavel" | "atencao" | "alerta";

interface EntradaCalculadora {
  nomeProduto: string;
  custoProduto: number;
  custoEmbalagem: number;
  custoExtra: number;
  quantidade: number;
  taxaPlataformaPct: number;
  margemDesejadaPct: number;
  precoVitrine: number | null;
}

interface SimulacaoVitrine {
  precoVitrine: number;
  taxaReais: number;
  lucroUnitario: number;
  lucroTotal: number;
  margemObtidaPct: number;
}

interface ResultadoCalculo {
  nomeProduto: string;
  quantidade: number;
  custoUnitario: number;
  custoTotalLote: number;
  precoSugeridoUnitario: number;
  precoSugeridoTotal: number;
  taxaUnitaria: number;
  taxaTotalLote: number;
  lucroLiquidoUnitario: number;
  lucroLiquidoTotal: number;
  margemRealPct: number;
  status: StatusSaude;
  mensagem: string;
  vitrine: SimulacaoVitrine | null;
  resumoTexto: string;
}

// Mapeamento explícito dos elementos interativos da interface
const form = document.getElementById("form-precificacao") as HTMLFormElement | null;
const resultadoEl = document.getElementById("resultado") as HTMLElement | null;
const btnExemplo = document.getElementById("btn-exemplo") as HTMLButtonElement | null;
const btnLimpar = document.getElementById("btn-limpar") as HTMLButtonElement | null;

/**
 * Formata um número em moeda local (BRL) seguindo o padrão pt-BR.
 */
function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Lê um campo numérico do formulário com fallback seguro para evitar NaN ou Infinity
 * durante operações aritméticas subsequentes.
 */
function lerNumero(id: string, padrao = 0): number {
  const input = document.getElementById(id) as HTMLInputElement | null;
  if (!input || input.value.trim() === "") return padrao;
  const numero = Number(input.value);
  return Number.isFinite(numero) ? numero : padrao;
}

/**
 * Recupera o nome informado para o produto ou aplica um rótulo padrão legível.
 */
function lerNomeProduto(): string {
  const input = document.getElementById("nome-produto") as HTMLInputElement | null;
  const texto = input?.value.trim() ?? "";
  return texto.length > 0 ? texto : "Produto sem nome";
}

/**
 * Simula a rentabilidade caso o lojista opte por praticar um preço de vitrine fixo
 * (por exemplo, um preço psicológico como R$ 59,90) em vez do preço sugerido.
 */
function simularPrecoVitrine(
  precoVitrine: number,
  custoUnitario: number,
  taxaPlataformaPct: number,
  quantidade: number
): SimulacaoVitrine {
  const taxaReais = precoVitrine * (taxaPlataformaPct / 100);
  const lucroUnitario = precoVitrine - custoUnitario - taxaReais;
  const lucroTotal = lucroUnitario * quantidade;
  const margemObtidaPct = precoVitrine > 0 ? (lucroUnitario / precoVitrine) * 100 : 0;

  return {
    precoVitrine,
    taxaReais,
    lucroUnitario,
    lucroTotal,
    margemObtidaPct,
  };
}

/**
 * Gera um resumo estruturado em texto simples para facilitar o compartilhamento
 * em conversas ou registro rápido em planilhas.
 */
function gerarResumoTexto(params: {
  nomeProduto: string;
  quantidade: number;
  custoUnitario: number;
  precoSugeridoUnitario: number;
  lucroLiquidoUnitario: number;
  lucroLiquidoTotal: number;
  margemRealPct: number;
  taxaPlataformaPct: number;
}): string {
  return [
    `📊 LUCRO REAL — ${params.nomeProduto}`,
    `• Custo unitário total: ${formatarMoeda(params.custoUnitario)}`,
    `• Taxa da plataforma: ${params.taxaPlataformaPct}%`,
    `• Preço sugerido (un.): ${formatarMoeda(params.precoSugeridoUnitario)}`,
    `• Lucro líquido (un.): ${formatarMoeda(params.lucroLiquidoUnitario)} (${params.margemRealPct.toFixed(1)}%)`,
    `• Lucro total (${params.quantidade} un.): ${formatarMoeda(params.lucroLiquidoTotal)}`,
  ].join("\n");
}

/**
 * Calcula preço sugerido, comissão da plataforma, lucro líquido unitário/total
 * e classifica a saúde da margem obtida.
 */
function calcular(entrada: EntradaCalculadora): ResultadoCalculo | { erro: string } {
  // Garante quantidade inteira mínima de 1 unidade para projeções de lote
  const qtd = Math.max(1, Math.floor(entrada.quantidade));
  const custoUnitario = entrada.custoProduto + entrada.custoEmbalagem + entrada.custoExtra;
  const somaPct = entrada.taxaPlataformaPct + entrada.margemDesejadaPct;

  // Bloqueia cenários matematicamente inviáveis (divisor zero ou negativo)
  if (somaPct >= 100) {
    return {
      erro: "A soma da taxa da plataforma com a margem desejada precisa ser menor que 100%.",
    };
  }

  const precoSugeridoUnitario = custoUnitario / (1 - somaPct / 100);
  const precoSugeridoTotal = precoSugeridoUnitario * qtd;

  const taxaUnitaria = precoSugeridoUnitario * (entrada.taxaPlataformaPct / 100);
  const taxaTotalLote = taxaUnitaria * qtd;

  const lucroLiquidoUnitario = precoSugeridoUnitario - custoUnitario - taxaUnitaria;
  const lucroLiquidoTotal = lucroLiquidoUnitario * qtd;
  const margemRealPct =
    precoSugeridoUnitario > 0 ? (lucroLiquidoUnitario / precoSugeridoUnitario) * 100 : 0;

  // Faixas de diagnóstico orientativas para apoiar a decisão comercial
  let status: StatusSaude = "saudavel";
  let mensagem = "Margem saudável: boa folga após taxas e custos operacionais.";

  if (lucroLiquidoUnitario <= 0 || margemRealPct < 10) {
    status = "alerta";
    mensagem = "Margem crítica: risco de prejuízo ou sobra muito baixa por unidade.";
  } else if (margemRealPct < 20) {
    status = "atencao";
    mensagem = "Margem moderada: revise embalagem ou custos fixos para aumentar a segurança.";
  }

  const vitrine =
    entrada.precoVitrine !== null && entrada.precoVitrine > 0
      ? simularPrecoVitrine(entrada.precoVitrine, custoUnitario, entrada.taxaPlataformaPct, qtd)
      : null;

  const resumoTexto = gerarResumoTexto({
    nomeProduto: entrada.nomeProduto,
    quantidade: qtd,
    custoUnitario,
    precoSugeridoUnitario,
    lucroLiquidoUnitario,
    lucroLiquidoTotal,
    margemRealPct,
    taxaPlataformaPct: entrada.taxaPlataformaPct,
  });

  return {
    nomeProduto: entrada.nomeProduto,
    quantidade: qtd,
    custoUnitario,
    custoTotalLote: custoUnitario * qtd,
    precoSugeridoUnitario,
    precoSugeridoTotal,
    taxaUnitaria,
    taxaTotalLote,
    lucroLiquidoUnitario,
    lucroLiquidoTotal,
    margemRealPct,
    status,
    mensagem,
    vitrine,
    resumoTexto,
  };
}

/**
 * Atualiza a seção de resultados com os cards financeiros, diagnóstico
 * e ação de cópia do resumo.
 */
function renderizarResultado(res: ResultadoCalculo | { erro: string }): void {
  if (!resultadoEl) return;

  if ("erro" in res) {
    resultadoEl.innerHTML = `<div class="alerta-box alerta">${res.erro}</div>`;
    return;
  }

  const blocoVitrine = res.vitrine
    ? `
      <div class="vitrine-box">
        <h4>Teste no preço de vitrine (${formatarMoeda(res.vitrine.precoVitrine)})</h4>
        <p>
          Taxa da plataforma: <strong>${formatarMoeda(res.vitrine.taxaReais)}</strong> ·
          Lucro unitário: <strong>${formatarMoeda(res.vitrine.lucroUnitario)}</strong>
          (${res.vitrine.margemObtidaPct.toFixed(1)}%) ·
          Total (${res.quantidade} un.): <strong>${formatarMoeda(res.vitrine.lucroTotal)}</strong>
        </p>
      </div>
    `
    : "";

  resultadoEl.innerHTML = `
    <div class="painel-topo">
      <h2>2. Raio-X: ${res.nomeProduto}</h2>
    </div>

    <div class="metricas-grid">
      <div class="metrica destaque">
        <span>Preço sugerido (un.)</span>
        <strong>${formatarMoeda(res.precoSugeridoUnitario)}</strong>
        <small>Lote (${res.quantidade} un.): ${formatarMoeda(res.precoSugeridoTotal)}</small>
      </div>

      <div class="metrica destaque">
        <span>Lucro líquido real (un.)</span>
        <strong>${formatarMoeda(res.lucroLiquidoUnitario)}</strong>
        <small>Total (${res.quantidade} un.): ${formatarMoeda(res.lucroLiquidoTotal)}</small>
      </div>

      <div class="metrica">
        <span>Taxa da plataforma (un.)</span>
        <strong>${formatarMoeda(res.taxaUnitaria)}</strong>
        <small>Total (${res.quantidade} un.): ${formatarMoeda(res.taxaTotalLote)}</small>
      </div>

      <div class="metrica">
        <span>Custo total (un.)</span>
        <strong>${formatarMoeda(res.custoUnitario)}</strong>
        <small>Total (${res.quantidade} un.): ${formatarMoeda(res.custoTotalLote)}</small>
      </div>
    </div>

    <div class="alerta-box ${res.status}">
      ${res.mensagem} (Margem real: ${res.margemRealPct.toFixed(1)}%)
    </div>

    ${blocoVitrine}

    <div class="resumo-box">
      <textarea id="texto-resumo" readonly>${res.resumoTexto}</textarea>
      <button type="button" id="btn-copiar" class="btn-secundario">
        Copiar resumo para WhatsApp / planilha
      </button>
    </div>
  `;

  // Registra o listener após a renderização dinâmica do botão de cópia
  const btnCopiar = document.getElementById("btn-copiar") as HTMLButtonElement | null;
  btnCopiar?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(res.resumoTexto);
      btnCopiar.textContent = "Resumo copiado!";
      setTimeout(() => {
        btnCopiar.textContent = "Copiar resumo para WhatsApp / planilha";
      }, 2000);
    } catch {
      btnCopiar.textContent = "Selecione o texto acima para copiar";
    }
  });
}

// Popula um caso de teste completo e dispara o cálculo automaticamente
btnExemplo?.addEventListener("click", () => {
  (document.getElementById("nome-produto") as HTMLInputElement).value = "Kit Skincare Noturno";
  (document.getElementById("custo-produto") as HTMLInputElement).value = "28.00";
  (document.getElementById("custo-embalagem") as HTMLInputElement).value = "4.20";
  (document.getElementById("custo-extra") as HTMLInputElement).value = "2.80";
  (document.getElementById("quantidade") as HTMLInputElement).value = "30";
  (document.getElementById("taxa-plataforma") as HTMLInputElement).value = "14";
  (document.getElementById("margem-desejada") as HTMLInputElement).value = "25";
  (document.getElementById("preco-vitrine") as HTMLInputElement).value = "64.90";

  form?.requestSubmit();
});

// Restaura o estado vazio do painel quando o formulário é resetado
btnLimpar?.addEventListener("click", () => {
  if (!resultadoEl) return;
  resultadoEl.innerHTML = `
    <div class="estado-vazio">
      <span class="icone-vazio">R$</span>
      <h3>Seu raio-x de lucro aparece aqui</h3>
      <p>
        Informe os custos, a taxa do marketplace e a margem desejada para ver o preço
        sugerido, quanto vai para a plataforma e o lucro líquido real.
      </p>
    </div>
  `;
});

// Intercepta o submit para evitar reload da página e processar os valores tipados
form?.addEventListener("submit", (event: Event) => {
  event.preventDefault();

  const precoVitrineBruto = lerNumero("preco-vitrine", 0);

  const entrada: EntradaCalculadora = {
    nomeProduto: lerNomeProduto(),
    custoProduto: lerNumero("custo-produto", 0),
    custoEmbalagem: lerNumero("custo-embalagem", 0),
    custoExtra: lerNumero("custo-extra", 0),
    quantidade: lerNumero("quantidade", 1),
    taxaPlataformaPct: lerNumero("taxa-plataforma", 0),
    margemDesejadaPct: lerNumero("margem-desejada", 0),
    precoVitrine: precoVitrineBruto > 0 ? precoVitrineBruto : null,
  };

  const resultado = calcular(entrada);
  renderizarResultado(resultado);
});