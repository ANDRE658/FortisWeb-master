// === VARIÁVEIS GLOBAIS ===
let exerciciosCatalogo = [];
const DIAS_SEMANA = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"];

// Variáveis para o Modo Edição
let modoEdicao = false;
let fichaIdParaEditar = null;

/**
 * Carrega os Alunos (Dropdown)
 */
async function carregarAlunos() {
  const token = localStorage.getItem("jwtToken");
  const select = document.getElementById("alunoSelect");
  if (!token) {
    alert("Sessão expirada. Faça o login.");
    window.location.href = "Index.html";
    return Promise.reject(new Error("Sem token"));
  }

  try {
    const response = await fetch("http://localhost:8080/aluno/listar", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 204) {
      select.innerHTML = '<option value="">Nenhum aluno cadastrado</option>';
      return Promise.resolve();
    }
    if (!response.ok) {
      throw new Error("Falha ao buscar alunos");
    }

    const alunos = await response.json();
    select.innerHTML = '<option value="">Selecione um aluno</option>';
    alunos.forEach((aluno) => {
      select.innerHTML += `<option value="${aluno.id}">${aluno.nome}</option>`;
    });
    return Promise.resolve(); // Sucesso
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    select.innerHTML = '<option value="">Erro de conexão</option>';
    return Promise.reject(error);
  }
}

/**
 * Carrega o Catálogo de Exercícios (para os dropdowns)
 */
async function carregarExerciciosAPI() {
  const token = localStorage.getItem("jwtToken");
  if (!token) return Promise.reject(new Error("Sem token"));

  try {
    const response = await fetch("http://localhost:8080/exercicio/listar", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      exerciciosCatalogo = await response.json();
      return Promise.resolve();
    } else {
      console.error("Não foi possível carregar o catálogo de exercícios.");
      return Promise.reject(new Error("Falha ao carregar exercícios"));
    }
  } catch (error) {
    console.error("Erro ao carregar exercícios da API:", error);
    return Promise.reject(error);
  }
}

/**
 * Adiciona uma nova linha de exercício (em branco)
 */
function adicionarNovaLinha(diaSemana) {
  const tabelaBody = document.getElementById(`tabela-${diaSemana}`);
  if (!tabelaBody) return;

  const novaLinha = document.createElement("div");
  novaLinha.className = "table-row";
  novaLinha.innerHTML = `
    <div class="table-cell">
      <select class="form-control exercicio-select" required>
        <option value="">Selecione...</option>
      </select>
    </div>
    <div class="table-cell-small">
      <input type="number" class="input-serie" placeholder="3" min="1" required />
    </div>
    <div class="table-cell-small">
      <input type="text" class="input-rep" placeholder="10-12" required />
    </div>
    <div class="table-cell-small">
      <i class="bi bi-trash btn-remove-row" title="Remover linha"></i>
    </div>
  `;

  const select = novaLinha.querySelector(".exercicio-select");
  popularDropdown(select);
  tabelaBody.appendChild(novaLinha);

  // Retorna a linha criada para o modo de edição
  return novaLinha;
}

/**
 * Preenche um dropdown <select> com o catálogo
 */
function popularDropdown(selectElement) {
  if (!selectElement || exerciciosCatalogo.length === 0) return;
  exerciciosCatalogo.forEach((ex) => {
    selectElement.innerHTML += `<option value="${ex.id}">${ex.nome}</option>`;
  });
}

/**
 * Remove uma linha de exercício (lixeira)
 */
function removerLinha(event) {
  if (event.target && event.target.classList.contains("btn-remove-row")) {
    event.target.closest(".table-row").remove();
  }
}

