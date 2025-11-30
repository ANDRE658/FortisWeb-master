// --- Ponto de Entrada: O DOM foi carregado ---
document.addEventListener("DOMContentLoaded", function () {
  
  // --- NOVO: LÓGICA DE EDIÇÃO ---
  const urlParams = new URLSearchParams(window.location.search);
  const exercicioId = urlParams.get("id"); // Será 'null' se for um novo cadastro
  const modoEdicao = exercicioId !== null;

  // 1. Carrega o nome do usuário (lógica de navegação)
  const nomeUsuario = localStorage.getItem("usuarioLogado") || "Instrutor";
  document.getElementById("userName").textContent = nomeUsuario;
  
  // ... (Toda a lógica de navegação: .nav-menu, .bi-box-arrow-right, #iconHome) ...
  document.querySelectorAll('.nav-menu li').forEach(item => {
    item.addEventListener('click', function(event) {
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
        localStorage.removeItem("usuarioLogado");
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("instrutorId");
        window.location.href = "Index.html";
      }
    });

  document.getElementById("iconHome").addEventListener("click", function () {
    window.location.href = "Home.html";
  });


  // --- NOVO: FUNÇÃO PARA CARREGAR DADOS (MODO EDIÇÃO) ---
  async function carregarDadosDoExercicio() {
    if (!modoEdicao) return; // Se não é edição, sai

    // 1. Muda o título da página e o texto do botão
    document.querySelector(".page-title").textContent = "Editar Exercício"; //
    document.querySelector(".btn-save").textContent = "ATUALIZAR"; //

    // 2. Pega o token
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      alert("Sessão expirada. Faça o login novamente.");
      window.location.href = "Index.html";
      return;
    }

    // 3. Busca o exercício específico na API
    try {
      const response = await fetch(
        `http://localhost:8080/exercicio/buscar/${exercicioId}`, // Nosso novo endpoint
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const exercicio = await response.json();
        // 4. Preenche o formulário com os dados
        document.getElementById("nomeExercicio").value = exercicio.nome; //
      } else {
        alert("Erro ao buscar dados do exercício. Redirecionando para a lista.");
        window.location.href = "Exercicios.html"; //
      }
    } catch (error) {
      console.error("Erro de rede:", error);
    }
  }


  // 2. LÓGICA DE SALVAR (AGORA SERVE PARA CRIAR E ATUALIZAR)
  document
    .getElementById("cadastroExercicioForm") //
    .addEventListener("submit", async function (e) {
      e.preventDefault(); 
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        alert("Sessão expirada. Faça o login.");
        window.location.href = "Index.html";
        return;
      }

      // Pega o nome do exercício do input
      const nomeExercicio = document.getElementById("nomeExercicio").value;

      if (!nomeExercicio) {
          alert("Por favor, preencha o nome do exercício.");
          return;
      }

      // O backend espera um ExercicioDTO (que só tem 'nome')
      //
      const exercicioData = {
          nome: nomeExercicio
      };

      // --- ATUALIZAÇÃO DA LÓGICA ---
      // Define o método e a URL corretos
      const metodo = modoEdicao ? "PUT" : "POST";
      const url = modoEdicao
        ? `http://localhost:8080/exercicio/atualizar/${exercicioId}` // Nosso novo endpoint
        : "http://localhost:8080/exercicio/salvar";

      try {
        const response = await fetch(url, {
          method: metodo,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(exercicioData)
        });

        // 201 (Created) ou 200 (OK)
        if (response.status === 201 || response.status === 200) { 
          alert(
            modoEdicao
              ? "Exercício atualizado com sucesso!"
              : "Exercício cadastrado com sucesso!"
          );
          window.location.href = "Exercicios.html"; // Redireciona para a lista
        
        } else if (response.status === 403) {
          alert("Sua sessão expirou. Faça o login novamente.");
          window.location.href = "Index.html";
        
        } else {
          alert("Erro ao salvar exercício. Código: " + response.status);
        }

      } catch (error) {
         console.error("Erro ao salvar exercício:", error);
         alert("Não foi possível conectar à API.");
      }
    });

    // --- INICIALIZAÇÃO DA PÁGINA ---
    carregarDadosDoExercicio(); // Tenta carregar os dados se for modo de edição
});