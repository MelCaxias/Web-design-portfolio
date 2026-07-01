/* Clientes: CRUD, busca por nome e detalhe expansível com anamnese + histórico de sessões. */

const Clientes = {
    detalheAberto: null, // id do cliente com detalhe expandido

    render() {
        const busca = document.getElementById('cliente-busca').value.trim().toLowerCase();
        const lista = Store.getClientes()
            .filter(c => !busca || c.nome.toLowerCase().includes(busca))
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        const container = document.getElementById('clientes-lista');

        if (lista.length === 0) {
            container.innerHTML = busca
                ? '<div class="vazio">Nenhum cliente encontrado para essa busca.</div>'
                : '<div class="vazio">Nenhum cliente cadastrado ainda — cadastre o primeiro!</div>';
            return;
        }

        container.innerHTML = lista.map(c => {
            const sessoes = Store.sessoesDoCliente(c.id);
            const aberto = this.detalheAberto === c.id;
            return `
            <div class="card">
                <div class="item-lista">
                    <div class="item-info">
                        <div class="item-titulo">${Util.esc(c.nome)}</div>
                        <div class="item-detalhe">
                            ${Util.esc(c.telefone || 'sem telefone')} · ${sessoes.length} sessão(ões)
                        </div>
                    </div>
                    <div class="item-acoes">
                        <button class="btn btn-mini" data-action="cliente-detalhe" data-id="${c.id}">
                            ${aberto ? 'Fechar' : 'Detalhes'}
                        </button>
                        <button class="btn btn-mini" data-action="cliente-editar" data-id="${c.id}">Editar</button>
                        <button class="btn btn-mini btn-perigo" data-action="cliente-excluir" data-id="${c.id}">Excluir</button>
                    </div>
                </div>
                ${aberto ? this.renderDetalhe(c, sessoes) : ''}
            </div>`;
        }).join('');
    },

    renderDetalhe(cliente, sessoes) {
        const historico = sessoes
            .slice()
            .sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora))
            .map(s => {
                const terapia = Store.terapiaPorId(s.terapiaId);
                return `
                <div class="item-lista">
                    <div class="item-info">
                        <div class="item-titulo">${Util.formatDataCurta(s.data)} ${s.hora} — ${Util.esc(terapia ? terapia.nome : '?')}</div>
                        <div class="item-detalhe">
                            <span class="badge badge-${s.status}">${s.status}</span>
                            ${s.status === 'realizada' ? (s.pago
                                ? `<span class="badge badge-pago">pago ${Util.formatBRL(s.valorPago)}</span>`
                                : '<span class="badge badge-pendente">a receber</span>') : ''}
                        </div>
                    </div>
                </div>`;
            }).join('');

        return `
        <div class="cliente-detalhe">
            ${cliente.email ? `<h4>E-mail</h4><p>${Util.esc(cliente.email)}</p>` : ''}
            <h4>Anamnese / Observações</h4>
            <p>${cliente.anamnese ? Util.esc(cliente.anamnese) : '<em>Nada registrado.</em>'}</p>
            <h4>Histórico de sessões</h4>
            ${historico || '<p><em>Nenhuma sessão registrada.</em></p>'}
        </div>`;
    },

    abrirForm(cliente) {
        document.getElementById('form-cliente-titulo').textContent = cliente ? 'Editar cliente' : 'Novo cliente';
        document.getElementById('cliente-id').value = cliente ? cliente.id : '';
        document.getElementById('cliente-nome').value = cliente ? cliente.nome : '';
        document.getElementById('cliente-telefone').value = cliente ? cliente.telefone : '';
        document.getElementById('cliente-email').value = cliente ? cliente.email : '';
        document.getElementById('cliente-anamnese').value = cliente ? cliente.anamnese : '';
        document.getElementById('form-cliente').classList.remove('escondida');
        document.getElementById('cliente-nome').focus();
    },

    fecharForm() {
        document.getElementById('form-cliente').classList.add('escondida');
        document.getElementById('form-cliente').reset();
    },

    salvar() {
        const id = document.getElementById('cliente-id').value;
        const dados = {
            nome: document.getElementById('cliente-nome').value.trim(),
            telefone: document.getElementById('cliente-telefone').value.trim(),
            email: document.getElementById('cliente-email').value.trim(),
            anamnese: document.getElementById('cliente-anamnese').value.trim()
        };
        if (!dados.nome) return;

        const lista = Store.getClientes();
        if (id) {
            const c = lista.find(x => x.id === id);
            if (c) Object.assign(c, dados);
        } else {
            lista.push({ id: Store.nextId('c'), criadoEm: Util.hoje(), ...dados });
        }
        Store.saveClientes(lista);
        this.fecharForm();
        App.renderTudo();
    },

    excluir(id) {
        if (Store.sessoesDoCliente(id).length > 0) {
            alert('Este cliente possui sessões registradas e não pode ser excluído,\npara preservar o histórico e o financeiro.');
            return;
        }
        const c = Store.clientePorId(id);
        if (!confirm(`Excluir o cliente "${c ? c.nome : ''}"?`)) return;
        Store.saveClientes(Store.getClientes().filter(x => x.id !== id));
        App.renderTudo();
    },

    onClick(action, id) {
        if (action === 'cliente-novo') this.abrirForm(null);
        else if (action === 'cliente-cancelar-form') this.fecharForm();
        else if (action === 'cliente-editar') this.abrirForm(Store.clientePorId(id));
        else if (action === 'cliente-excluir') this.excluir(id);
        else if (action === 'cliente-detalhe') {
            this.detalheAberto = this.detalheAberto === id ? null : id;
            this.render();
        }
    },

    bind() {
        document.getElementById('form-cliente').addEventListener('submit', e => {
            e.preventDefault();
            this.salvar();
        });
        document.getElementById('cliente-busca').addEventListener('input', () => this.render());
    }
};
