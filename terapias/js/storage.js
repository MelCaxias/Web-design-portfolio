/* Camada de dados: única porta de acesso ao localStorage + helpers compartilhados. */

const Store = {
    CHAVES: {
        clientes: 'terapias.clientes',
        tiposTerapia: 'terapias.tiposTerapia',
        sessoes: 'terapias.sessoes',
        seq: 'terapias.seq'
    },

    load(chave, padrao) {
        try {
            const bruto = localStorage.getItem(chave);
            if (bruto === null) return padrao;
            const valor = JSON.parse(bruto);
            return valor === null ? padrao : valor;
        } catch (e) {
            return padrao;
        }
    },

    save(chave, valor) {
        localStorage.setItem(chave, JSON.stringify(valor));
    },

    nextId(prefixo) {
        const n = this.load(this.CHAVES.seq, 0) + 1;
        this.save(this.CHAVES.seq, n);
        return prefixo + n;
    },

    // --- coleções ---
    getClientes() { return this.load(this.CHAVES.clientes, []); },
    saveClientes(lista) { this.save(this.CHAVES.clientes, lista); },

    getTerapias() { return this.load(this.CHAVES.tiposTerapia, []); },
    saveTerapias(lista) { this.save(this.CHAVES.tiposTerapia, lista); },

    getSessoes() { return this.load(this.CHAVES.sessoes, []); },
    saveSessoes(lista) { this.save(this.CHAVES.sessoes, lista); },

    // --- consultas comuns ---
    clientePorId(id) { return this.getClientes().find(c => c.id === id) || null; },
    terapiaPorId(id) { return this.getTerapias().find(t => t.id === id) || null; },
    sessoesDoCliente(clienteId) { return this.getSessoes().filter(s => s.clienteId === clienteId); },
    sessoesDaTerapia(terapiaId) { return this.getSessoes().filter(s => s.terapiaId === terapiaId); },

    tudoVazio() {
        return this.getClientes().length === 0 &&
            this.getTerapias().length === 0 &&
            this.getSessoes().length === 0;
    },

    seedExemplo() {
        const hoje = Util.hoje();
        const amanha = Util.somarDias(hoje, 1);
        const semanaQueVem = Util.somarDias(hoje, 5);

        const terapias = [
            { id: this.nextId('t'), nome: 'Reiki', duracaoMin: 60, preco: 120, ativo: true },
            { id: this.nextId('t'), nome: 'Massagem relaxante', duracaoMin: 50, preco: 150, ativo: true },
            { id: this.nextId('t'), nome: 'Auriculoterapia', duracaoMin: 40, preco: 90, ativo: true }
        ];
        const clientes = [
            {
                id: this.nextId('c'), nome: 'Ana Souza', telefone: '(11) 99999-0001',
                email: 'ana@exemplo.com', anamnese: 'Dores lombares; prefere pressão leve.', criadoEm: hoje
            },
            {
                id: this.nextId('c'), nome: 'Bruno Lima', telefone: '(11) 99999-0002',
                email: '', anamnese: 'Ansiedade; busca relaxamento.', criadoEm: hoje
            }
        ];
        const sessoes = [
            {
                id: this.nextId('s'), clienteId: clientes[0].id, terapiaId: terapias[0].id,
                data: hoje, hora: '14:00', status: 'agendada', pago: false, valorPago: null, observacoes: ''
            },
            {
                id: this.nextId('s'), clienteId: clientes[1].id, terapiaId: terapias[1].id,
                data: amanha, hora: '10:00', status: 'agendada', pago: false, valorPago: null, observacoes: 'Primeira sessão.'
            },
            {
                id: this.nextId('s'), clienteId: clientes[0].id, terapiaId: terapias[2].id,
                data: semanaQueVem, hora: '16:30', status: 'agendada', pago: false, valorPago: null, observacoes: ''
            }
        ];

        this.saveTerapias(terapias);
        this.saveClientes(clientes);
        this.saveSessoes(sessoes);
    }
};

/* Helpers de formatação e datas compartilhados por todos os módulos. */
const Util = {
    esc(texto) {
        return String(texto ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    formatBRL(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    },

    // Data local em YYYY-MM-DD (sem UTC, para não pular de dia à noite)
    hoje() {
        const d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    },

    mesAtual() {
        return this.hoje().slice(0, 7); // YYYY-MM
    },

    somarDias(dataISO, dias) {
        const [a, m, d] = dataISO.split('-').map(Number);
        const data = new Date(a, m - 1, d + dias);
        return data.getFullYear() + '-' +
            String(data.getMonth() + 1).padStart(2, '0') + '-' +
            String(data.getDate()).padStart(2, '0');
    },

    formatData(dataISO) {
        const [a, m, d] = dataISO.split('-').map(Number);
        return new Date(a, m - 1, d).toLocaleDateString('pt-BR', {
            weekday: 'long', day: 'numeric', month: 'long'
        });
    },

    formatDataCurta(dataISO) {
        const [a, m, d] = dataISO.split('-').map(Number);
        return new Date(a, m - 1, d).toLocaleDateString('pt-BR');
    },

    formatMes(mesISO) {
        const [a, m] = mesISO.split('-').map(Number);
        return new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
};
