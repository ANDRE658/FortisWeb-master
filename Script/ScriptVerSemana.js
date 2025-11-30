document.addEventListener("DOMContentLoaded", function () {
  // 1. Configuração Básica (Navegação)
  const nomeUsuario = localStorage.getItem("usuarioLogado") || "Usuário";
  const elUser = document.getElementById("userName");
  if (elUser) elUser.textContent = nomeUsuario;

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
        localStorage.clear();
        window.location.href = "Index.html";
      }
    });
  }

  const iconHome = document.getElementById("iconHome");
  if (iconHome) {
    iconHome.addEventListener("click", function () {
      window.location.href = "Home.html";
    });
  }

  // 2. Carregar o Treino
  carregarTreinoCompleto();
});

/**
 * Busca a ficha do aluno logado usando o ID (Mais seguro que email)
 */
async function carregarTreinoCompleto() {
  const token = localStorage.getItem("jwtToken");
  const loadingMessage = document.getElementById("loadingMessage");
  const containerDias = document.getElementById("containerDias");
  const btnEditar = document.getElementById("btnEditarTreino");

  if (!token) {
    loadingMessage.innerHTML = "<p style='color:red'>Sessão inválida. Faça o login novamente.</p>";
    setTimeout(() => window.location.href = "Index.html", 2000);
    return;
  }

  try {
    // --- PASSO 1: Descobrir quem sou eu (Pega o ID do Aluno) ---
    const responseMe = await fetch("http://localhost:8080/aluno/me", {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!responseMe.ok) {
        throw new Error("Não foi possível identificar o aluno logado. Verifique se você é um Aluno.");
    }
    
    const dadosAluno = await responseMe.json();
    const meuId = dadosAluno.id; // ID seguro vindo do banco

    // --- PASSO 2: Buscar as Fichas ---
    const response = await fetch("http://localhost:8080/ficha-treino/listar", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 204) {
        throw new Error("Você ainda não possui uma ficha de treino cadastrada.");
    }

    if (!response.ok) {
        throw new Error("Falha ao buscar lista de fichas.");
    }

    const fichas = await response.json();

    // --- PASSO 3: Encontrar a ficha pelo ID (Infalível) ---
    const minhaFicha = fichas.find(f => f.aluno && f.aluno.id === meuId);

    if (!minhaFicha) {
        throw new Error("Nenhuma ficha encontrada para o seu aluno.");
    }

    // --- PASSO 4: Buscar os detalhes COMPLETOS desta ficha ---
    const responseFicha = await fetch(`http://localhost:8080/ficha-treino/buscar/${minhaFicha.id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    
    if(!responseFicha.ok) {
        throw new Error("Falha ao carregar os exercícios da ficha.");
    }

    const fichaCompleta = await responseFicha.json();

    // Configura botão editar (Esconde se for aluno, mostra se for instrutor/admin)
    const userRole = localStorage.getItem("userRole");
    if (btnEditar) {
        if (userRole === 'ROLE_ALUNO') {
            btnEditar.style.display = 'none';
        } else {
            btnEditar.addEventListener("click", () => {
                window.location.href = `CadastroTreino.html?id=${fichaCompleta.id}`;
            });
        }
    }

    // Renderiza na tela
    renderizarSemana(fichaCompleta.diasDeTreino);
    
    loadingMessage.style.display = "none";
    containerDias.style.display = "block";

  } catch (error) {
    console.error("Erro crítico:", error);
    loadingMessage.innerHTML = `<p style='color:red; font-weight:bold;'>${error.message}</p>`;
    if(btnEditar) btnEditar.style.display = "none"; 
  }
}

/**
 * Preenche a tela com os dados do treino
 */
function renderizarSemana(diasDeTreino) {
  const DIAS = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"];

  DIAS.forEach(diaNome => {
    const nomeContainer = document.getElementById(`nome-${diaNome}`);
    const listaContainer = document.getElementById(`lista-${diaNome}`);

    if (!nomeContainer || !listaContainer) return;

    // Encontra o treino para este dia
    // Proteção: garante que diasDeTreino não é nulo
    const listaDias = diasDeTreino || [];
    const treinoDoDia = listaDias.find(d => d.diaSemana === diaNome);

    if (treinoDoDia && treinoDoDia.itensTreino && treinoDoDia.itensTreino.length > 0) {
      // Dia com treino
      nomeContainer.textContent = treinoDoDia.nome || "Treino";
      listaContainer.innerHTML = ""; // Limpa

      treinoDoDia.itensTreino.forEach(item => {
        const nomeExercicio = (item.exercicio && item.exercicio.nome) ? item.exercicio.nome : "Exercício";
        
        const div = document.createElement("div");
        div.className = "exercise-item";
        div.innerHTML = `
            <span class="exercise-name">${nomeExercicio}</span>
            <span class="exercise-details">${item.series}x ${item.repeticoes}</span>
        `;
        listaContainer.appendChild(div);
      });

    } else {
      // Dia de Descanso
      nomeContainer.textContent = "Descanso";
      nomeContainer.style.backgroundColor = "#d4edda"; // Verde claro
      nomeContainer.style.color = "#155724";
      listaContainer.innerHTML = '<p class="empty-day">Nenhum exercício cadastrado.</p>';
    }
  });
}