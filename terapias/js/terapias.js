/* Tipos de terapia: CRUD com desativação em vez de exclusão quando já usada. */

const Terapias = {
    render() {
        const lista = Store.getTerapias();
        const container = document.getElementById('terapias-lista');

        if (lista.length === 0) {
            container.innerHTML = '<div class="vazio">Nenhuma terapia cadastrada ainda — cadastre a primeira!</div>';
            return;
        }

        container.innerHTML = '<div class="card">' + lista.map(t => `
            <div class="item-lista">
                <div class="item-info">
                    <div class="item-titulo">${Util.esc(t.nome)}
                        ${t.ativo ? '' : '<span class="badge badge-inativa">inativa</span>'}
                    </div>
                    <div class="item-detalhe">${t.duracaoMin} min · ${Util.formatBRL(t.preco)}</div>
                </div>
                <div class="item-acoes">
                    <button class="btn btn-mini" data-action="terapia-editar" data-id="${t.id}">Editar</button>
                    <button class="btn btn-mini" data-action="terapia-toggle" data-id="${t.id}">
                        ${t.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                    <button class="btn btn-mini btn-perigo" data-action="terapia-excluir" data-id="${t.id}">Excluir</button>
                </div>
            </div>
        `).join('') + '</div>';
    },

    abrirForm(terapia) {
        document.getElementById('form-terapia-titulo').textContent = terapia ? 'Editar terapia' : 'Nova terapia';
        document.getElementById('terapia-id').value = terapia ? terapia.id : '';
        document.getElementById('terapia-nome').value = terapia ? terapia.nome : '';
        document.getElementById('terapia-duracao').value = terapia ? terapia.duracaoMin : '';
        document.getElementById('terapia-preco').value = terapia ? terapia.preco : '';
        document.getElementById('form-terapia').classList.remove('escondida');
        document.getElementById('terapia-nome').focus();
    },

    fecharForm() {
        document.getElementById('form-terapia').classList.add('escondida');
        document.getElementById('form-terapia').reset();
    },

    salvar() {
        const id = document.getElementById('terapia-id').value;
        const dados = {
            nome: document.getElementById('terapia-nome').value.trim(),
            duracaoMin: parseInt(document.getElementById('terapia-duracao').value, 10),
            preco: parseFloat(document.getElementById('terapia-preco').value)
        };
        if (!dados.nome || !dados.duracaoMin || isNaN(dados.preco)) return;

        const lista = Store.getTerapias();
        if (id) {
            const t = lista.find(x => x.id === id);
            if (t) Object.assign(t, dados);
        } else {
            lista.push({ id: Store.nextId('t'), ativo: true, ...dados });
        }
        Store.saveTerapias(lista);
        this.fecharForm();
        App.renderTudo();
    },

    toggle(id) {
        const lista = Store.getTerapias();
        const t = lista.find(x => x.id === id);
        if (!t) return;
        t.ativo = !t.ativo;
        Store.saveTerapias(lista);
        App.renderTudo();
    },

    excluir(id) {
        if (Store.sessoesDaTerapia(id).length > 0) {
            alert('Esta terapia já foi usada em sessões e não pode ser excluída.\nVocê pode desativá-la para que não apareça em novos agendamentos.');
            return;
        }
        const t = Store.terapiaPorId(id);
        if (!confirm(`Excluir a terapia "${t ? t.nome : ''}"?`)) return;
        Store.saveTerapias(Store.getTerapias().filter(x => x.id !== id));
        App.renderTudo();
    },

    onClick(action, id) {
        if (action === 'terapia-nova') this.abrirForm(null);
        else if (action === 'terapia-cancelar-form') this.fecharForm();
        else if (action === 'terapia-editar') this.abrirForm(Store.terapiaPorId(id));
        else if (action === 'terapia-toggle') this.toggle(id);
        else if (action === 'terapia-excluir') this.excluir(id);
    },

    bind() {
        document.getElementById('form-terapia').addEventListener('submit', e => {
            e.preventDefault();
            this.salvar();
        });
    }
};
