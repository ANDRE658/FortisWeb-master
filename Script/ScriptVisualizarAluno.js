// --- Variáveis Globais ---
let alunoId = null;

/**
 * Função auxiliar para calcular o IMC
 */
function calcularIMC(peso, alturaCm) {
    if (alturaCm <= 0) return 0;
    const alturaM = alturaCm / 100.0;
    const imc = peso / (alturaM * alturaM);
    return imc.toFixed(2); // Retorna formatado com 2 casas
}

/**
 * Atualiza o display do IMC na tela em tempo real
 * (baseado nos valores que estão nos inputs)
 */
function atualizarDisplayIMC() {
    const peso = parseFloat(document.getElementById("peso").value);
    const altura = parseFloat(document.getElementById("altura").value);
    
    if (peso > 0 && altura > 0) {
        const imc = calcularIMC(peso, altura);
        document.getElementById("imc").textContent = imc;
    } else {
        document.getElementById("imc").textContent = "--";
    }
}

/**
 * Formata a data de YYYY-MM-DD para DD/MM/YYYY
 */
function formatarData(dataISO) {
    if (!dataISO) return "--/--/----";
    const [ano, mes, dia] = dataISO.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
}

/**
 * Formata o sexo para exibição
 */
function formatarSexo(sexoChar) {
    if (sexoChar === 'M') return "Masculino";
    if (sexoChar === 'F') return "Feminino";
    return "Não informado";
}

/**
 * Carrega os dados do aluno da API ao abrir a página
 */
async function carregarDadosAluno() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        alert("Sessão expirada!");
        window.location.href = "Index.html";
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/aluno/visualizar/${alunoId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Falha ao carregar dados do aluno.");
        }

        const aluno = await response.json();

        // Preenche os campos de texto
        document.getElementById("nomeAlunoTitulo").textContent = aluno.nome || "Aluno";
        document.getElementById("idade").textContent = aluno.idade > 0 ? `${aluno.idade} anos` : "--";
        document.getElementById("sexo").textContent = formatarSexo(aluno.sexo);
        document.getElementById("dataInicio").textContent = formatarData(aluno.dataInicio);
        
        // Preenche os Inputs (para permitir edição)
        document.getElementById("altura").value = aluno.altura || 0;
        document.getElementById("peso").value = aluno.peso.toFixed(1) || 0;
        
        // Calcula IMC inicial
        atualizarDisplayIMC();

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
        window.location.href = "Alunos.html";
    }
}

/**
 * Salva a NOVA ALTURA (Correção Cadastral)
 */
async function salvarNovaAltura(event) {
    event.preventDefault(); // Impede o recarregamento da página
    const token = localStorage.getItem("jwtToken");
    const novaAltura = parseFloat(document.getElementById("altura").value);

    if (!novaAltura || novaAltura <= 0) {
        alert("Por favor, insira uma altura válida (em cm).");
        return;
    }

    try {
        // Chama o novo endpoint específico para altura
        const response = await fetch(`http://localhost:8080/aluno/atualizar-altura/${alunoId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ novaAltura: novaAltura })
        });

        if (!response.ok) {
            const erro = await response.text();
            throw new Error(erro);
        }

        alert("Altura corrigida com sucesso!");
        atualizarDisplayIMC(); // Garante que o IMC na tela esteja correto

    } catch (error) {
        console.error("Erro ao salvar altura:", error);
        alert(`Erro: ${error.message}`);
    }
}

/**
 * Salva o NOVO PESO (Atualização de Rotina)
 */
async function salvarNovoPeso(event) {
    event.preventDefault();
    const token = localStorage.getItem("jwtToken");
    const novoPeso = parseFloat(document.getElementById("peso").value);

    if (!novoPeso || novoPeso <= 0) {
        alert("Por favor, insira um peso válido.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/aluno/atualizar-peso/${alunoId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ novoPeso: novoPeso })
        });

        if (!response.ok) {
            const erro = await response.text();
            throw new Error(erro);
        }

        alert("Peso atualizado com sucesso!");
        atualizarDisplayIMC();

    } catch (error) {
        console.error("Erro ao salvar peso:", error);
        alert(`Erro: ${error.message}`);
    }
}

// --- Ponto de Entrada: O DOM foi carregado ---
document.addEventListener("DOMContentLoaded", function () {
    // 1. Pega o ID do aluno da URL
    const urlParams = new URLSearchParams(window.location.search);
    alunoId = urlParams.get("id");

    if (!alunoId) {
        alert("ID do aluno não encontrado.");
        window.location.href = "Alunos.html";
        return;
    }

    // 2. Carrega os dados iniciais
    carregarDadosAluno();

    // 3. Configura a navegação padrão
    const nomeUsuario = localStorage.getItem("usuarioLogado") || "Usuário";
    const elUser = document.getElementById("userName");
    if (elUser) elUser.textContent = nomeUsuario;

    // 4. Conecta os eventos dos DOIS formulários independentes
    document.getElementById("alturaForm").addEventListener("submit", salvarNovaAltura);
    document.getElementById("pesoForm").addEventListener("submit", salvarNovoPeso);

    // 5. Recalcula o IMC dinamicamente enquanto o usuário digita (Feedback Visual)
    document.getElementById("altura").addEventListener("input", atualizarDisplayIMC);
    document.getElementById("peso").addEventListener("input", atualizarDisplayIMC);

    // 6. Lógica de Menu e Sair
    document.querySelectorAll(".nav-menu li").forEach((item) => {
        item.addEventListener("click", function (event) {
            const pagina = event.currentTarget.dataset.page;
            if (pagina) window.location.href = pagina;
        });
    });

    document.getElementById("iconHome").addEventListener("click", () => window.location.href = 'home.html');
    
    document.querySelector(".navbar .bi-box-arrow-right").addEventListener("click", () => {
        if (confirm("Deseja sair do sistema?")) {
            localStorage.clear();
            window.location.href = "Index.html";
        }
    });
});