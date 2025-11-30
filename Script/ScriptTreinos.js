// Variável global para armazenar a lista completa de fichas
let todasFichas = [];

/**
 * Função para renderizar a tabela com uma lista de Fichas de Treino
 * @param {Array} fichas - A lista de Fichas a ser mostrada
 */
function renderizarTabela(fichas) {
  const tbody = document.querySelector(".table-container table tbody");
  tbody.innerHTML = ""; // Limpa a tabela

  if (fichas.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="text-center">Nenhum treino (ficha) encontrado.</td></tr>';
    return;
  }

  fichas.forEach((ficha) => {
    // 1. Nome do Aluno (Usa o campo virtual ou o fallback para o legado)
    const nomeAluno = ficha.nomeAluno || "Aluno não identificado";

    // 2. Lógica de Status (Diferencia Web vs Android)
    let statusHtml = '<span class="status-ativo">Ativo</span>';
    let classeLinha = ""; // Pode usar para estilizar a linha inteira se quiser

    if (ficha.origem === "android") {
        // Usa classes do Bootstrap para um badge amarelo de alerta
        statusHtml = '<span class="badge bg-warning text-dark">Legado Android</span>';
        classeLinha = "table-warning"; // Opcional: deixa a linha levemente amarela
    }

    // 3. Lógica do Botão de Ação
    let btnAcao = "";
    
    if (ficha.origem === "android") {
        // Ícone de alerta (apenas informativo, não edita para evitar corrupção de dados)
        btnAcao = `<i class="bi bi-exclamation-circle action-icon" 
                      title="Este treino foi criado no App Android antigo e não possui ficha completa. Visualização apenas." 
                      style="color: #fd7e14; cursor: help; font-size: 1.2rem;"></i>`;
    } else {
        // Ícone de Lápis (Edição normal para fichas Web)
        btnAcao = `<i class="bi bi-pencil action-icon edit-btn" 
                      data-ficha-id="${ficha.id}" 
                      title="Editar / Ver Treino" 
                      style="margin-right: 15px;"></i>`;
    }

    // 4. Montagem da Linha
    const newRow = `
      <tr class="${classeLinha}">
        <td>${nomeAluno}</td>
        <td>${ficha.id.toString().startsWith("T-") ? "Treino #" + ficha.realId : "Ficha #" + ficha.id}</td> 
        <td>${statusHtml}</td>
        <td>
          ${btnAcao}
        </td>
      </tr>
    `;
    tbody.innerHTML += newRow;
  });
}

/**
 * Função principal para carregar as Fichas de Treino da API
 */
async function carregarFichasDeTreino() {
  const token = localStorage.getItem("jwtToken");
  if (!token) { /* ... */ return; }

  try {
    // 1. Busca Fichas (Web)
    const resFichas = await fetch("http://localhost:8080/ficha-treino/listar", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const fichas = resFichas.ok ? await resFichas.json() : [];

    // 2. Busca Treinos Órfãos (Android/Legado)
    const resOrfaos = await fetch("http://localhost:8080/treino/sem-ficha", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orfaos = resOrfaos.ok ? await resOrfaos.json() : [];

    // 3. Adapta os órfãos para parecerem fichas na tabela
    const orfaosAdaptados = orfaos.map(t => ({
        id: "T-" + t.id, // ID diferenciado
        nomeAluno: "Aluno (Android/Legado)", // Não temos como saber o aluno sem a ficha
        ativa: true,
        origem: "android",
        // Guardamos o ID real para tentativa de edição futura
        realId: t.id 
    }));

    // 4. Junta tudo
    todasFichas = [...fichas, ...orfaosAdaptados];
    
    renderizarTabela(todasFichas);

  } catch (error) {
    console.error("Erro ao carregar:", error);
  }
}

// --- Ponto de Entrada: O DOM foi carregado ---
document.addEventListener("DOMContentLoaded", function () {
  // 1. Carrega o nome do usuário
  const nomeUsuario = localStorage.getItem("usuarioLogado") || "Instrutor";
  document.getElementById("userName").textContent = nomeUsuario;

  // 2. Lógica de navegação (Menu, Sair, Home)
  document.querySelectorAll(".nav-menu li").forEach((item) => {
    item.addEventListener("click", function (event) {
      const pagina = event.currentTarget.dataset.page;
      if (pagina) {
        window.location.href = pagina;
      }
    });
  });

  document
    .querySelector(".bi-box-arrow-right")
    .addEventListener("click", function () {
      if (confirm("Deseja sair do sistema?")) {
        localStorage.clear();
        window.location.href = "Index.html";
      }
    });

  document.getElementById("iconHome").addEventListener("click", function () {
    window.location.href = "Home.html";
  });

  // 3. Botão "+ CRIAR TREINO"
  document
    .getElementById("btnCriarTreino")
    .addEventListener("click", function () {
      // Redireciona para a tela de cadastro SEM ID (modo de criação)
      window.location.href = "CadastroTreino.html";
    });

  // 4. Lógica de Edição (Clique no Lápis)
  // Usamos "event delegation" pois os ícones são criados dinamicamente
  document.querySelector("tbody").addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("action-icon")) {
      const fichaId = e.target.getAttribute("data-ficha-id");

      // Redireciona para a tela de cadastro COM ID (modo de edição/visualização)
      window.location.href = `CadastroTreino.html?id=${fichaId}`;
    }
  });

  // 5. INICIALIZAÇÃO: Carrega as fichas da API
  carregarFichasDeTreino();
});
