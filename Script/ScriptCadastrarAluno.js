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
    const response = await fetch(`http://localhost:8080/consulta-cep/${cep}`);

    if (response.ok) {
      const data = await response.json();
      if (data.cep) { 
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

// Aguarda o DOM carregar
document.addEventListener("DOMContentLoaded", function () {
  
  const urlParams = new URLSearchParams(window.location.search);
  const alunoId = urlParams.get("id"); 
  const modoEdicao = alunoId !== null;

  // --- Funções de Navegação ---
  const nomeUsuario = localStorage.getItem("usuarioLogado") || "Instrutor";
  const elUser = document.getElementById("userName");
  if (elUser) elUser.textContent = nomeUsuario;

  document.querySelectorAll(".nav-menu li").forEach((item) => {
    item.addEventListener("click", function (event) {
      const pagina = event.currentTarget.dataset.page;
      if (pagina) {
        window.location.href = pagina;
      }
    });
  });

  const iconHome = document.getElementById("iconHome");
  if (iconHome) {
      iconHome.addEventListener("click", function () {
        window.location.href = "Home.html";
      });
  }

  const btnSair = document.querySelector(".bi-box-arrow-right");
  if (btnSair) {
      btnSair.addEventListener("click", function () {
        if (confirm("Deseja sair do sistema?")) {
          localStorage.clear();
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
    cepInput.addEventListener("blur", buscarCEP);
  }
  // --- FIM DO NOVO TRECHO ---


  // --- FUNÇÃO PARA CARREGAR DADOS (MODO EDIÇÃO) ---
  async function carregarDadosDoAluno() {
    if (!modoEdicao) return; 

    document.querySelector(".page-title").textContent = "Editar Aluno";
    const btnSave = document.querySelector(".btn-save");
    if (btnSave) btnSave.textContent = "ATUALIZAR";
    
    const cpfInput = document.getElementById("cpf");
    if (cpfInput) cpfInput.disabled = true; 
    
    const senhaInput = document.getElementById("senhaProvisoria");
    if (senhaInput) {
        const senhaGroup = senhaInput.closest(".form-group");
        if (senhaGroup) {
          senhaGroup.style.display = "none"; 
          senhaInput.removeAttribute("required"); 
        }
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      alert("Sessão expirada. Faça o login novamente.");
      window.location.href = "Index.html";
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/aluno/buscar/${alunoId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const aluno = await response.json();
        
        document.getElementById("nome").value = aluno.nome || "";
        document.getElementById("email").value = aluno.email || "";
        document.getElementById("cpf").value = formatarCPF(aluno.cpf || ""); // Formata
        document.getElementById("telefone").value = formatarTelefone(aluno.telefone || ""); // Formata
        document.getElementById("sexo").value = aluno.sexo || "";
        document.getElementById("diaVencimento").value = aluno.diaVencimento || "";
        
        if (aluno.dataNascimento) {
            document.getElementById("nascimento").value = new Date(aluno.dataNascimento).toISOString().split('T')[0];
        }
        document.getElementById("altura").value = aluno.altura || "";
        document.getElementById("peso").value = aluno.peso || "";

        if (aluno.endereco) {
          document.getElementById("rua").value = aluno.endereco.rua || "";
          document.getElementById("cidade").value = aluno.endereco.cidade || "";
          document.getElementById("estado").value = aluno.endereco.estado || "";
          document.getElementById("cep").value = formatarCEP(aluno.endereco.cep || ""); // Formata
          document.getElementById("bairro").value = aluno.endereco.bairro || "";
          // --- (NOVO) CARREGA O NÚMERO ---
          document.getElementById("numero").value = aluno.endereco.numero || "";
        }
        
        if (aluno.matriculaList && aluno.matriculaList.length > 0) {
            const matricula = aluno.matriculaList[0];
            if (matricula.plano) {
                document.getElementById("plano").value = matricula.plano.id;
            }
            if (matricula.instrutor) {
                document.getElementById("instrutorSelect").value = matricula.instrutor.id;
            }
        }

      } else {
        alert("Erro ao buscar dados do aluno.");
        window.location.href = "Alunos.html";
      }
    } catch (error) {
      console.error("Erro de rede ao carregar aluno:", error);
    }
  }

  // --- FUNÇÃO PARA CARREGAR PLANOS ---
  async function carregarPlanos() {
    const token = localStorage.getItem("jwtToken");
    const selectPlano = document.getElementById("plano");

    if (!token) {
      selectPlano.innerHTML = '<option value="">Falha (sem token)</option>';
      return Promise.reject(new Error("Sem token"));
    }

    try {
      const response = await fetch("http://localhost:8080/plano/listar", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 204) {
          selectPlano.innerHTML = '<option value="">Nenhum plano ativo</option>';
          return Promise.resolve();
      }

      if (response.ok) {
        const planos = await response.json();
        selectPlano.innerHTML = '<option value="">Selecione um plano</option>'; 
        planos.forEach(plano => {
          const valorFormatado = parseFloat(plano.valor).toFixed(2).replace('.', ',');
          const option = document.createElement('option');
          option.value = plano.id;
          option.textContent = `${plano.nome} (R$ ${valorFormatado})`;
          selectPlano.appendChild(option);
        });
        return Promise.resolve();
      } else {
         throw new Error('Falha ao buscar planos: ' + response.status);
      }
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      selectPlano.innerHTML = '<option value="">Erro ao carregar planos</option>';
      return Promise.reject(error);
    }
  }

  // --- FUNÇÃO PARA CARREGAR INSTRUTORES ---
  async function carregarInstrutores() {
    const token = localStorage.getItem("jwtToken");
    const selectInstrutor = document.getElementById("instrutorSelect");

    if (!token) {
      selectInstrutor.innerHTML = '<option value="">Falha (sem token)</option>';
      return Promise.reject(new Error("Sem token"));
    }

    try {
      const response = await fetch("http://localhost:8080/instrutor/listar", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 204) {
          selectInstrutor.innerHTML = '<option value="">Nenhum instrutor</option>';
          return Promise.resolve();
      }

      if (response.ok) {
        const instrutores = await response.json();
        selectInstrutor.innerHTML = '<option value="">Selecione um instrutor</option>'; 
        instrutores.forEach(instrutor => {
          const option = document.createElement('option');
          option.value = instrutor.id;
          option.textContent = instrutor.nome;
          selectInstrutor.appendChild(option);
        });
        return Promise.resolve();
      } else {
         throw new Error('Falha ao buscar instrutores: ' + response.status);
      }
    } catch (error) {
      console.error("Erro ao carregar instrutores:", error);
      selectInstrutor.innerHTML = '<option value="">Erro ao carregar</option>';
      return Promise.reject(error);
    }
  }


  // --- LÓGICA DE SALVAR (CRIAR E ATUALIZAR) ---
  const form = document.getElementById("cadastroAlunoForm");
  if (form) {
      form.addEventListener("submit", async function (e) {
        e.preventDefault(); 
        
        try {
          const token = localStorage.getItem("jwtToken");
          if (!token) {
            alert("Você não está logado.");
            window.location.href = "Index.html";
            return;
          }
          
         const alunoData = {
            // Dados Pessoais
            nome: document.getElementById("nome").value,
            email: document.getElementById("email").value,
            cpf: document.getElementById("cpf").value.replace(/\D/g, ""),
            telefone: document.getElementById("telefone").value.replace(/\D/g, ""),
            sexo: document.getElementById("sexo").value,
            dataNascimento: document.getElementById("nascimento").value,
            altura: parseFloat(document.getElementById("altura").value || 0),
            peso: parseFloat(document.getElementById("peso").value || 0),
            
            // Senha (só envia se não for edição)
            senha: (!modoEdicao) ? document.getElementById("senhaProvisoria").value : null,

            // Endereço (Direto na raiz, conforme AlunoCompletoDTO)
            rua: document.getElementById("rua").value,
            numero: document.getElementById("numero").value,
            bairro: document.getElementById("bairro").value,
            cidade: document.getElementById("cidade").value,
            estado: document.getElementById("estado").value,
            cep: document.getElementById("cep").value.replace(/\D/g, ""),

            // Dados do Plano (IDs)
            planoId: document.getElementById("plano").value ? parseInt(document.getElementById("plano").value) : null,
            diaVencimento: document.getElementById("diaVencimento").value ? parseInt(document.getElementById("diaVencimento").value) : null,
            instrutorId: document.getElementById("instrutorSelect").value ? parseInt(document.getElementById("instrutorSelect").value) : null
          };

          // 2. Define URL e Método
          const metodo = modoEdicao ? "PUT" : "POST";
          
          // ATENÇÃO: Usando os novos endpoints "-completo"
          const url = modoEdicao
            ? `http://localhost:8080/aluno/atualizar-completo/${alunoId}`
            : "http://localhost:8080/aluno/salvar-completo";

          console.log("Enviando dados para:", url, alunoData); // Debug

          // 3. Envia
          const response = await fetch(url, {
            method: metodo,
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(alunoData),
          });

          if (response.status === 201 || response.status === 200) {
            alert(modoEdicao ? "Aluno atualizado com sucesso!" : "Aluno cadastrado com sucesso!");
            window.location.href = "Alunos.html";
          } else {
             const errorText = await response.text();
             console.error("Erro da API:", errorText);
             alert("Não foi possível salvar: " + errorText);
          }
        } catch (error) {
          console.error("Erro fatal no script de cadastro:", error);
          alert("Um erro ocorreu no formulário. Verifique o console.");
        }
      });
  }

  // --- INICIALIZAÇÃO DA PÁGINA ---
  (async function init() {
      try {
        await carregarPlanos(); 
        await carregarInstrutores(); 
        await carregarDadosDoAluno(); 
      } catch (error) {
          console.error("Falha ao inicializar a página:", error);
      }
  })();
});