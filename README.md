# Lucro Real — Calculadora de Precificação e Saúde da Margem

> Aplicação web desenvolvida em **TypeScript**, **HTML5** e **CSS3** para ajudar lojistas e empreendedores a definirem o preço ideal de venda, visualizarem o impacto real das taxas de plataforma e acompanharem o lucro líquido por unidade e por lote.

---

## Visão Geral do Projeto

Muitos vendedores definem preços olhando apenas o custo do produto ou aplicando percentuais por intuição, sem considerar que comissões de *marketplaces* e taxas de venda costumam incidir sobre o **preço final** — e não apenas sobre o custo de aquisição.

O **Lucro Real** resolve esse problema entregando um raio-x financeiro claro antes de publicar o anúncio ou fechar o preço de vitrine:

- **Cálculo do preço sugerido sobre o preço final:** considera custos diretos (`produto`, `embalagem` e `imposto/custo fixo unitário`), taxa da plataforma (`%`) e margem líquida desejada (`%`).
- **Visão unitária e por lote/quantidade:** projeta valores para uma unidade e para a quantidade informada (`N` unidades), facilitando o planejamento de estoque e campanhas.
- **Simulação de preço de vitrine:** permite testar um preço redondo ou promocional (ex.: `R$ 59,90`) e verificar a taxa em reais, o lucro unitário/total e a margem efetivamente obtida nesse cenário.
- **Diagnóstico semântico da margem:** classifica a operação em faixas (`saudável`, `atenção` ou `alerta`) para sinalizar riscos de margem apertada ou prejuízo.
- **Resumo pronto para copiar:** gera um relatório textual formatado para colar rapidamente em planilhas ou mensagens.

---

## Regra Financeira Aplicada

Quando uma taxa percentual ($t$) e uma margem desejada ($m$) incidem sobre o preço de venda ($P$), o custo unitário total ($C$) representa a fração restante do preço final:

$$P = \frac{C}{1 - \left(\frac{t + m}{100}\right)}$$

A partir de $P$, o sistema calcula:

- **Valor da taxa da plataforma:** $T = P \times \left(\frac{t}{100}\right)$
- **Lucro líquido unitário:** $L = P - C - T$
- **Margem líquida real (%):** $M_{\text{real}} = \left(\frac{L}{P}\right) \times 100$

> **Validação de segurança:** se a soma da taxa da plataforma com a margem desejada for igual ou superior a `100%`, o cálculo é bloqueado com mensagem de erro explicativa, pois não existe preço de venda positivo que comporte essa soma percentual.

---

<img width="1148" height="827" alt="image" src="https://github.com/user-attachments/assets/513ab19b-4552-4ef0-8a60-4c4b01827dea" />


## Estrutura de Arquivos

```text
calculadora-precificacao-lucro/
├── index.html      # Estrutura semântica da interface, formulário e painel de saída
├── style.css       # Design tokens (variáveis CSS), layout responsivo e estados visuais
├── script.ts       # Interfaces TypeScript, regra de cálculo, diagnóstico e manipulação do DOM
├── tsconfig.json   # Configurações de compilação estrita do TypeScript para ./dist
├── README.md       # Documentação técnica e funcional do projeto
└── dist/           # Saída gerada pelo compilador TypeScript (ex.: script.js)
