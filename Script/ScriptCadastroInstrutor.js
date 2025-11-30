// === FUNÇÕES DE MÁSCARA (NOVO) ===
function formatarCPF(cpf) {
  cpf = cpf.replace(/\D/g, ""); // Remove tudo que não é dígito
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca um ponto entre o terceiro e o quarto dígitos
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca um ponto entre o sexto e o sétimo dígitos
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Coloca um hífen antes dos dois últimos dígitos
  return cpf;
}

function formatarTelefone(tel) {
  tel = tel.replace(/\D/g, "");
  tel = tel.replace(/^(\d{2})(\d)/g, "($1) $2"); // Coloca parênteses em volta dos dois primeiros dígitos
  tel = tel.replace(/(\d{5})(\d)/, "$1-$2"); // Coloca hífen depois do quinto dígito (para celular)
  return tel;
}

function formatarCEP(cep) {
  cep = cep.replace(/\D/g, "");
  cep = cep.replace(/^(\d{5})(\d)/, "$1-$2"); // Coloca hífen depois do quinto dígito
  return cep;
}

// === FUNÇÃO VIACEP (NOVO) ===
async function buscarCEP() {
  const cepInput = document.getElementById("cep");
  const ruaInput = document.getElementById("rua");
  const bairroInput = document.getElementById("bairro");
  const cidadeInput = document.getElementById("cidade");
  const estadoInput = document.getElementById("estado");

  const cep = cepInput.value.replace(/\D/g, ""); // Limpa o CEP

  if (cep.length !== 8) {
    return; // Não busca se o CEP estiver incompleto
  }

  // Feedback visual de "carregando"
  ruaInput.value = "Buscando...";
  bairroInput.value = "Buscando...";
  cidadeInput.value = "Buscando...";
  estadoInput.value = "...";
  
  try {
    // Você já tem esse controller no backend!
    const response = await fetch(`http://localhost:8080/consulta-cep/${cep}`);

    if (response.ok) {
      const data = await response.json();
      if (data.cep) { // Verifica se o ViaCEP retornou um CEP válido
        ruaInput.value = data.logradouro;
        bairroInput.value = data.bairro;
        cidadeInput.value = data.localidade;
        estadoInput.value = data.uf;
        document.getElementById("numero").focus(); // Pula para o campo número
      } else {
        throw new Error("CEP não encontrado.");
      }
    } else {
      throw new Error("Erro ao buscar CEP.");
    }
  } catch (error) {
    console.error(error);
    alert("Não foi possível localizar o CEP. Por favor, digite manualmente.");
    ruaInput.value = "";
    bairroInput.value = "";
    cidadeInput.value = "";
    estadoInput.value = "";
  }
}


