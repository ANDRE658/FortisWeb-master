// Variável global para armazenar a lista completa de exercícios
let todosExercicios = [];

/**
 * Função para renderizar a tabela com uma lista de exercícios
 */
function renderizarTabela(exercicios) {
  const tbody = document.querySelector(".table-container table tbody");
  tbody.innerHTML = ""; // Limpa a tabela

  if (exercicios.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="text-center">Nenhum exercício ativo encontrado.</td></tr>';
    return;
  }

  exercicios.forEach((exercicio) => {
    const statusHtml = '<span class="status-ativo">Ativo</span>';

    const newRow = `
      <tr>
        <td>${exercicio.nome}</td>
        <td>${statusHtml}</td>
        <td>
          <i class="bi bi-pencil action-icon edit-btn" data-id="${exercicio.id}" title="Editar" style="margin-right: 15px;"></i>
          
          <i class="bi bi-trash action-icon delete-btn" data-id="${exercicio.id}" title="Excluir" style="color: #dc3545;"></i>
        </td>
      </tr>
    `;
    tbody.innerHTML += newRow;
  });
}

/**
 * Função para excluir (inativar) o exercício
 */
async function excluirExercicio(id) {
    if (!confirm("Tem certeza que deseja excluir este exercício? Ele não aparecerá mais para novos treinos.")) {
        return;
    }

    const token = localStorage.getItem("jwtToken");
    try {
        const response = await fetch(`http://localhost:8080/exercicio/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok || response.status === 204) {
            alert("Exercício excluído com sucesso!");
            carregarExercicios(); // Recarrega a lista
        } else {
            alert("Erro ao excluir o exercício.");
        }
    } catch (error) {
        console.error("Erro na exclusão:", error);
        alert("Não foi possível conectar à API.");
    }
}

/**
 * Função principal para carregar os exercícios da API
 */
async function carregarExercicios() {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    alert("Sessão expirada. Faça o login novamente.");
    window.location.href = "Index.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/exercicio/listar", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // TRATAMENTO DO STATUS 204 (Lista Vazia)
    if (response.status === 204) {
       todosExercicios = [];
       renderizarTabela([]);
       return;
    }

    if (response.ok) {
      const exercicios = await response.json();
      todosExercicios = exercicios; // Salva na lista global
      renderizarTabela(todosExercicios); // Renderiza a tabela inicial
    
    } else if (response.status === 403) {
      alert("Você não tem permissão para visualizar esta página.");
      renderizarTabela([]); 
    } else {
      throw new Error("Erro ao carregar exercícios. Código: " + response.status);
    }
  } catch (error) {
    console.error("Erro de rede ou na API:", error);
    const tbody = document.querySelector(".table-container table tbody");
    if(tbody) tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Falha ao conectar com a API.</td></tr>`;
  }
}

// --- Ponto de Entrada: O DOM foi carregado ---
document.addEventListener("DOMContentLoaded", function () {
  
  // 1. Lógica de Navegação
  const nomeUsuario = localStorage.getItem("usuarioLogado") || "Instrutor";
  const elUserName = document.getElementById("userName");
  if(elUserName) elUserName.textContent = nomeUsuario;

  document.querySelectorAll(".nav-menu li").forEach((item) => {
    item.addEventListener("click", function (event) {
      const pagina = event.currentTarget.dataset.page;
      if (pagina) window.location.href = pagina;
    });
  });

  const btnSair = document.querySelector(".bi-box-arrow-right");
  if (btnSair) {
      btnSair.addEventListener("click", function () {
          if (confirm("Deseja sair do sistema?")) {
            localStorage.removeItem("usuarioLogado");
            localStorage.removeItem("jwtToken");
            localStorage.removeItem("instrutorId");
            window.location.href = "Index.html";
          }
      });
  }

  const btnHome = document.getElementById("iconHome");
  if (btnHome) {
      btnHome.addEventListener("click", function () {
        window.location.href = "Home.html";
      });
  }

  // 2. Barra de Pesquisa
  const searchInput = document.querySelector(".search-input");
  if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        const termoBusca = e.target.value.toLowerCase();
        const exerciciosFiltrados = todosExercicios.filter((exercicio) =>
          exercicio.nome.toLowerCase().includes(termoBusca)
        );
        renderizarTabela(exerciciosFiltrados);
      });
  }

  // 3. Botão Cadastrar
  const btnCadastrar = document.getElementById("btCadastrarExercicio");
  if (btnCadastrar) {
      btnCadastrar.addEventListener("click", function () {
        window.location.href = "CadastroExercicio.html";
      });
  }

  // 4. Delegação de Eventos (Editar e Excluir)
  const tbody = document.querySelector("tbody");
  if (tbody) {
      tbody.addEventListener("click", function (e) {
        // Editar
        if (e.target.classList.contains("edit-btn")) {
          const exercicioId = e.target.getAttribute("data-id");
          window.location.href = `CadastroExercicio.html?id=${exercicioId}`;
        }
        // Excluir
        if (e.target.classList.contains("delete-btn")) {
          const exercicioId = e.target.getAttribute("data-id");
          excluirExercicio(exercicioId);
        }
      });
  }

  // 5. Inicialização
  carregarExercicios();
});