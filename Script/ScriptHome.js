document.addEventListener("DOMContentLoaded", function () {
  // 1. Configuração Básica (Nome e Menu)
  const nomeUsuario = localStorage.getItem("usuarioLogado") || "Usuário";
  const role = localStorage.getItem("userRole");
  console.log("DEBUG: Role lida do armazenamento:", role); // <--- Adicione isso
  if (!role) {
      console.warn("DEBUG: Nenhuma role encontrada! Usando fallback de Admin.");
  }
  // Atualiza nome no menu lateral e no título
  const userElem = document.querySelector(".user-name");
  if (userElem) userElem.textContent = nomeUsuario;
  
  // Se for aluno, ajusta título personalizado
  if (role === 'ROLE_ALUNO') {
      document.getElementById("welcomeTitle").textContent = `Vamos treinar, ${nomeUsuario}!`;
  }

  // Navegação Menu
  document.querySelectorAll(".nav-menu li").forEach((item) => {
    item.addEventListener("click", function (event) {
      const pagina = event.currentTarget.dataset.page;
      if (pagina) window.location.href = pagina;
    });
  });

  // Logout
  const btnSair = document.querySelector(".bi-box-arrow-right");
  if(btnSair) {
      btnSair.addEventListener("click", function () {
          if (confirm("Deseja sair do sistema?")) {
            localStorage.clear();
            window.location.href = "Index.html";
          }
      });
  }

  // 2. Direcionamento por Role
  if (role === 'ROLE_ALUNO') {
      configurarDashboardAluno();
  } else if (role === 'ROLE_INSTRUTOR') {
      configurarDashboardInstrutor();
  } else if (role === 'ROLE_GERENCIADOR') {
      configurarDashboardGerenciador();
  } else {
      // Fallback para evitar tela vazia
      configurarDashboardGerenciador();
  }
});

// --- LÓGICA ALUNO ---
async function configurarDashboardAluno() {
    document.getElementById("adminDashboard").style.display = "none";
    document.getElementById("alunoDashboard").style.display = "block";
    
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    // A. Carregar Treino do Dia
    carregarTreinoDoDia(token);

    // B. Carregar Gráfico de Progresso (NOVO)
    carregarGraficoProgresso(token);
}

async function carregarTreinoDoDia(token) {
    const diasSemana = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"];
    const diaHoje = diasSemana[new Date().getDay()];
    document.getElementById("tituloTreinoDia").textContent = `Treino de ${capitalize(diaHoje)}`;

    try {
        // Busca o treino de hoje direto da API
        const response = await fetch("http://localhost:8080/treino/hoje", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
            const treino = await response.json();
            renderizarTreino(treino);
        } else {
            mostrarSemTreino("Descanso! Nenhum treino hoje.");
        }
    } catch (error) {
        console.error("Erro treino:", error);
        mostrarSemTreino("Erro ao carregar treino.");
    }
}

function renderizarTreino(treino) {
    const container = document.getElementById("listaExerciciosHoje");
    const badge = document.getElementById("nomeTreinoDia");
    
    container.innerHTML = "";
    badge.textContent = treino.nome;
    badge.style.backgroundColor = "#007bff";

    treino.exercicios.forEach(ex => {
        const div = document.createElement("div");
        div.className = "item-exercicio";
        div.style.cssText = "display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;";
        div.innerHTML = `
            <span style="font-weight: bold;">${ex.nome}</span>
            <span style="color: #666;">${ex.series}x ${ex.repeticoes}</span>
        `;
        container.appendChild(div);
    });
    
    // Botão Ver Semana
    document.getElementById("btnVerSemana").onclick = () => window.location.href = "VerSemana.html";
}

function mostrarSemTreino(msg) {
    document.getElementById("listaExerciciosHoje").innerHTML = `<p class="text-center text-muted mt-4">${msg}</p>`;
    document.getElementById("nomeTreinoDia").textContent = "--";
    document.getElementById("nomeTreinoDia").style.backgroundColor = "#6c757d";
}

// --- LÓGICA DO GRÁFICO (CHART.JS) ---
async function carregarGraficoProgresso(token) {
    try {
        // Endpoint que criamos no HistoricoController
        const response = await fetch("http://localhost:8080/historico/meu-progresso", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            const historico = await response.json();
            
            // Prepara dados para o Chart.js
            // Pega apenas os últimos 7 treinos para não poluir
            const ultimos = historico.slice(0, 7).reverse(); 
            
            const labels = ultimos.map(h => formatarDataCurta(h.data));
            const dadosCarga = ultimos.map(h => h.cargaTotal);

            renderizarGrafico(labels, dadosCarga);
        }
    } catch (error) {
        console.error("Erro gráfico:", error);
    }
}

function renderizarGrafico(labels, data) {
    const ctx = document.getElementById('graficoProgresso').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Volume de Carga (kg)',
                data: data,
                borderColor: '#0d6efd', // Azul Bootstrap
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                tension: 0.4, // Curva suave
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#0d6efd',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f0f0f0' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// --- UTILITÁRIOS ---
function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatarDataCurta(dataISO) {
    // Entrada: 2025-11-29 -> Saída: 29/11
    if(!dataISO) return "";
    const partes = dataISO.split("-");
    return `${partes[2]}/${partes[1]}`;
}

// --- LÓGICA DO ADMIN/INSTRUTOR (Mantida simplificada) ---
function configurarDashboardGerenciador() {
    document.getElementById("adminDashboard").style.display = "flex";
    document.getElementById("alunoDashboard").style.display = "none";
    carregarStats("http://localhost:8080/aluno/estatisticas");
}

function configurarDashboardInstrutor() {
    document.getElementById("adminDashboard").style.display = "flex";
    document.getElementById("alunoDashboard").style.display = "none";
    const id = localStorage.getItem("instrutorId");
    if(id) carregarStats(`http://localhost:8080/aluno/estatisticas/instrutor/${id}`);
}

async function carregarStats(url) {
    const token = localStorage.getItem("jwtToken");
    try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
        if(res.ok) {
            const stats = await res.json();
            document.getElementById("valAtivos").textContent = stats.ativos;
            document.getElementById("valInativos").textContent = stats.inativos;
            document.getElementById("valNovos").textContent = stats.novos;
        }
    } catch(e) { console.error(e); }
}