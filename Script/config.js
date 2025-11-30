// Script/config.js
const API_BASE_URL = "http://localhost:8080"; // Endereço da sua FrotisAPI

// Função auxiliar para pegar o token salvo
function getAuthToken() {
    return localStorage.getItem("fortis_token");
}

// Função para cabeçalhos padrão
function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getAuthToken()
    };
}