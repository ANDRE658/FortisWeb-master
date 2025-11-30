function parseJwt(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(function (c) {
                    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join("")
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Erro ao decodificar JWT:", e);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    // Configuração do botão de cadastro (se existir na tela)
    const btCadastrar = document.getElementById("btCadastrarInstrutor");
    if (btCadastrar) {
        btCadastrar.addEventListener("click", function () {
            window.location.href = "CadastroInstrutor.html";
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Impede recarregamento da página

            const emailInput = document.getElementById("email");
            const senhaInput = document.getElementById("senha");

            const username = emailInput.value.trim(); // Pode ser CPF ou Email
            const password = senhaInput.value.trim();

            if (username === "" || password === "") {
                alert("Por favor, preencha todos os campos.");
                return;
            }

            // --- CORREÇÃO CRÍTICA AQUI ---
            // A API espera um objeto com chaves "cpf" e "senha".
            // Enviamos o valor digitado (email ou cpf) no campo 'cpf' do JSON.
            const dadosLogin = {
                cpf: username, 
                senha: password
            };

            try {
                const response = await fetch("http://localhost:8080/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dadosLogin),
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // 1. Salvar o Token com a chave CORRETA ("jwtToken") que o ScriptHome.js usa
                    localStorage.setItem("jwtToken", data.token);
                    
                    // 2. Salvar nome (ou login) para exibir na saudação
                    localStorage.setItem("usuarioLogado", username);

                    console.log("Login realizado com sucesso.");

                    // 3. Decodificar o Token para extrair Permissões (Roles) e IDs
                    const tokenDecodificado = parseJwt(data.token);

                    if (tokenDecodificado) {
                        console.log("Dados do Token:", tokenDecodificado);

                        // Salva IDs se existirem (Importante para ScriptInstrutor.js e ScriptAlunos.js)
                        if (tokenDecodificado.instrutorId) {
                            localStorage.setItem("instrutorId", tokenDecodificado.instrutorId);
                        }
                        if (tokenDecodificado.alunoId) {
                            localStorage.setItem("alunoId", tokenDecodificado.alunoId);
                        }

                        // Salva a ROLE (Importante para ScriptControleAcesso.js)
                        // O Spring Security pode mandar "roles" como array de strings ou objetos
                        if (tokenDecodificado.roles && Array.isArray(tokenDecodificado.roles) && tokenDecodificado.roles.length > 0) {
                            const roleData = tokenDecodificado.roles[0];
                            // Verifica se é objeto {authority: "ROLE_..."} ou string direta
                            const roleName = roleData.authority ? roleData.authority : roleData;
                            
                            localStorage.setItem("userRole", roleName);
                            console.log("Acesso definido como:", roleName);
                        }
                    }

                    // 4. Redirecionar para a Home
                    window.location.href = "home.html";

                } else {
                    // Tratamento de Erros
                    if (response.status === 401 || response.status === 403) {
                        alert("Usuário ou senha inválidos.");
                    } else {
                        // Tenta ler a mensagem de erro do backend
                        const errorText = await response.text();
                        alert("Erro no login: " + (errorText || response.status));
                    }
                }
            } catch (error) {
                console.error("Erro de conexão:", error);
                alert("Não foi possível conectar ao servidor (API). Verifique se ela está rodando.");
            }
        });
    }
});