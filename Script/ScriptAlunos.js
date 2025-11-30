// Variável global para armazenar a lista completa de alunos
let todosAlunos = [];

/**
 * Função para renderizar a tabela com uma lista de alunos
 */
function renderizarTabela(alunos) {
  const tbody = document.querySelector(".table-container table tbody");
  const userRole = localStorage.getItem("userRole"); // Pega a role
  
  if (!tbody) return;
  tbody.innerHTML = ""; // Limpa a tabela

  if (alunos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="text-center">Nenhum aluno ativo encontrado.</td></tr>';
    return;
  }

  alunos.forEach((aluno) => {
    // Lógica para pegar o nome do plano
    let nomePlano = "Sem Plano";
    
    if (aluno.matriculaList && aluno.matriculaList.length > 0) {
         const matriculaAtiva = aluno.matriculaList.find(m => m.ativa) || aluno.matriculaList[aluno.matriculaList.length - 1];
        
        if (matriculaAtiva && matriculaAtiva.plano) {
            nomePlano = matriculaAtiva.plano.nome;
        }
    }

    // --- LÓGICA DE AÇÃO 1 (EDITAR ou VISUALIZAR) ---
    let acaoIcon = '';
    let acaoClasse = '';
    let acaoTitulo = '';
    
    if (userRole === 'ROLE_GERENCIADOR') {
        acaoIcon = 'bi-pencil'; // Lápis de Edição
        acaoClasse = 'edit-btn'; // Classe JS para editar
        acaoTitulo = 'Editar Aluno';
    } else if (userRole === 'ROLE_INSTRUTOR') {
        acaoIcon = 'bi-eye'; // Olho de Visualização
        acaoClasse = 'view-btn'; // Classe JS para visualizar
        acaoTitulo = 'Visualizar Aluno';
    }
    
    // --- LÓGICA DE AÇÃO 2 (EXCLUIR ou TREINO) ---
    let segundaAcaoHtml = '';
    if (userRole === 'ROLE_GERENCIADOR') {
        // Gerenciador VÊ o botão de excluir
        segundaAcaoHtml = `<i class="bi bi-trash action-icon delete-btn" data-id="${aluno.id}" title="Excluir" style="color: #dc3545; cursor: pointer; font-size: 1.2rem;"></i>`;
    } else if (userRole === 'ROLE_INSTRUTOR') {
        // Instrutor VÊ o botão de Ficha de Treino
        segundaAcaoHtml = `<i class="bi bi-list-task action-icon treino-btn" data-id="${aluno.id}" title="Ver Ficha de Treino" style="color: #007bff; cursor: pointer; font-size: 1.2rem;"></i>`;
    }
    // --- FIM DA NOVA LÓGICA ---

    // Proteção contra nulos
    const nome = aluno.nome || "Sem Nome";
    const cpf = aluno.cpf || "---";

    const newRow = `
      <tr>
        <td>${nome}</td>
        <td>${cpf}</td>
        <td>${nomePlano}</td>
        <td class="text-center">
          <i class="bi ${acaoIcon} action-icon ${acaoClasse}" data-id="${aluno.id}" title="${acaoTitulo}" style="color: #00008B; cursor: pointer; margin-right: 15px; font-size: 1.2rem;"></i>
          
          ${segundaAcaoHtml}
        </td>
      </tr>
    `;
    tbody.innerHTML += newRow;
  });
}

// --- Funções de Ação ---

function editarAluno(id) { // Ação do Gerenciador
    window.location.href = `CadastroAluno.html?id=${id}`;
}

function visualizarAluno(id) { // Ação do Instrutor
    window.location.href = `VisualizarAluno.html?id=${id}`;
}

