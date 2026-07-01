/* Financeiro: agregações sobre as sessões (recebido no mês, a receber, total). */

const Financeiro = {
    render() {
        const container = document.getElementById('financeiro-conteudo');
        const inputMes = document.getElementById('financeiro-mes');
        if (!inputMes.value) inputMes.value = Util.mesAtual();
        const mes = inputMes.value;

        const sessoes = Store.getSessoes();
        const realizadas = sessoes.filter(s => s.status === 'realizada');

        const recebidoMes = realizadas
            .filter(s => s.pago && s.data.startsWith(mes))
            .reduce((soma, s) => soma + (s.valorPago || 0), 0);

        const aReceber = realizadas
            .filter(s => !s.pago)
            .reduce((soma, s) => {
                const t = Store.terapiaPorId(s.terapiaId);
                return soma + (t ? t.preco : 0);
            }, 0);

        const recebidoTotal = realizadas
            .filter(s => s.pago)
            .reduce((soma, s) => soma + (s.valorPago || 0), 0);

        const doMes = realizadas
            .filter(s => s.data.startsWith(mes))
            .sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));

        container.innerHTML = `
            <div class="cards-grid">
                <div class="card card-resumo">
                    <div class="rotulo">Recebido em ${Util.esc(Util.formatMes(mes))}</div>
                    <div class="valor">${Util.formatBRL(recebidoMes)}</div>
                </div>
                <div class="card card-resumo">
                    <div class="rotulo">A receber (sessões realizadas)</div>
                    <div class="valor">${Util.formatBRL(aReceber)}</div>
                </div>
                <div class="card card-resumo">
                    <div class="rotulo">Recebido total</div>
                    <div class="valor">${Util.formatBRL(recebidoTotal)}</div>
                </div>
            </div>

            <h3 class="dia-titulo">Sessões realizadas em ${Util.esc(Util.formatMes(mes))}</h3>
            ${doMes.length === 0
                ? '<div class="vazio">Nenhuma sessão realizada neste mês.</div>'
                : '<div class="card">' + doMes.map(s => this.renderLinha(s)).join('') + '</div>'}
        `;
    },

    renderLinha(s) {
        const cliente = Store.clientePorId(s.clienteId);
        const terapia = Store.terapiaPorId(s.terapiaId);
        const valor = s.pago ? s.valorPago : (terapia ? terapia.preco : 0);
        return `
        <div class="item-lista">
            <div class="item-info">
                <div class="item-titulo">${Util.formatDataCurta(s.data)} — ${Util.esc(cliente ? cliente.nome : '?')}</div>
                <div class="item-detalhe">
                    ${Util.esc(terapia ? terapia.nome : '?')} · ${Util.formatBRL(valor)}
                    ${s.pago
                        ? '<span class="badge badge-pago">pago</span>'
                        : '<span class="badge badge-pendente">a receber</span>'}
                </div>
            </div>
            <div class="item-acoes">
                ${s.pago ? '' : `<button class="btn btn-mini btn-primario" data-action="sessao-pagar" data-id="${s.id}">$ Marcar pago</button>`}
            </div>
        </div>`;
    },

    onClick(action, id) {
        if (action === 'sessao-pagar') Agenda.marcarPago(id);
    },

    bind() {
        document.getElementById('financeiro-mes').addEventListener('change', () => this.render());
    }
};