// ======================================================
// === NOVA FUNÇÃO: CARREGAR FICHA (MODO EDIÇÃO) ===
// ======================================================
async function carregarFichaParaEdicao(id) {
  const token = localStorage.getItem("jwtToken");
  if (!token) return;

  try {
    const response = await fetch(
      `http://localhost:8080/ficha-treino/buscar/${id}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      alert("Erro ao carregar a ficha de treino. Voltando para a lista.");
      window.location.href = "Treinos.html";
      return;
    }

    const ficha = await response.json();

    // 1. Preenche o Aluno (usando o campo virtual ou objeto direto)
    // O backend agora manda getIdAluno() como 'idAluno' ou podemos tentar acessar aluno.id se disponível
    const idAluno = ficha.idAluno || (ficha.aluno ? ficha.aluno.id : "");
    document.getElementById("alunoSelect").value = idAluno;

    // 2. Itera sobre os Treinos (Atenção: nome do campo no JSON é 'treinos')
    const listaTreinos = ficha.treinos || [];
    
    for (const treino of listaTreinos) {
      const diaSemana = treino.diaSemana; // "SEGUNDA", "TERCA", etc.

      // 3. Preenche o nome do treino
      const inputNome = document.getElementById(`nome-${diaSemana}`);
      if (inputNome) inputNome.value = treino.nome;

      // 4. Itera sobre os Exercícios (Atenção: nome do campo é 'exercicios')
      if (treino.exercicios) {
        for (const exercicioSalvo of treino.exercicios) {
          
          // Adiciona uma linha visual na tabela do dia correto
          const novaLinha = adicionarNovaLinha(diaSemana);
          
          // --- A MÁGICA ACONTECE AQUI ---
          // O 'exercicioSalvo' tem um ID único (ex: 500) que não existe no dropdown.
          // Vamos procurar no 'exerciciosCatalogo' qual tem o MESMO NOME.
          const exercicioDoCatalogo = exerciciosCatalogo.find(
              cat => cat.nome.trim().toLowerCase() === exercicioSalvo.nome.trim().toLowerCase()
          );

          if (exercicioDoCatalogo) {
              // Se achou pelo nome, seleciona o ID do catálogo (ex: 1)
              novaLinha.querySelector(".exercicio-select").value = exercicioDoCatalogo.id;
          } else {
              // Se não achou (ex: nome mudou), tenta manter o valor original ou deixa em branco
              console.warn("Exercício não encontrado no catálogo:", exercicioSalvo.nome);
          }

          // Preenche Séries e Repetições
          novaLinha.querySelector(".input-serie").value = exercicioSalvo.series;
          novaLinha.querySelector(".input-rep").value = exercicioSalvo.repeticoes;
        }
      }
    }
  } catch (error) {
    console.error("Erro ao carregar ficha para edição:", error);
    alert("Erro técnico ao carregar ficha.");
  }
}

/**
 * Função principal: Salva (Cria OU Atualiza) a ficha completa
 */
// Arquivo: Script/ScriptCadastroTreino.js

async function salvarFichaCompleta(e) {
  e.preventDefault();
  const token = localStorage.getItem("jwtToken");
  const instrutorId = localStorage.getItem("instrutorId");
  const alunoId = document.getElementById("alunoSelect").value;

  if (!token || !instrutorId) {
    alert("Sessão inválida. Faça o login novamente.");
    return;
  }
  if (!alunoId) {
    alert("Por favor, selecione um aluno.");
    return;
  }

  // 1. Prepara o DTO "pai" (CORREÇÃO 1: Nome da lista é 'dias')
  const fichaCompletaDTO = {
    alunoId: parseInt(alunoId),
    instrutorId: parseInt(instrutorId),
    descricao: "Ficha de Treino", // Adicionei uma descrição padrão que o DTO pede
    dias: [], 
  };

  let totalExercicios = 0;

  // 2. Itera sobre os 5 dias da semana
  for (const dia of DIAS_SEMANA) {
    const nomeTreinoInput = document.getElementById(`nome-${dia}`);
    const nomeTreino = nomeTreinoInput ? nomeTreinoInput.value : "";
    const tabela = document.getElementById(`tabela-${dia}`);
    
    // Verifica se a tabela existe antes de tentar ler
    if (!tabela) continue;
    
    const linhasExercicio = tabela.querySelectorAll(".table-row");

    if (nomeTreino && linhasExercicio.length > 0) {
      
      // (CORREÇÃO 2: Nomes dos campos devem bater com DiaTreinoRequestDTO.java)
      const diaDTO = {
        diaSemana: dia,
        nomeTreino: nomeTreino, // No Java é 'nomeTreino', não 'nome'
        exercicios: [],         // No Java é 'exercicios', não 'itensTreino'
      };

      // 3. Itera sobre os exercícios daquele dia
      for (const linha of linhasExercicio) {
        const selectElement = linha.querySelector(".exercicio-select");
        const seriesElement = linha.querySelector(".input-serie");
        const repElement = linha.querySelector(".input-rep");

        // Validação extra para não quebrar se o elemento não existir
        if(!selectElement || !seriesElement || !repElement) continue;

        const exercicioId = selectElement.value;
        const series = seriesElement.value;
        const repeticoes = repElement.value;

        if (!exercicioId) {
            alert(`Treino de ${dia}: Selecione o exercício.`);
            return;
        }
        if (!series || !repeticoes) {
           alert(`Treino de ${dia}: Preencha as séries e repetições.`);
           return;
        }

        const itemDTO = {
          exercicioId: parseInt(exercicioId),
          series: parseInt(series),
          repeticoes: repeticoes.toString(), // Envia como String ("10" ou "12")
          // carga e descanso removidos por enquanto para compatibilidade
        };

        // (CORREÇÃO 3: Push na lista certa 'exercicios')
        diaDTO.exercicios.push(itemDTO);
        totalExercicios++;
      }
      
      // (CORREÇÃO 4: Push na lista certa 'dias')
      // AQUI ERA ONDE ESTAVA O SEU ERRO (estava diasDeTreino.push)
      fichaCompletaDTO.dias.push(diaDTO);
    }
  }

  if (totalExercicios === 0) {
      alert("A ficha está vazia. Adicione pelo menos um exercício e nome do treino.");
      return;
  }

  // Define Método e URL
  const metodo = modoEdicao ? "PUT" : "POST";
  // Ajuste a URL se necessário. Se for PUT, garanta que o backend suporta a atualização completa nesse endpoint
  const url = modoEdicao
    ? `http://localhost:8080/fichas/salvar-completa` // Para simplificar, vamos usar o salvar-completa mesmo na edição por enquanto, ou o endpoint correto se existir
    : "http://localhost:8080/fichas/salvar-completa"; 

  // Se estiver editando, talvez precise passar o ID da ficha no corpo ou URL. 
  // O endpoint salvarFichaCompleta atual cria uma NOVA ficha.
  // Para edição perfeita, precisaríamos de um ajuste no backend, mas vamos focar em CRIAR primeiro.

  try {
    const response = await fetch(url, {
      method: "POST", // Forçamos POST para criar sempre uma nova por enquanto (evita erro de método não suportado)
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fichaCompletaDTO),
    });

    if (response.ok) {
      alert("Ficha salva com sucesso!");
      window.location.href = "Treinos.html";
    } else {
      const erroTexto = await response.text();
      console.error("Erro API:", erroTexto);
      alert(`Erro ao salvar: ${response.status}\nVerifique o console.`);
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Não foi possível conectar à API.");
  }
}

// --- Ponto de Entrada: O DOM foi carregado ---
document.addEventListener("DOMContentLoaded", async function () {
  const nomeUsuario = localStorage.getItem("usuarioLogado") || "Instrutor";
  document.getElementById("userName").textContent = nomeUsuario;

  // 1. Conecta o formulário à função salvar
  document
    .getElementById("criarTreinoForm")
    .addEventListener("submit", salvarFichaCompleta);

  // 2. Adiciona listeners para os botões "Adicionar"
  document.querySelectorAll(".btn-add-row").forEach((button) => {
    button.addEventListener("click", function () {
      const dia = this.getAttribute("data-dia");
      adicionarNovaLinha(dia);
    });
  });

  // 3. Adiciona listeners para os botões "Remover" (Lixeira)
  document.querySelectorAll(".table-body").forEach((tabela) => {
    tabela.addEventListener("click", removerLinha);
  });

  // ===============================================
  // === INÍCIO DO CÓDIGO DE NAVEGAÇÃO CORRIGIDO ===
  // ===============================================

  // 4. Lógica de navegação (Menu)
  document.querySelectorAll(".nav-menu li").forEach((item) => {
    item.addEventListener("click", function (event) {
      const pagina = event.currentTarget.dataset.page;
      if (pagina) {
        window.location.href = pagina;
      }
    });
  });

  // 5. Lógica de navegação (Sair)
  document
    .querySelector(".bi-box-arrow-right")
    .addEventListener("click", function () {
      if (confirm("Deseja sair do sistema?")) {
        localStorage.clear(); // Limpa tudo
        window.location.href = "Index.html";
      }
    });

  // 6. Lógica de navegação (Home)
  document
    .querySelector(".navbar .bi-house-door")
    .addEventListener("click", function () {
      window.location.href = "Home.html";
    });

  // ===============================================
  // === FIM DO CÓDIGO DE NAVEGAÇÃO CORRIGIDO ===
  // ===============================================


  // 7. Lógica de Inicialização (EDITAR vs CRIAR)
  try {
    // 7.1. Carrega os dropdowns (Aluno e Catálogo de Exercícios) PRIMEIRO
    await carregarAlunos();
    await carregarExerciciosAPI();
  } catch (error) {
    console.error("Falha ao inicializar a página, parando.");
    return; // Para se os catálogos falharem
  }

  // 7.2. Verifica se estamos em Modo Edição
  const urlParams = new URLSearchParams(window.location.search);
  fichaIdParaEditar = urlParams.get("id");
  modoEdicao = fichaIdParaEditar !== null;

  if (modoEdicao) {
    // 7.3. Se for Edição, muda a UI e carrega os dados
    document.querySelector(".page-title").textContent = "Editar Ficha de Treino";
    document.querySelector(".btn-save").textContent = "ATUALIZAR FICHA";
    await carregarFichaParaEdicao(fichaIdParaEditar);
  }
  // Se não for modo de edição, a página simplesmente fica em branco, pronta para criar.
});