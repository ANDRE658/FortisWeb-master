// Variável global para armazenar a lista completa de planos
let todosPlanos = [];

// Função para formatar o valor como Moeda (BRL)
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

// Função para renderizar a tabela com uma lista de planos
function renderizarTabela(planos) {
  const tbody = document.querySelector(".table-container table tbody");
  tbody.innerHTML = ""; // Limpa a tabela

  if (planos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="text-center">Nenhum plano ativo encontrado.</td></tr>';
    return;
  }

  planos.forEach((plano) => {
    const statusHtml = '<span class="status-ativo">Ativo</span>';

    const newRow = `
      <tr>
        <td>${plano.nome}</td>
        <td>${statusHtml}</td>
        <td>${formatarMoeda(plano.valor)}</td>
        <td>
          <i class="bi bi-pencil action-icon edit-btn" data-plano-id="${plano.id}" title="Editar" style="margin-right: 15px;"></i>
          
          <i class="bi bi-trash action-icon delete-btn" data-plano-id="${plano.id}" title="Excluir" style="color: #dc3545;"></i>
        </td>
      </tr>
    `;
    tbody.innerHTML += newRow;
  });
}

// Função para excluir (inativar) o plano
async function excluirPlano(id) {
    if (!confirm("Tem certeza que deseja excluir este plano? Ele não aparecerá mais para novos alunos.")) {
        return;
    }

    const token = localStorage.getItem("jwtToken");
    try {
        const response = await fetch(`http://localhost:8080/plano/deletar/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok || response.status === 204) {
            alert("Plano excluído com sucesso!");
            carregarPlanos(); // Recarrega a lista (o plano sumirá)
        } else {
            alert("Erro ao excluir o plano.");
        }
    } catch (error) {
        console.error("Erro na exclusão:", error);
        alert("Não foi possível conectar à API.");
    }
}

// Função principal para carregar os planos da API
async function carregarPlanos() {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    alert("Sessão expirada. Faça o login novamente.");
    window.location.href = "Index.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/plano/listar", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // CORREÇÃO: Verifica o status 204 PRIMEIRO, antes de tentar ler o JSON
    if (response.status === 204) {
       todosPlanos = []; // Limpa a lista global
       renderizarTabela([]); // Renderiza a tabela vazia
       return; // Sai da função
    }

    if (response.ok) {
      const planos = await response.json();
      todosPlanos = planos; // Salva na lista global
      renderizarTabela(todosPlanos); // Renderiza a tabela
    } else if (response.status === 403) {
      alert("Sua sessão expirou. Faça o login novamente.");
      window.location.href = "Index.html";
    } else {
      alert("Erro ao carregar planos. Código: " + response.status);
    }
  } catch (error) {
    console.error("Erro de rede:", error);
    // Removido o alert invasivo, deixando apenas o log
    const tbody = document.querySelector(".table-container table tbody");
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Erro de conexão.</td></tr>';
  }
}

// --- Ponto de Entrada: O DOM foi carregado ---
document.addEventListener("DOMContentLoaded", function () {
  const nomeUsuario = localStorage.getItem("usuarioLogado") || "Instrutor";
  document.getElementById("userName").textContent = nomeUsuario;

  // Carrega a lista de planos
  carregarPlanos();

  // Barra de Busca
  const searchInput = document.querySelector(".search-input");
  if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        const termoBusca = e.target.value.toLowerCase();
        const planosFiltrados = todosPlanos.filter((plano) =>
          plano.nome.toLowerCase().includes(termoBusca)
        );
        renderizarTabela(planosFiltrados);
      });
  }

  // Delegação de Eventos para a Tabela (Editar e Excluir)
  const tbody = document.querySelector("tbody");
  tbody.addEventListener("click", function (e) {
      
      // Clique no Lápis (Editar)
      if (e.target.classList.contains("edit-btn")) {
          const planoId = e.target.getAttribute("data-plano-id");
          window.location.href = `CadastroPlano.html?id=${planoId}`;
      }

      // Clique na Lixeira (Excluir)
      if (e.target.classList.contains("delete-btn")) {
          const planoId = e.target.getAttribute("data-plano-id");
          excluirPlano(planoId);
      }
  });

  // Navegação e Logout
  document.querySelectorAll(".nav-menu li").forEach((item) => {
    item.addEventListener("click", function (event) {
      const pagina = event.currentTarget.dataset.page;
      if (pagina) window.location.href = pagina;
    });
  });

  document.querySelector(".bi-box-arrow-right").addEventListener("click", function () {
      if (confirm("Deseja sair do sistema?")) {
        localStorage.removeItem("usuarioLogado");
        localStorage.removeItem("jwtToken");
        window.location.href = "Index.html";
      }
    });

  document.getElementById("iconHome").addEventListener("click", function () {
    window.location.href = "Home.html";
  });

  document.getElementById("btCadastrarPlano").addEventListener("click", function () {
      window.location.href = "CadastroPlano.html";
  });
});