/* Agenda: sessões agrupadas por dia, transições de status e registro de pagamento. */

const Agenda = {
    filtro: 'proximas',

    render() {
        const container = document.getElementById('agenda-lista');
        const hoje = Util.hoje();
        let sessoes = Store.getSessoes();

        if (this.filtro === 'proximas') {
            sessoes = sessoes.filter(s => s.status === 'agendada' && s.data >= hoje);
        } else if (this.filtro !== 'todas') {
            sessoes = sessoes.filter(s => s.status === this.filtro);
        }
        sessoes.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

        if (sessoes.length === 0) {
            container.innerHTML = this.filtro === 'proximas'
                ? '<div class="vazio">Nenhuma sessão agendada. Clique em "+ Nova sessão" para começar!</div>'
                : '<div class="vazio">Nenhuma sessão neste filtro.</div>';
            return;
        }

        // agrupa por dia mantendo a ordem
        const grupos = [];
        for (const s of sessoes) {
            const ultimo = grupos[grupos.length - 1];
            if (ultimo && ultimo.data === s.data) ultimo.itens.push(s);
            else grupos.push({ data: s.data, itens: [s] });
        }

        container.innerHTML = grupos.map(g => `
            <div class="dia-grupo">
                <div class="dia-titulo">${Util.formatData(g.data)}${g.data === hoje ? ' · hoje' : ''}</div>
                <div class="card">
                    ${g.itens.map(s => this.renderSessao(s)).join('')}
                </div>
            </div>
        `).join('');
    },

    renderSessao(s) {
        const cliente = Store.clientePorId(s.clienteId);
        const terapia = Store.terapiaPorId(s.terapiaId);
        const acoes = [];

        if (s.status === 'agendada') {
            acoes.push(`<button class="btn btn-mini" data-action="sessao-realizada" data-id="${s.id}">✓ Realizada</button>`);
            acoes.push(`<button class="btn btn-mini" data-action="sessao-editar" data-id="${s.id}">Editar</button>`);
            acoes.push(`<button class="btn btn-mini btn-perigo" data-action="sessao-cancelar" data-id="${s.id}">Cancelar</button>`);
        } else if (s.status === 'realizada' && !s.pago) {
            acoes.push(`<button class="btn btn-mini btn-primario" data-action="sessao-pagar" data-id="${s.id}">$ Marcar pago</button>`);
        }

        return `
        <div class="item-lista">
            <div class="item-info">
                <div class="item-titulo">${s.hora} — ${Util.esc(cliente ? cliente.nome : '?')}</div>
                <div class="item-detalhe">
                    ${Util.esc(terapia ? terapia.nome : '?')} (${terapia ? terapia.duracaoMin : '?'} min)
                    · <span class="badge badge-${s.status}">${s.status}</span>
                    ${s.status === 'realizada' ? (s.pago
                        ? `<span class="badge badge-pago">pago ${Util.formatBRL(s.valorPago)}</span>`
                        : '<span class="badge badge-pendente">a receber</span>') : ''}
                    ${s.observacoes ? `<br>📝 ${Util.esc(s.observacoes)}` : ''}
                </div>
            </div>
            <div class="item-acoes">${acoes.join('')}</div>
        </div>`;
    },

    preencherSelects() {
        const selCliente = document.getElementById('sessao-cliente');
        const selTerapia = document.getElementById('sessao-terapia');

        const clientes = Store.getClientes().slice()
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        selCliente.innerHTML = '<option value="">Selecione...</option>' + clientes.map(c =>
            `<option value="${c.id}">${Util.esc(c.nome)}</option>`).join('');

        const terapias = Store.getTerapias().filter(t => t.ativo);
        selTerapia.innerHTML = '<option value="">Selecione...</option>' + terapias.map(t =>
            `<option value="${t.id}">${Util.esc(t.nome)} — ${t.duracaoMin} min — ${Util.formatBRL(t.preco)}</option>`).join('');
    },

    abrirForm(sessao) {
        if (Store.getClientes().length === 0 || Store.getTerapias().filter(t => t.ativo).length === 0) {
            alert('Antes de agendar, cadastre pelo menos um cliente e uma terapia ativa.');
            return;
        }
        this.preencherSelects();
        document.getElementById('form-sessao-titulo').textContent = sessao ? 'Editar sessão' : 'Nova sessão';
        document.getElementById('sessao-id').value = sessao ? sessao.id : '';
        document.getElementById('sessao-cliente').value = sessao ? sessao.clienteId : '';
        document.getElementById('sessao-terapia').value = sessao ? sessao.terapiaId : '';
        document.getElementById('sessao-data').value = sessao ? sessao.data : Util.hoje();
        document.getElementById('sessao-hora').value = sessao ? sessao.hora : '';
        document.getElementById('sessao-obs').value = sessao ? sessao.observacoes : '';
        document.getElementById('form-sessao').classList.remove('escondida');
        document.getElementById('sessao-cliente').focus();
    },

    fecharForm() {
        document.getElementById('form-sessao').classList.add('escondida');
        document.getElementById('form-sessao').reset();
    },

    salvar() {
        const id = document.getElementById('sessao-id').value;
        const dados = {
            clienteId: document.getElementById('sessao-cliente').value,
            terapiaId: document.getElementById('sessao-terapia').value,
            data: document.getElementById('sessao-data').value,
            hora: document.getElementById('sessao-hora').value,
            observacoes: document.getElementById('sessao-obs').value.trim()
        };
        if (!dados.clienteId || !dados.terapiaId || !dados.data || !dados.hora) return;

        const lista = Store.getSessoes();
        const conflito = lista.find(s =>
            s.id !== id && s.status === 'agendada' && s.data === dados.data && s.hora === dados.hora);
        if (conflito && !confirm('Já existe uma sessão agendada neste dia e horário. Agendar mesmo assim?')) {
            return;
        }

        if (id) {
            const s = lista.find(x => x.id === id);
            if (s) Object.assign(s, dados);
        } else {
            lista.push({
                id: Store.nextId('s'), status: 'agendada', pago: false, valorPago: null, ...dados
            });
        }
        Store.saveSessoes(lista);
        this.fecharForm();
        App.renderTudo();
    },

    mudarStatus(id, status) {
        const lista = Store.getSessoes();
        const s = lista.find(x => x.id === id);
        if (!s) return;
        if (status === 'cancelada' && !confirm('Cancelar esta sessão? Ela ficará no histórico como cancelada.')) return;
        s.status = status;
        Store.saveSessoes(lista);
        App.renderTudo();
    },

    marcarPago(id) {
        const lista = Store.getSessoes();
        const s = lista.find(x => x.id === id);
        if (!s || s.pago) return;

        const terapia = Store.terapiaPorId(s.terapiaId);
        const padrao = terapia ? terapia.preco : 0;
        const resposta = prompt('Valor recebido (R$):', String(padrao).replace('.', ','));
        if (resposta === null) return;
        const valor = parseFloat(resposta.replace(/\./g, '').replace(',', '.'));
        if (isNaN(valor) || valor < 0) {
            alert('Valor inválido.');
            return;
        }
        s.pago = true;
        s.valorPago = valor;
        Store.saveSessoes(lista);
        App.renderTudo();
    },

    sessaoPorId(id) {
        return Store.getSessoes().find(s => s.id === id) || null;
    },

    onClick(action, id) {
        if (action === 'agenda-nova') this.abrirForm(null);
        else if (action === 'agenda-cancelar-form') this.fecharForm();
        else if (action === 'sessao-editar') this.abrirForm(this.sessaoPorId(id));
        else if (action === 'sessao-realizada') this.mudarStatus(id, 'realizada');
        else if (action === 'sessao-cancelar') this.mudarStatus(id, 'cancelada');
        else if (action === 'sessao-pagar') this.marcarPago(id);
    },

    bind() {
        document.getElementById('form-sessao').addEventListener('submit', e => {
            e.preventDefault();
            this.salvar();
        });
        document.getElementById('agenda-filtros').addEventListener('click', e => {
            const botao = e.target.closest('.filtro');
            if (!botao) return;
            this.filtro = botao.dataset.filtro;
            document.querySelectorAll('#agenda-filtros .filtro').forEach(f =>
                f.classList.toggle('ativa', f === botao));
            this.render();
        });
    }
};
