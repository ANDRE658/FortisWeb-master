// --- Ponto de Entrada: O DOM foi carregado ---
document.addEventListener("DOMContentLoaded", function () {
  // Pega o ID da URL (ex: "CadastroPlano.html?id=5")
  const urlParams = new URLSearchParams(window.location.search);
  const planoId = urlParams.get("id"); // Será 'null' se for um novo cadastro
  const modoEdicao = planoId !== null;

  // --- Funções de Navegação (do seu código original) ---
  const nomeUsuario = localStorage.getItem("usuarioLogado") || "Instrutor";
  document.getElementById("userName").textContent = nomeUsuario;

  document.querySelectorAll(".nav-menu li").forEach((item) => {
    item.addEventListener("click", function (event) {
      const pagina = event.currentTarget.dataset.page;
      if (pagina) {
        window.location.href = pagina;
      }
    });
  });

  document.getElementById("iconHome").addEventListener("click", function () {
    window.location.href = "Home.html";
  });

  document
    .querySelector(".bi-box-arrow-right")
    .addEventListener("click", function () {
      if (confirm("Deseja sair do sistema?")) {
        localStorage.removeItem("usuarioLogado");
        localStorage.removeItem("jwtToken"); // Limpa o token
        window.location.href = "Index.html";
      }
    });

  // --- FUNÇÃO PARA CARREGAR DADOS (MODO EDIÇÃO) ---
  async function carregarDadosDoPlano() {
    if (!modoEdicao) return; // Se não está em modo edição, não faz nada

    // 1. Muda o título da página
    document.querySelector(".page-title").textContent = "Editar Plano";

    // 2. Pega o token
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      alert("Sessão expirada. Faça o login novamente.");
      window.location.href = "Index.html";
      return;
    }

    // 3. Busca o plano específico na API
    try {
      const response = await fetch(
        `http://localhost:8080/plano/buscar/${planoId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const plano = await response.json();
        // 4. Preenche o formulário com os dados
        document.getElementById("nomePlano").value = plano.nome;
        document.getElementById("valorPlano").value = plano.valor
          .toString()
          .replace(".", ",");
      } else {
        alert("Erro ao buscar dados do plano. Redirecionando para a lista.");
        window.location.href = "Planos.html";
      }
    } catch (error) {
      console.error("Erro de rede:", error);
    }
  }

  // --- LÓGICA DE SALVAR (AGORA SERVE PARA CRIAR E EDITAR) ---
  document
    .getElementById("cadastroPlanoForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const token = localStorage.getItem("jwtToken");
      if (!token) {
        alert("Sessão expirada. Faça o login novamente.");
        window.location.href = "Index.html";
        return;
      }

      // 1. Pega os dados do formulário
      const planoData = {
        nome: document.getElementById("nomePlano").value,
        valor: parseFloat(
          document.getElementById("valorPlano").value.replace(",", ".")
        ),
      };

      // 2. Define o método e a URL corretos
      const metodo = modoEdicao ? "PUT" : "POST";
      const url = modoEdicao
        ? `http://localhost:8080/plano/atualizar/${planoId}` // Atualiza
        : "http://localhost:8080/plano/salvar"; // Cria um novo

      // 3. Envia a requisição (Fetch) para a API
      try {
        const response = await fetch(url, {
          method: metodo,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(planoData),
        });

        // 4. Verifica a resposta (201 para Criado, 200 para Atualizado)
        if (response.status === 201 || response.status === 200) {
          alert(
            modoEdicao
              ? "Plano atualizado com sucesso!"
              : "Plano cadastrado com sucesso!"
          );
          window.location.href = "Planos.html"; // Redireciona para a lista
        } else if (response.status === 403) {
          alert(
            "Sua sessão expirou ou você não tem permissão. Faça o login novamente."
          );
          window.location.href = "Index.html";
        } else {
          alert("Erro ao salvar plano. Código: " + response.status);
        }
      } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Não foi possível conectar à API. Verifique o console.");
      }
    });

  // --- INICIALIZAÇÃO DA PÁGINA ---
  carregarDadosDoPlano(); // Tenta carregar os dados se for modo de edição
});