// --- Ponto de Entrada: O DOM foi carregado ---
document.addEventListener("DOMContentLoaded", function () {
  
  // 1. Verifica se está em modo de edição (ex: ?id=123)
  const urlParams = new URLSearchParams(window.location.search);
  const instrutorId = urlParams.get("id"); 
  const modoEdicao = instrutorId !== null;

  // --- Funções de Navegação ---
  const iconHome = document.querySelector(".navbar .bi-house-door");
  if (iconHome) {
      iconHome.addEventListener("click", function () {
        if (localStorage.getItem("jwtToken")) {
            window.location.href = "Instrutor.html";
        } else {
            window.location.href = "Index.html";
        }
      });
  }

  // --- (NOVO) CONECTA AS MÁSCARAS E O VIACEP ---
  const cpfInput = document.getElementById("cpf");
  if (cpfInput) {
    cpfInput.addEventListener("input", (e) => {
      e.target.value = formatarCPF(e.target.value);
    });
  }

  const telInput = document.getElementById("telefone");
  if (telInput) {
    telInput.addEventListener("input", (e) => {
      e.target.value = formatarTelefone(e.target.value);
    });
  }
  
  const cepInput = document.getElementById("cep");
  if (cepInput) {
    cepInput.addEventListener("input", (e) => {
      e.target.value = formatarCEP(e.target.value);
    });
    // Adiciona o evento "blur" (quando o usuário sai do campo) para buscar o CEP
    cepInput.addEventListener("blur", buscarCEP);
  }
  // --- FIM DO NOVO TRECHO ---


  // --- FUNÇÃO PARA CARREGAR DADOS (MODO EDIÇÃO) ---
  async function carregarDadosDoInstrutor() {
    if (!modoEdicao) return; 
    
    document.querySelector(".page-title").textContent = "Editar Instrutor";
    document.querySelector(".btn-save").textContent = "ATUALIZAR";
    
    document.getElementById("cpf").disabled = true; 
    
    const senhaInput = document.getElementById("senha");
    const senhaGroup = senhaInput.closest(".form-group");
    if (senhaGroup) {
      senhaGroup.style.display = "none"; 
      senhaInput.removeAttribute("required"); 
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      alert("Sessão expirada. Faça o login para editar.");
      window.location.href = "Index.html";
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/instrutor/buscar/${instrutorId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const instrutor = await response.json();
        
        document.getElementById("nome").value = instrutor.nome;
        document.getElementById("email").value = instrutor.email;
        document.getElementById("cpf").value = formatarCPF(instrutor.cpf); // Formata
        document.getElementById("telefone").value = formatarTelefone(instrutor.telefone); // Formata
        document.getElementById("sexo").value = instrutor.sexo;
        
        if (instrutor.dataNascimento) {
            document.getElementById("nascimento").value = new Date(instrutor.dataNascimento).toISOString().split('T')[0];
        }

        if (instrutor.endereco) {
          document.getElementById("rua").value = instrutor.endereco.rua || "";
          document.getElementById("cidade").value = instrutor.endereco.cidade || "";
          document.getElementById("estado").value = instrutor.endereco.estado || "";
          document.getElementById("cep").value = formatarCEP(instrutor.endereco.cep || ""); // Formata
          document.getElementById("bairro").value = instrutor.endereco.bairro || "";
          // --- (NOVO) CARREGA O NÚMERO ---
          document.getElementById("numero").value = instrutor.endereco.numero || "";
        }
        
      } else {
        alert("Erro ao buscar dados do instrutor. Redirecionando para a lista.");
        window.location.href = "Instrutor.html";
      }
    } catch (error) {
      console.error("Erro de rede ao carregar instrutor:", error);
    }
  }


  // --- LÓGICA DE SALVAR (CRIAR E ATUALIZAR) ---
  document
    .getElementById("cadastroInstrutorForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault(); 
      
      const token = localStorage.getItem("jwtToken");
      
      const instrutorData = {
        nome: document.getElementById("nome").value,
        email: document.getElementById("email").value,
        cpf: document.getElementById("cpf").value.replace(/\D/g, ""), // Limpa a máscara
        telefone: document.getElementById("telefone").value.replace(/\D/g, ""), // Limpa a máscara
        sexo: document.getElementById("sexo").value,
        dataNascimento: document.getElementById("nascimento").value, 
        endereco: {
          rua: document.getElementById("rua").value,
          cidade: document.getElementById("cidade").value,
          estado: document.getElementById("estado").value,
          cep: document.getElementById("cep").value.replace(/\D/g, ""), // Limpa a máscara
          bairro: document.getElementById("bairro").value,
          // --- (NOVO) ENVIA O NÚMERO ---
          numero: document.getElementById("numero").value
        }
      };

      if (!modoEdicao) {
        instrutorData.senha = document.getElementById("senha").value;
      }

      const metodo = modoEdicao ? "PUT" : "POST";
      const url = modoEdicao
        ? `http://localhost:8080/instrutor/atualizar/${instrutorId}` 
        : "http://localhost:8080/instrutor/salvar";

      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(url, {
          method: metodo,
          headers: headers,
          body: JSON.stringify(instrutorData),
        });

        if (response.status === 201 || response.status === 200) {
          alert(
            modoEdicao
              ? "Instrutor atualizado com sucesso!"
              : "Instrutor cadastrado com sucesso!"
          );
          window.location.href = token ? "Instrutor.html" : "Index.html";
        
        } else {
           const errorText = await response.text();
           console.error("Erro da API:", errorText);
           alert("Erro ao salvar. Verifique o console. Código: " + response.status);
        }
      } catch (error) {
        console.error("Erro fatal no script de cadastro:", error);
        alert("Um erro ocorreu no formulário. Verifique o console (F12).");
      }
    });

    // --- LÓGICA DE NAVEGAÇÃO (RESTANTE) ---
  document.querySelectorAll('.nav-menu li').forEach(item => {
    item.addEventListener('click', function(event) {
        const pagina = event.currentTarget.dataset.page; 
        if (pagina) {
            window.location.href = pagina;
        }
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

  // --- INICIALIZAÇÃO DA PÁGINA ---
  carregarDadosDoInstrutor(); // Tenta carregar os dados se for modo de edição
});