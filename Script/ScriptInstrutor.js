// Variável global para armazenar a lista completa de instrutores
let todosInstrutores = [];

/**
 * Função para renderizar a tabela com uma lista de instrutores
 */
function renderizarTabela(instrutores) {
  const tbody = document.querySelector(".table-container table tbody");
  tbody.innerHTML = ""; // Limpa a tabela

  if (instrutores.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="text-center">Nenhum instrutor ativo encontrado.</td></tr>';
    return;
  }

  instrutores.forEach((instrutor) => {
    const newRow = `
      <tr>
        <td>${instrutor.nome}</td>
        <td>${instrutor.cpf}</td>
        <td class="text-center">
          <i class="bi bi-pencil action-icon edit-btn" data-id="${instrutor.id}" title="Editar" style="margin-right: 15px; color: #00008B; cursor: pointer;"></i>
          <i class="bi bi-trash action-icon delete-btn" data-id="${instrutor.id}" title="Excluir" style="color: #dc3545; cursor: pointer;"></i>
        </td>
      </tr>
    `;
    tbody.innerHTML += newRow;
  });
}

/**
 * Função para excluir (inativar) o instrutor
 */
async function excluirInstrutor(id) {
    if (!confirm("Tem certeza que deseja excluir este instrutor? Ele não aparecerá mais na lista.")) {
        return;
    }

    const token = localStorage.getItem("jwtToken");
    try {
        const response = await fetch(`http://localhost:8080/instrutor/excluir/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok || response.status === 204) {
            alert("Instrutor excluído com sucesso!");
            carregarInstrutores(); // Recarrega a lista
        } else {
            alert("Erro ao excluir o instrutor.");
        }
    } catch (error) {
        console.error("Erro na exclusão:", error);
        alert("Não foi possível conectar à API.");
    }
}

/**
 * Função principal para carregar os instrutores da API
 */
async function carregarInstrutores() {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    alert("Sessão expirada. Faça o login novamente.");
    window.location.href = "Index.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/instrutor/listar", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Tratamento para lista vazia (204 No Content)
    if (response.status === 204) {
       todosInstrutores = [];
       renderizarTabela([]);
       return;
    }

    if (response.ok) {
      const instrutores = await response.json();
      todosInstrutores = instrutores; // Salva na lista global
      renderizarTabela(todosInstrutores);
    } else if (response.status === 403) {
      alert("Sua sessão expirou ou você não tem permissão.");
      window.location.href = "Index.html";
    } else {
      alert("Erro ao carregar instrutores. Código: " + response.status);
    }
  } catch (error) {
    console.error("Erro de rede:", error);
    const tbody = document.querySelector(".table-container table tbody");
    if(tbody) tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Erro de conexão.</td></tr>';
  }
}

// --- Ponto de Entrada: O DOM foi carregado ---
document.addEventListener("DOMContentLoaded", function () {
  
  const nomeUsuario = localStorage.getItem("usuarioLogado") || "Usuário";
  const elUser = document.getElementById("userName");
  if(elUser) elUser.textContent = nomeUsuario;

  // Carrega a lista
  carregarInstrutores();

  // Barra de Busca
  const searchInput = document.querySelector(".search-input");
  if(searchInput) {
      searchInput.addEventListener("input", function (e) {
        const termoBusca = e.target.value.toLowerCase();
        const instrutoresFiltrados = todosInstrutores.filter(instrutor => 
           instrutor.nome.toLowerCase().includes(termoBusca) ||
           instrutor.cpf.includes(termoBusca)
        );
        renderizarTabela(instrutoresFiltrados);
      });
  }

  // Delegação de Eventos (Editar e Excluir)
  const tbody = document.querySelector("tbody");
  if(tbody) {
      tbody.addEventListener("click", function (e) {
        // Editar
        if (e.target.classList.contains("edit-btn")) {
            const instrutorId = e.target.getAttribute("data-id");
            window.location.href = `CadastroInstrutor.html?id=${instrutorId}`;
        }
        // Excluir
        if (e.target.classList.contains("delete-btn")) {
            const instrutorId = e.target.getAttribute("data-id");
            excluirInstrutor(instrutorId);
        }
      });
  }

  // Navegação
  document.querySelectorAll(".nav-menu li").forEach(item => {
    item.addEventListener("click", function(event) {
        const pagina = event.currentTarget.dataset.page;
        if (pagina) window.location.href = pagina;
    });
  });

  const btnSair = document.querySelector(".bi-box-arrow-right");
  if(btnSair) {
      btnSair.addEventListener("click", function () {
          if (confirm("Deseja sair do sistema?")) {
            localStorage.clear();
            window.location.href = "Index.html";
          }
        });
  }

  const btnCadastrar = document.getElementById("btCadastrarInstrutor");
  if(btnCadastrar) {
      btnCadastrar.addEventListener("click", function () {
        window.location.href = "CadastroInstrutor.html";
      });
  }
});