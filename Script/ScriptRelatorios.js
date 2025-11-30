// Inicialização e Navegação
document.addEventListener("DOMContentLoaded", function () {
  const nomeUsuario = localStorage.getItem("usuarioLogado") || "Instrutor";
  const elUser = document.getElementById("userName");
  if (elUser) elUser.textContent = nomeUsuario;

  // Navegação
  document.querySelectorAll(".nav-menu li").forEach((item) => {
    item.addEventListener("click", function (event) {
      const pagina = event.currentTarget.dataset.page;
      if (pagina) window.location.href = pagina;
    });
  });

  // Sair
  const btnSair = document.querySelector(".bi-box-arrow-right");
  if (btnSair) {
    btnSair.addEventListener("click", function () {
      if (confirm("Deseja sair do sistema?")) {
        localStorage.clear();
        window.location.href = "Index.html";
      }
    });
  }

  // Home
  const iconHome = document.getElementById("iconHome");
  if (iconHome) {
    iconHome.addEventListener("click", function () {
      window.location.href = "Home.html";
    });
  }
});

// ==========================================
// === LÓGICA DE GERAÇÃO COM FILTROS ===
// ==========================================
const { jsPDF } = window.jspdf;

async function gerarRelatorio(tipo, formato) {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        alert("Sessão expirada."); return;
    }

    document.body.style.cursor = "wait";

    try {
        let dadosAPI = [];
        let dadosFiltrados = [];
        let colunas = [];
        let linhas = [];
        let titulo = "";
        let nomeArquivo = "";

        // --- CASO 1: RELATÓRIO DE ALUNOS ---
        if (tipo === 'alunos') {
            // CORREÇÃO: URL alterada de /listar-todos para /listar
            const response = await fetch("http://localhost:8080/aluno/listar", {
                headers: { Authorization: `Bearer ${token}` }
            });
            dadosAPI = await response.json();

            const filtroStatus = document.getElementById("filtroAlunoStatus").value;
            
            dadosFiltrados = dadosAPI.filter(aluno => {
                if (filtroStatus === 'todos') return true;
                if (filtroStatus === 'ativo') return aluno.ativo === true;
                if (filtroStatus === 'inativo') return aluno.ativo === false;
                return true;
            });

            titulo = `Relatório de Alunos (${filtroStatus.toUpperCase()})`;
            nomeArquivo = "relatorio_alunos";
            colunas = ["Nome", "CPF", "Email", "Telefone", "Plano", "Status"];
            
            linhas = dadosFiltrados.map(a => {
                // Tratamento seguro para plano (agora que corrigimos o relacionamento)
                let nomePlano = "Sem Plano";
                if (a.matriculaList && a.matriculaList.length > 0) {
                    // Pega a matrícula mais recente ou ativa
                    const mat = a.matriculaList.find(m => m.ativa) || a.matriculaList[0];
                    if (mat && mat.plano) nomePlano = mat.plano.nome;
                }
                
                const status = a.ativo ? "Ativo" : "Inativo";
                return [a.nome, a.cpf, a.email, a.telefone, nomePlano, status];
            });

        // --- CASO 2: RELATÓRIO DE MENSALIDADES ---
        } else if (tipo === 'mensalidades') {
            const response = await fetch("http://localhost:8080/mensalidade/listar", {
                headers: { Authorization: `Bearer ${token}` }
            });
            dadosAPI = await response.json();

            const filtroStatus = document.getElementById("filtroMensalidadeStatus").value;
            const filtroTexto = document.getElementById("filtroMensalidadeAluno").value.toLowerCase();
            const hoje = new Date(); hoje.setHours(0,0,0,0);

            dadosFiltrados = dadosAPI.filter(m => {
                const nome = m.aluno ? m.aluno.nome.toLowerCase() : "";
                const cpf = m.aluno ? m.aluno.cpf : "";
                if (filtroTexto && !nome.includes(filtroTexto) && !cpf.includes(filtroTexto)) return false;

                const dataVenc = new Date(m.dataVencimento);
                // Ajuste de fuso para comparação correta
                const dataVencComp = new Date(dataVenc.getUTCFullYear(), dataVenc.getUTCMonth(), dataVenc.getUTCDate());

                if (filtroStatus === 'todos') return true;
                if (filtroStatus === 'pago') return m.pago;
                if (filtroStatus === 'vencido') return !m.pago && dataVencComp < hoje;
                if (filtroStatus === 'aberto') return !m.pago && dataVencComp >= hoje;
                return true;
            });

            titulo = "Relatório de Mensalidades";
            nomeArquivo = "relatorio_mensalidades";
            colunas = ["Aluno", "CPF", "Vencimento", "Valor", "Pagamento", "Status"];
            
            linhas = dadosFiltrados.map(m => {
                const venc = new Date(m.dataVencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                const pagto = m.dataPagamento ? new Date(m.dataPagamento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : "-";
                
                let statusLabel = "Aberto";
                const dataVenc = new Date(m.dataVencimento);
                const dataVencComp = new Date(dataVenc.getUTCFullYear(), dataVenc.getUTCMonth(), dataVenc.getUTCDate());
                
                if(m.pago) statusLabel = "Pago";
                else if(dataVencComp < hoje) statusLabel = "Vencido";

                return [m.aluno?.nome || "---", m.aluno?.cpf || "---", venc, `R$ ${m.valor.toFixed(2)}`, pagto, statusLabel];
            });

        // --- CASO 3: RELATÓRIO DE PLANOS ---
        } else if (tipo === 'planos') {
            const response = await fetch("http://localhost:8080/plano/listar", {
                headers: { Authorization: `Bearer ${token}` }
            });
            dadosAPI = await response.json();

            // Filtros
            const filtroStatus = document.getElementById("filtroPlanoStatus").value;
            const filtroNome = document.getElementById("filtroPlanoNome").value.toLowerCase();

            dadosFiltrados = dadosAPI.filter(p => {
                if (filtroNome && !p.nome.toLowerCase().includes(filtroNome)) return false;
                
                // CORREÇÃO: Considera null ou undefined como TRUE (Ativo)
                const isAtivo = (p.ativo === false) ? false : true;

                if (filtroStatus === 'todos') return true;
                if (filtroStatus === 'ativo') return isAtivo === true;
                if (filtroStatus === 'inativo') return isAtivo === false;
                return true;
            });

            titulo = "Relatório de Planos";
            nomeArquivo = "relatorio_planos";
            colunas = ["ID", "Nome do Plano", "Valor (R$)", "Status"];
            
            linhas = dadosFiltrados.map(p => {
                // CORREÇÃO VISUAL TAMBÉM
                const isAtivo = (p.ativo === false) ? false : true;
                
                return [
                    p.id,
                    p.nome,
                    parseFloat(p.valor).toFixed(2).replace('.', ','),
                    isAtivo ? "Ativo" : "Inativo"
                ];
            });
        }

        // --- GERA O ARQUIVO ---
        if (linhas.length === 0) {
            alert("Nenhum registro encontrado com esses filtros.");
        } else {
            if (formato === 'pdf') exportarParaPDF(titulo, colunas, linhas, nomeArquivo);
            else if (formato === 'excel') exportarParaExcel(colunas, linhas, nomeArquivo);
        }

    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao gerar relatório. Verifique o console.");
    } finally {
        document.body.style.cursor = "default";
    }
}

// --- Função para Gerar PDF (usando jsPDF + AutoTable) ---
function exportarParaPDF(titulo, colunas, linhas, nomeArquivo) {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 139); // Azul #00008B
  doc.text(titulo, 14, 22);

  // Data de emissão
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

  // Tabela
  doc.autoTable({
    head: [colunas],
    body: linhas,
    startY: 35,
    theme: "grid",
    headStyles: { fillColor: [0, 0, 139] }, // Azul no cabeçalho
    styles: { fontSize: 10 },
  });

  doc.save(`${nomeArquivo}.pdf`);
}

// --- Função para Gerar Excel (usando SheetJS) ---
function exportarParaExcel(colunas, linhas, nomeArquivo) {
  // Adiciona o cabeçalho como a primeira linha
  const dadosComCabecalho = [colunas, ...linhas];

  // Cria uma nova planilha (WorkBook)
  const wb = XLSX.utils.book_new();

  // Converte os dados (array de arrays) para uma folha (WorkSheet)
  const ws = XLSX.utils.aoa_to_sheet(dadosComCabecalho);

  // Adiciona a folha ao workbook
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");

  // Baixa o arquivo
  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
}
