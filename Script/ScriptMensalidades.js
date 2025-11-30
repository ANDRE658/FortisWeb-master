// === VARIÁVEIS GLOBAIS ===
let todasMensalidades = [];

// === FUNÇÕES AUXILIARES ===

// Formata valor para Moeda BRL
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

// Formata data para DD/MM/AAAA
function formatarData(dataISO) {
  if (!dataISO) return "--/--/----";
  // Cria a data considerando o fuso horário UTC para evitar problemas de dia anterior
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// === LÓGICA PRINCIPAL ===

/**
 * Carrega as mensalidades da API
 */
async function carregarMensalidades() {
    const token = localStorage.getItem("jwtToken");
    const tbody = document.getElementById("tabelaMensalidades");

    if (!token) {
        alert("Sessão expirada. Faça o login novamente.");
        window.location.href = "Index.html";
        return;
    }

    // Feedback de carregamento
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';

    try {
        const response = await fetch("http://localhost:8080/mensalidade/listar", {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}` 
            }
        });

        if (response.status === 204) {
            todasMensalidades = [];
            renderizarTabela([]);
            return;
        }

        if (response.ok) {
            todasMensalidades = await response.json();
            aplicarFiltros(); // Aplica os filtros iniciais para renderizar
        } else {
            console.error("Erro na API:", response.status);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar dados.</td></tr>';
        }
    } catch (error) {
        console.error("Erro de rede:", error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Falha na conexão.</td></tr>';
    }
}

/**
 * Filtra a lista localmente (Status + Busca de Texto)
 */
function aplicarFiltros() {
    const statusFiltro = document.getElementById("filtroStatus").value;
    const termoBusca = document.getElementById("buscaAluno").value.toLowerCase();
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera hora para comparação apenas de data

    const listaFiltrada = todasMensalidades.filter(m => {
        // 1. Define o status real desta mensalidade
        let statusItem = "";
        const dataVenc = new Date(m.dataVencimento);
        // Ajuste de fuso: Tratamos a data vinda do banco como UTC meia-noite
        const dataVencComparacao = new Date(dataVenc.getUTCFullYear(), dataVenc.getUTCMonth(), dataVenc.getUTCDate());

        if (m.pago) {
            statusItem = "pago";
        } else if (dataVencComparacao < hoje) {
            statusItem = "vencido";
        } else {
            statusItem = "aberto"; // A vencer / Em dia
        }

        // 2. Valida Filtro de Status
        if (statusFiltro !== "todos" && statusItem !== statusFiltro) {
            return false;
        }

        // 3. Valida Filtro de Texto (Nome ou CPF)
        if (termoBusca) {
            const nome = m.aluno ? m.aluno.nome.toLowerCase() : "";
            const cpf = m.aluno ? m.aluno.cpf.replace(/\D/g, "") : ""; // Remove pontos/traços para busca
            
            if (!nome.includes(termoBusca) && !cpf.includes(termoBusca)) {
                return false;
            }
        }

        return true;
    });

    renderizarTabela(listaFiltrada);
}

/**
 * Renderiza a tabela HTML
 */
function renderizarTabela(lista) {
    const tbody = document.getElementById("tabelaMensalidades");
    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma mensalidade encontrada.</td></tr>';
        return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    lista.forEach(m => {
        const dataVenc = new Date(m.dataVencimento);
        // Normalização para comparação visual
        const dataVencComparacao = new Date(dataVenc.getUTCFullYear(), dataVenc.getUTCMonth(), dataVenc.getUTCDate());
        
        let statusBadge = "";
        let acaoBtn = "";

        // Lógica de Status e Botões
        if (m.pago) {
            statusBadge = `<span class="badge-pago">Pago</span>`;
            // Ícone de "Check" verde para confirmar pagamento
            acaoBtn = `<i class="bi bi-check-circle-fill" style="color: #28a745; font-size: 1.3rem;" title="Pago em ${formatarData(m.dataPagamento)}"></i>`;
        } else if (dataVencComparacao < hoje) {
            statusBadge = `<span class="badge-vencido">Vencido</span>`;
            // Botão Receber (mesmo vencido)
            acaoBtn = `<button class="btn btn-sm btn-success" onclick="receberPagamento(${m.id})">Receber</button>`;
        } else {
            statusBadge = `<span class="badge-aberto">A vencer</span>`;
            // Botão Receber
            acaoBtn = `<button class="btn btn-sm btn-success" onclick="receberPagamento(${m.id})">Receber</button>`;
        }

        const nomeAluno = m.aluno ? m.aluno.nome : "Aluno Removido";
        const cpfAluno = m.aluno ? m.aluno.cpf : "---";

        const row = `
            <tr>
                <td>${nomeAluno}</td>
                <td>${cpfAluno}</td>
                <td>${formatarData(m.dataVencimento)}</td>
                <td>${formatarMoeda(m.valor)}</td>
                <td>${statusBadge}</td>
                <td class="text-center">${acaoBtn}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// === AÇÕES (API) ===

/**
 * Realiza a baixa (pagamento) de uma mensalidade
 */
async function receberPagamento(id) {
    if (!confirm("Confirmar o recebimento desta mensalidade?")) return;

    const token = localStorage.getItem("jwtToken");
    try {
        const response = await fetch(`http://localhost:8080/mensalidade/pagar/${id}`, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${token}` 
            }
        });

        if (response.ok) {
            alert("Pagamento registrado com sucesso!");
            carregarMensalidades(); // Recarrega para atualizar o status
        } else {
            alert("Erro ao registrar pagamento. Tente novamente.");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro de conexão.");
    }
}

/**
 * Gera manualmente as mensalidades do mês atual (Botão auxiliar)
 */
async function gerarMensalidades() {
    const token = localStorage.getItem("jwtToken");
    const btn = document.querySelector(".actions-bar .btn-add");
    
    // Feedback visual
    const textoOriginal = btn.textContent;
    btn.textContent = "Gerando...";
    btn.disabled = true;

    try {
        const response = await fetch("http://localhost:8080/mensalidade/gerar-agora", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${token}` 
            }
        });
        
        if(response.ok) {
            alert("Verificação de mensalidades concluída.");
            carregarMensalidades();
        } else {
            alert("Erro ao gerar mensalidades.");
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão ao tentar gerar mensalidades.");
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

// === INICIALIZAÇÃO E NAVEGAÇÃO ===

document.addEventListener("DOMContentLoaded", function () {
    // 1. Configuração do Usuário no Menu
    const nomeUsuario = localStorage.getItem("usuarioLogado") || "Usuário";
    const elUser = document.getElementById("userName");
    if (elUser) elUser.textContent = nomeUsuario;

    // 2. Carrega dados iniciais
    carregarMensalidades();

    // 3. Listeners de Filtros (Input e Select)
    document.getElementById("filtroStatus").addEventListener("change", aplicarFiltros);
    document.getElementById("buscaAluno").addEventListener("input", aplicarFiltros);

    // 4. Navegação do Menu Lateral (Padrão do sistema)
    document.querySelectorAll(".nav-menu li").forEach((item) => {
        item.addEventListener("click", function (event) {
            const pagina = event.currentTarget.dataset.page;
            if (pagina) window.location.href = pagina;
        });
    });

    // 5. Botão Sair
    const btnSair = document.querySelector(".bi-box-arrow-right");
    if (btnSair) {
        btnSair.addEventListener("click", function () {
            if (confirm("Deseja sair do sistema?")) {
                localStorage.clear();
                window.location.href = "Index.html";
            }
        });
    }

    // 6. Botão Home (Logo)
    const iconHome = document.getElementById("iconHome");
    if (iconHome) {
        iconHome.addEventListener("click", () => window.location.href = "Home.html");
    }
});

// Disponibiliza funções para o escopo global (HTML onclick)
window.receberPagamento = receberPagamento;
window.gerarMensalidades = gerarMensalidades;