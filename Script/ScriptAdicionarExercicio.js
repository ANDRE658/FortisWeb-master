// --- INÍCIO DA REATORAÇÃO ---

// (Req 2) Variável global para guardar o catálogo de exercícios
let exerciciosCatalogo = [];

/**
 * (Req 2) Popula o dropdown inicial e armazena o catálogo
 */
async function carregarExerciciosAPI() {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    alert("Sessão expirada. Faça o login.");
    window.location.href = "Index.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/exercicio/listar", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.error("Não foi possível listar os exercícios da API.");
      return;
    }

    exerciciosCatalogo = await response.json(); // Salva no catálogo global

    // Popula o primeiro <select> (o que já está no HTML)
    const selectInicial = document.querySelector(".exercicio-select");
    popularDropdown(selectInicial);
  } catch (error) {
    console.error("Erro ao carregar exercícios da API:", error);
  }
}

/**
 * (Req 2) Função helper para popular um <select> com o catálogo
 */
function popularDropdown(selectElement) {
  if (!selectElement) return;

  selectElement.innerHTML = '<option value="">Selecione um exercício</option>';
  exerciciosCatalogo.forEach((ex) => {
    selectElement.innerHTML += `<option value="${ex.id}">${ex.nome}</option>`;
  });
}

/**
 * (Req 3) Função para adicionar uma nova linha de exercício à tabela
 */
function adicionarNovaLinha() {
  const tabelaBody = document.getElementById("tabelaExerciciosBody");

  // 1. Cria o HTML da nova linha
  const novaLinhaHTML = `
        <div class="table-row">
            <div class="table-cell">
                <select class="form-control exercicio-select">
                    </select>
            </div>
            <div class="table-cell-small">
                <input type="number" class="input-serie" placeholder="0" min="1" />
            </div>
            <div class="table-cell-small">
                <input type="text" class="input-rep" placeholder="0" />
            </div>
            <div class="table-cell-small">
                <i class="bi bi-trash btn-remove-row" title="Remover linha"></i>
            </div>
        </div>
    `;

  // 2. Adiciona a linha ao DOM
  tabelaBody.insertAdjacentHTML("beforeend", novaLinhaHTML);

  // 3. Encontra o <select> que acabamos de adicionar
  const novoSelect = tabelaBody.lastElementChild.querySelector(".exercicio-select");

  // 4. Popula o novo <select> com os exercícios
  popularDropdown(novoSelect);
}

// --- FIM DA REATORAÇÃO ---

// --- Ponto de Entrada: O DOM foi carregado ---
document.addEventListener("DOMContentLoaded", function () {
  // 1. Pega os dados da URL
  const urlParams = new URLSearchParams(window.location.search);
  const treinoId = urlParams.get("treinoId");
  const alunoNome = urlParams.get("aluno") || "Aluno";
  const diaSemana = urlParams.get("dia") || "Dia";
  
  // ***** INÍCIO DA CORREÇÃO *****
  // Precisamos pegar o ID da Ficha para saber para onde voltar
  const fichaId = urlParams.get("fichaId");
  // ***** FIM DA CORREÇÃO *****

  if (!treinoId || !fichaId) { // Adicionada verificação do fichaId
    alert("ID do treino ou da ficha não encontrado. Voltando para a tela anterior.");
    window.location.href = "Treinos.html"; // Volta para a lista principal
    return;
  }

  // 2. Ajusta a tela com os dados
  document.getElementById("aluno").value = alunoNome;

  // (Req 1) Mostra o dia da semana no título
  document.getElementById("diaSemanaTitulo").textContent = diaSemana.toUpperCase();

  // Desabilita os campos que não precisam ser editados
  document.getElementById("aluno").disabled = true;
  if (document.getElementById("nomeTreino")) {
    document.getElementById("nomeTreino").disabled = true;
  }

  // (Req 2) Carrega o catálogo de exercícios da API
  carregarExerciciosAPI();

  // (Req 3) Adiciona o listener para o botão "+ Adicionar Exercício"
  document
    .getElementById("btAdicionarLinha")
    .addEventListener("click", adicionarNovaLinha);

  // (Req 3 - Bônus) Adiciona listener para os botões de lixeira (usando delegação)
  document
    .getElementById("tabelaExerciciosBody")
    .addEventListener("click", function (e) {
      if (e.target && e.target.classList.contains("btn-remove-row")) {
        // Pega a linha (elemento .table-row) e a remove
        e.target.closest(".table-row").remove();
      }
    });

  // 3. Funções de Navegação (Resto do seu script)
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

  // ***** INÍCIO DA CORREÇÃO *****
  // Adiciona o listener para o botão "CANCELAR" que alteramos no HTML
  document
    .getElementById("btnCancelarAdicionarExercicio")
    .addEventListener("click", function () {
      // Redireciona DE VOLTA para a ficha, passando o ID
      window.location.href = `CadastroTreino.html?id=${fichaId}`;
    });
  // ***** FIM DA CORREÇÃO *****


  // 4. LÓGICA DE SALVAR OS EXERCÍCIOS
  document
    .getElementById("adicionarExercicioForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        alert("Sessão expirada. Faça o login.");
        window.location.href = "Index.html";
        return;
      }

      // (Lógica de salvar - Já está correta e dinâmica)
      // Ela vai pegar TODOS os .table-row, incluindo os novos
      const rows = document.querySelectorAll(".table-row");
      const promessas = [];
      let exerciciosSalvosCount = 0;

      for (const row of rows) {
        const selectExercicio = row.querySelector(".exercicio-select");
        const exercicioId = selectExercicio ? selectExercicio.value : null;

        const seriesInput = row.querySelector(".input-serie");
        const series = seriesInput ? seriesInput.value : null;

        const repInput = row.querySelector(".input-rep");
        const rep = repInput ? repInput.value : null;

        if (exercicioId && series && rep) {
          const itemData = {
            exercicioId: parseInt(exercicioId),
            series: parseInt(series),
            repeticoes: rep.toString(), // (O backend espera String "10-12")
            carga: 0,
            tempoDescansoSegundos: 60,
          };

          const url = `http://localhost:8080/item-treino/salvar/${treinoId}`;

          promessas.push(
            fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(itemData),
            })
          );
          exerciciosSalvosCount++; // Conta quantos exercícios estão sendo salvos
        }
      }

      // Se o usuário clicou em Salvar sem adicionar nenhum exercício
      if (exerciciosSalvosCount === 0) {
        alert("Adicione pelo menos um exercício antes de salvar.");
        return;
      }

      // 6. Executa todas as promessas de salvamento
      try {
        const responses = await Promise.all(promessas);
        const falhou = responses.some((res) => !res.ok);

        if (falhou) {
          alert(
            "Alguns exercícios não puderam ser salvos. Verifique o console."
          );
        } else {
          alert("Exercícios salvos no treino com sucesso!");
          
          // ***** INÍCIO DA CORREÇÃO *****
          // Redireciona DE VOLTA para a ficha, passando o ID
          window.location.href = `CadastroTreino.html?id=${fichaId}`;
          // ***** FIM DA CORREÇÃO *****
        }
      } catch (error) {
        console.error("Erro ao salvar exercícios:", error);
        alert("Falha ao salvar um ou mais exercícios. Verifique o console.");
      }
    });
});