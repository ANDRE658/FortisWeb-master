document.addEventListener("DOMContentLoaded", function () {
    aplicarPermissoesDeMenu();
});

function aplicarPermissoesDeMenu() {
    const role = localStorage.getItem('userRole');
    
    if (!role) return;

    // Definição das permissões: Quem pode ver o quê?
    const permissoes = {
        'ROLE_GERENCIADOR': [
            'Alunos.html', 
            'Planos.html', 
            'Instrutor.html', 
            'Relatorios.html',
            'Mensalidades.html',
            'Suporte.html',
            'Treinos.html',
            'Exercicios.html',
            'MeusDados.html',
            'CadastroGerenciador.html'
        ],
        'ROLE_INSTRUTOR': [
            'MeusDados.html', // <--- ADICIONE AQUI
            'Alunos.html', 
            'Treinos.html', 
            'VisualizarAluno.html',
            'Exercicios.html',
            'Suporte.html'
        ],
        'ROLE_ALUNO': [
            'MeusDados.html', // <--- ADICIONE AQUI // O Aluno vê Treinos, mas vamos mudar o link
            'Treinos.html',
            'Suporte.html'
        ]
    };

    // Pega todas as opções do menu lateral
    const itensMenu = document.querySelectorAll('.nav-menu li');

    itensMenu.forEach(item => {
        const paginaDestino = item.getAttribute('data-page');
        
        // Se a página não estiver na lista permitida para essa Role, esconde
        if (permissoes[role]) {
            const permitido = permissoes[role].some(p => paginaDestino.trim() === p);

            if (!permitido) {
                item.style.display = 'none'; // Esconde o item
            }
        }
    });

    // === AJUSTE ESPECIAL PARA ALUNO ===
    if (role === 'ROLE_ALUNO') {
        const itemTreinoMenu = document.querySelector('.nav-menu li[data-page="Treinos.html"]');
        
        if (itemTreinoMenu) {
            // 1. Muda o nome do menu
            itemTreinoMenu.innerHTML = '<i class="bi bi-calendar-week"></i> Meu Treino Semanal';
            
            // 2. Muda o link (data-page) para a nova tela
            itemTreinoMenu.setAttribute('data-page', 'VerSemana.html');
            
            // 3. Se o aluno JÁ ESTIVER na nova página, marca como "active"
            if (window.location.href.includes('VerSemana.html')) {
                itemTreinoMenu.classList.add('active');
            }
        }
        
        // Esconde botão de criar treino (na tela de Treinos, se ele for pra lá)
        const btnCriar = document.getElementById('btnCriarTreino');
        if(btnCriar) btnCriar.style.display = 'none';
    }
}