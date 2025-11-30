// === VARIÁVEIS GLOBAIS ===
let modoEdicao = false;
let dadosCarregados = {}; 
const userRole = localStorage.getItem("userRole");
const token = localStorage.getItem("jwtToken");

// Configuração de Endpoints
const ENDPOINTS = {
    ROLE_ALUNO: {
        get: "http://localhost:8080/aluno/me",
        update: "http://localhost:8080/aluno/me"
    },
    ROLE_INSTRUTOR: {
        // Ajuste conforme seu backend. Se não tiver /instrutor/me, usa o ID
        get: "http://localhost:8080/instrutor/buscar/" + localStorage.getItem("instrutorId"),
        update: "http://localhost:8080/instrutor/me"
    },

    ROLE_GERENCIADOR: {
        get: null, 
        update: null
    }
};

// === INICIALIZAÇÃO (Ponto de Entrada) ===
document.addEventListener("DOMContentLoaded", () => {
    console.log("Inicializando ScriptMeusDados...");

    // 1. Configurar Botões e Navegação (PRIORIDADE MÁXIMA)
    configurarNavegacao();
    configurarBotoesAcao();

    // 2. Carregar Dados
    carregarMeusDados();
});

// === 1. CONFIGURAÇÃO DE NAVEGAÇÃO E LOGOUT ===
function configurarNavegacao() {
    // Exibir nome do usuário
    const elUser = document.getElementById("userName");
    if (elUser) elUser.textContent = localStorage.getItem("usuarioLogado") || "Usuário";

    // Botão Voltar (Seta)
    const btnVoltar = document.getElementById("botaoVoltarGeral");
    if (btnVoltar) {
        btnVoltar.addEventListener("click", () => window.history.back());
    }

    // Configurar Menu Lateral (Links)
    document.querySelectorAll(".nav-menu li").forEach(li => {
        li.addEventListener("click", () => {
            const page = li.getAttribute("data-page");
            if (page) window.location.href = page;
        });
    });

    // LOGOUT (Configuração Robusta)
    // Tenta pegar pelo ícone OU pelo link que contém o ícone
    const btnSair = document.querySelector(".bi-box-arrow-right");
    const linkSair = btnSair ? btnSair.closest("a") || btnSair.closest("li") : null;

    const acaoSair = (e) => {
        if (e) e.preventDefault();
        if (confirm("Deseja realmente sair do sistema?")) {
            localStorage.clear();
            window.location.href = "Index.html";
        }
    };

    if (linkSair) linkSair.addEventListener("click", acaoSair);
    else if (btnSair) btnSair.addEventListener("click", acaoSair);
}

// === 2. CONFIGURAÇÃO DOS BOTÕES DO FORMULÁRIO ===
function configurarBotoesAcao() {
    // Botão Editar/Cancelar
    const btnToggle = document.getElementById("btnToggleEdit");
    if (btnToggle) btnToggle.addEventListener("click", toggleEdicao);

    // Submit do Formulário
    const form = document.getElementById("meusDadosForm");
    if (form) form.addEventListener("submit", salvarDados);

    // Formulário de Senha
    const formSenha = document.getElementById("alterarSenhaForm");
    if (formSenha) formSenha.addEventListener("submit", alterarSenha);

    // Busca de CEP
    const inputCep = document.getElementById("cep");
    if (inputCep) inputCep.addEventListener("blur", buscarCEP);
}

// === 3. LÓGICA DE DADOS (API) ===
async function carregarMeusDados() {
    const endpoint = ENDPOINTS[userRole];

    if (userRole === 'ROLE_GERENCIADOR') {
        document.getElementById("nome").value = "Administrador Geral";
        document.getElementById("email").value = "admin@fortis.com";
        // Desabilita edição
        document.getElementById("btnToggleEdit").style.display = "none";
        return; 
    }
    
    if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = "Index.html";
        return;
    }

    if (!endpoint) {
        console.error("Role indefinida ou endpoint não configurado:", userRole);
        return;
    }

    try {
        const response = await fetch(endpoint.get, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Dados recebidos:", data);
            dadosCarregados = data;
            preencherFormulario(data);
        } else {
            console.error("Erro API:", response.status);
            // Se der 403/401, talvez o token tenha expirado
            if (response.status === 403 || response.status === 401) {
                alert("Acesso negado. Faça login novamente.");
                window.location.href = "Index.html";
            }
        }
    } catch (error) {
        console.error("Erro de rede ao carregar dados:", error);
    }
}