async function excluirAluno(id) { // Ação do Gerenciador
    if (!confirm("Tem certeza que deseja excluir este aluno?")) return;

    const token = localStorage.getItem('jwtToken');
    try {
        const response = await fetch(`http://localhost:8080/aluno/excluir/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok || response.status === 204) {
            alert("Aluno excluído com sucesso!");
            carregarAlunos(); // Recarrega a lista
        } else {
            const erro = await response.text();
            alert("Erro ao excluir aluno: " + erro);
        }
    } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro de conexão ao tentar excluir.");
    }
}

/**
 * NOVA FUNÇÃO: Busca a ficha do aluno e redireciona para a tela de treino.
 */
async function irParaTreinoDoAluno(alunoId) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        alert("Sessão expirada.");
        return;
    }
    
    // O instrutor logado só recebe suas próprias fichas,
    // então podemos buscar na lista de fichas dele.
    try {
        const response = await fetch('http://localhost:8080/ficha-treino/listar', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 204) { // Nenhuma ficha encontrada
            alert('Este aluno ainda não possui uma ficha de treino. Você pode criar uma na tela de "Treinos".');
            return;
        }
        
        if (response.ok) {
            const fichas = await response.json();
            // Procura a ficha que pertence ao aluno clicado
            const fichaDoAluno = fichas.find(f => f.aluno && f.aluno.id == alunoId);
            
            if (fichaDoAluno) {
                // Encontrou a ficha, vai para a edição
                window.location.href = `CadastroTreino.html?id=${fichaDoAluno.id}`;
            } else {
                alert('Este aluno ainda não possui uma ficha de treino cadastrada. Você pode criar uma na tela de "Treinos".');
            }
        } else {
            throw new Error('Falha ao buscar fichas de treino.');
        }
    } catch (error) {
        console.error("Erro ao buscar ficha:", error);
        alert("Não foi possível encontrar a ficha de treino deste aluno.");
    }
}


// --- Carregamento Principal ---
async function carregarAlunos() {
  const token = localStorage.getItem('jwtToken');
  if (!token) {
    alert("Sessão expirada. Faça o login.");
    window.location.href = "Index.html";
    return;
  }

  try {
    const response = await fetch('http://localhost:8080/aluno/listar', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 204) {
        todosAlunos = [];
        renderizarTabela([]);
        return;
    }

    if (response.ok) {
      const alunos = await response.json();
      todosAlunos = alunos;
      renderizarTabela(todosAlunos);
    } else {
      console.error("Erro ao carregar alunos:", response.status);
    }
  } catch (error) {
    console.error("Erro de rede:", error);
  }
}

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", function () {
  const nomeUsuario = localStorage.getItem("usuarioLogado") || "Instrutor";
  const elUser = document.getElementById("userName");
  if(elUser) elUser.textContent = nomeUsuario;

  // 1. Carrega a tabela
  carregarAlunos();

  // 2. Barra de Busca
  const searchInput = document.querySelector(".search-input");
  if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        const termo = e.target.value.toLowerCase();
        const filtrados = todosAlunos.filter(aluno => {
            const nome = aluno.nome ? aluno.nome.toLowerCase() : "";
            const cpf = aluno.cpf ? aluno.cpf : "";
            return nome.includes(termo) || cpf.includes(termo);
        });
        renderizarTabela(filtrados);
      });
  }

  // 3. Delegação de Eventos (Botões da Tabela)
  const tbody = document.querySelector(".table-container table tbody");
  if (tbody) {
      tbody.addEventListener("click", function(e) {
          
          if (e.target.classList.contains('edit-btn')) { // Gerenciador
              const id = e.target.getAttribute('data-id');
              editarAluno(id);
          }
          if (e.target.classList.contains('view-btn')) { // Instrutor
              const id = e.target.getAttribute('data-id');
              visualizarAluno(id);
          }
          if (e.target.classList.contains('delete-btn')) { // Gerenciador
              const id = e.target.getAttribute('data-id');
              excluirAluno(id);
          }
          // --- NOVO EVENTO ---
          if (e.target.classList.contains('treino-btn')) { // Instrutor
              const id = e.target.getAttribute('data-id');
              irParaTreinoDoAluno(id);
         
          }
      });
  }

  // 4. Navegação
  document.querySelectorAll('.nav-menu li').forEach(item => {
    item.addEventListener('click', function(event) {
        const pagina = event.currentTarget.dataset.page; 
        if (pagina) window.location.href = pagina;
    });
  });

  const btnSair = document.querySelector(".bi-box-arrow-right");
  if(btnSair) {
      btnSair.addEventListener("click", function () {
          if (confirm("Deseja sair?")) {
            localStorage.clear();
            window.location.href = "Index.html";
          }
      });
  }
  
  const btnCadastrar = document.getElementById("btCadastrarAluno");
  if(btnCadastrar) {
      btnCadastrar.addEventListener("click", function () {
        window.location.href = "CadastroAluno.html";
      });
  }
  
  const iconHome = document.getElementById("iconHome");
  if(iconHome) {
      iconHome.addEventListener("click", function() {
          window.location.href = "Home.html";
      });
  }
});