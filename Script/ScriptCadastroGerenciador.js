document.addEventListener("DOMContentLoaded", function () {
    // Configurações padrão de navegação (Nome, Sair, Home)
    const nomeUsuario = localStorage.getItem("usuarioLogado") || "Admin";
    document.getElementById("userName").textContent = nomeUsuario;

    document.querySelectorAll(".nav-menu li").forEach((item) => {
        item.addEventListener("click", function (event) {
            const pagina = event.currentTarget.dataset.page;
            if (pagina) window.location.href = pagina;
        });
    });

    document.querySelector(".bi-box-arrow-right").addEventListener("click", function () {
        if (confirm("Deseja sair do sistema?")) {
            localStorage.clear();
            window.location.href = "Index.html";
        }
    });
    
    document.getElementById("iconHome").addEventListener("click", () => window.location.href = "Home.html");

    // Lógica do Formulário
    const form = document.getElementById("cadastroAdminForm");
    
    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const login = document.getElementById("login").value;
        const senha = document.getElementById("senha").value;
        const confirma = document.getElementById("confirmaSenha").value;
        const token = localStorage.getItem("jwtToken");

        if (senha !== confirma) {
            alert("As senhas não conferem!");
            return;
        }

        if (senha.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/admin/cadastrar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ login: login, senha: senha })
            });

            if (response.ok) {
                alert("Novo Gerenciador criado com sucesso!");
                window.location.href = "Home.html";
            } else {
                const text = await response.text();
                alert("Erro ao criar: " + text);
            }
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro de conexão com o servidor.");
        }
    });
});