function preencherFormulario(data) {
    // Helper para setar valor sem quebrar se o input não existir
    const setVal = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.value = valor || "";
    };

    setVal("nome", data.nome);
    setVal("cpf", formatarCPF(data.cpf || data.CPF));
    setVal("email", data.email);
    setVal("telefone", formatarTelefone(data.telefone));
    setVal("sexo", data.sexo);

    if (data.dataNascimento) {
        try {
            const dataFormatada = new Date(data.dataNascimento).toISOString().split('T')[0];
            setVal("nascimento", dataFormatada);
        } catch (e) { console.error("Erro data", e); }
    }

    // Tratamento de Endereço (Híbrido)
    const end = data.endereco || data; // Se 'endereco' for null, tenta pegar da raiz
    
    setVal("cep", formatarCEP(end.cep));
    setVal("rua", end.rua);
    setVal("numero", end.numero);
    setVal("bairro", end.bairro);
    setVal("cidade", end.cidade);
    setVal("estado", end.estado);
}

// === 4. SALVAMENTO ===
async function salvarDados(e) {
    e.preventDefault();
    const endpoint = ENDPOINTS[userRole];

    // Pega valores com segurança
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : "";
    };
    
    const payload = {
        nome: getVal("nome"),
        telefone: getVal("telefone").replace(/\D/g, ""),
        dataNascimento: getVal("nascimento"),
        sexo: getVal("sexo"),
        cep: getVal("cep").replace(/\D/g, ""),
        rua: getVal("rua"),
        numero: getVal("numero"),
        bairro: getVal("bairro"),
        cidade: getVal("cidade"),
        estado: getVal("estado")
    };

    try {
        const response = await fetch(endpoint.update, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const atualizado = await response.json();
            dadosCarregados = atualizado;
            alert("Dados atualizados com sucesso!");
            toggleEdicao();
            preencherFormulario(atualizado);
        } else {
            alert("Erro ao salvar: " + response.status);
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão.");
    }
}

async function alterarSenha(e) {
    e.preventDefault();
    const atual = document.getElementById("senhaAtual").value;
    const nova = document.getElementById("novaSenha").value;
    const conf = document.getElementById("confirmarNovaSenha").value;

    if (nova !== conf) {
        alert("As senhas não conferem.");
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/auth/alterar-senha", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ senhaAtual: atual, novaSenha: nova })
        });

        if (response.ok) {
            alert("Senha alterada com sucesso!");
            e.target.reset();
        } else {
            const text = await response.text();
            alert("Erro: " + text);
        }
    } catch (e) {
        alert("Erro de conexão ao alterar senha.");
    }
}

// === FUNÇÕES DE UI ===
function toggleEdicao() {
    modoEdicao = !modoEdicao;
    const form = document.getElementById("meusDadosForm");
    const btn = document.getElementById("btnToggleEdit");
    const botoesSalvar = document.getElementById("botoesDadosPessoais");
    const botaoVoltar = document.getElementById("botaoVoltarGeral");
    
    if (!form || !btn) return;

    if (modoEdicao) {
        form.classList.remove("view-mode");
        btn.innerHTML = "Cancelar";
        if(botoesSalvar) botoesSalvar.style.display = "flex";
        if(botaoVoltar) botaoVoltar.style.display = "none";

        form.querySelectorAll(".form-control").forEach(el => {
            if(el.id !== 'cpf' && el.id !== 'email') el.removeAttribute('readonly');
            if(el.tagName === "SELECT") el.disabled = false;
        });
    } else {
        form.classList.add("view-mode");
        btn.innerHTML = "Editar";
        if(botoesSalvar) botoesSalvar.style.display = "none";
        if(botaoVoltar) botaoVoltar.style.display = "block";

        form.querySelectorAll(".form-control").forEach(el => {
            el.setAttribute('readonly', true);
            if(el.tagName === "SELECT") el.disabled = true;
        });
        preencherFormulario(dadosCarregados);
    }
}

// === UTILS ===
async function buscarCEP() {
    const elCep = document.getElementById("cep");
    if(!elCep) return;
    
    const cep = elCep.value.replace(/\D/g, "");
    if(cep.length !== 8) return;
    
    try {
        const res = await fetch(`http://localhost:8080/consulta-cep/${cep}`);
        if(res.ok) {
            const data = await res.json();
            const set = (id, val) => { 
                const el = document.getElementById(id); 
                if(el) el.value = val || ""; 
            };
            set("rua", data.logradouro);
            set("bairro", data.bairro);
            set("cidade", data.localidade);
            set("estado", data.uf);
        }
    } catch(e) { console.warn(e); }
}

function formatarCPF(v) { return v ? v.replace(/\D/g,"").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : ""; }
function formatarTelefone(v) { return v ? v.replace(/\D/g,"").replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3") : ""; }
function formatarCEP(v) { return v ? v.replace(/\D/g,"").replace(/^(\d{5})(\d{3})/, "$1-$2") : ""; }