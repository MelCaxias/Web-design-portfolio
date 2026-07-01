/* Navegação por abas, dashboard e inicialização do app. */

const App = {
    abaAtiva: 'inicio',

    renderInicio() {
        const container = document.getElementById('inicio-conteudo');
        const hoje = Util.hoje();
        const limite = Util.somarDias(hoje, 7);
        const mes = Util.mesAtual();
        const sessoes = Store.getSessoes();

        const deHoje = sessoes
            .filter(s => s.status === 'agendada' && s.data === hoje)
            .sort((a, b) => a.hora.localeCompare(b.hora));
        const proximas = sessoes
            .filter(s => s.status === 'agendada' && s.data > hoje && s.data <= limite)
            .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
        const receitaMes = sessoes
            .filter(s => s.status === 'realizada' && s.pago && s.data.startsWith(mes))
            .reduce((soma, s) => soma + (s.valorPago || 0), 0);
        const totalClientes = Store.getClientes().length;

        const linhaSessao = s => {
            const c = Store.clientePorId(s.clienteId);
            const t = Store.terapiaPorId(s.terapiaId);
            return `
            <div class="item-lista">
                <div class="item-info">
                    <div class="item-titulo">${Util.formatDataCurta(s.data)} ${s.hora} — ${Util.esc(c ? c.nome : '?')}</div>
                    <div class="item-detalhe">${Util.esc(t ? t.nome : '?')}</div>
                </div>
            </div>`;
        };

        const seed = Store.tudoVazio()
            ? `<div class="vazio">
                   <p>Bem-vinda! Comece cadastrando suas terapias e clientes,<br>ou experimente o app com dados de exemplo.</p>
                   <p style="margin-top:12px">
                       <button class="btn btn-primario" data-action="inicio-seed">Carregar dados de exemplo</button>
                   </p>
               </div>`
            : '';

        container.innerHTML = `
            <div class="view-topo">
                <h2>Início</h2>
                <button class="btn btn-primario" data-action="inicio-nova-sessao">+ Nova sessão</button>
            </div>
            ${seed}
            <div class="cards-grid cards-grid-4">
                <div class="card card-resumo">
                    <div class="rotulo">Sessões hoje</div>
                    <div class="valor">${deHoje.length}</div>
                </div>
                <div class="card card-resumo">
                    <div class="rotulo">Próximos 7 dias</div>
                    <div class="valor">${proximas.length}</div>
                </div>
                <div class="card card-resumo">
                    <div class="rotulo">Receita do mês</div>
                    <div class="valor">${Util.formatBRL(receitaMes)}</div>
                </div>
                <div class="card card-resumo">
                    <div class="rotulo">Clientes</div>
                    <div class="valor">${totalClientes}</div>
                </div>
            </div>

            <h3 class="dia-titulo">Sessões de hoje</h3>
            ${deHoje.length === 0
                ? '<div class="vazio">Nenhuma sessão para hoje.</div>'
                : '<div class="card">' + deHoje.map(linhaSessao).join('') + '</div>'}

            <h3 class="dia-titulo">Próximas sessões (7 dias)</h3>
            ${proximas.length === 0
                ? '<div class="vazio">Nenhuma sessão nos próximos dias.</div>'
                : '<div class="card">' + proximas.map(linhaSessao).join('') + '</div>'}
        `;
    },

    renderTudo() {
        this.renderInicio();
        Agenda.render();
        Clientes.render();
        Terapias.render();
        Financeiro.render();
    },

    mostrarAba(nome) {
        this.abaAtiva = nome;
        document.querySelectorAll('.view').forEach(v =>
            v.classList.toggle('escondida', v.id !== 'view-' + nome));
        document.querySelectorAll('.tab').forEach(t => {
            const ativa = t.dataset.tab === nome;
            t.classList.toggle('ativa', ativa);
            if (ativa) t.setAttribute('aria-current', 'page');
            else t.removeAttribute('aria-current');
        });
    },

    onClick(action, id) {
        if (action === 'inicio-nova-sessao') {
            this.mostrarAba('agenda');
            Agenda.abrirForm(null);
        } else if (action === 'inicio-seed') {
            Store.seedExemplo();
            this.renderTudo();
        }
    },

    bind() {
        document.querySelector('.tabs').addEventListener('click', e => {
            const tab = e.target.closest('.tab');
            if (tab) this.mostrarAba(tab.dataset.tab);
        });

        // Delegação única: qualquer botão com data-action é despachado
        // ao módulo dono pelo prefixo da ação.
        document.querySelector('.conteudo').addEventListener('click', e => {
            const botao = e.target.closest('[data-action]');
            if (!botao) return;
            const action = botao.dataset.action;
            const id = botao.dataset.id;

            if (action.startsWith('inicio-')) this.onClick(action, id);
            else if (action.startsWith('agenda-') || action.startsWith('sessao-')) {
                // "Marcar pago" existe na Agenda e no Financeiro; a ação é a mesma.
                Agenda.onClick(action, id);
            }
            else if (action.startsWith('cliente-')) Clientes.onClick(action, id);
            else if (action.startsWith('terapia-')) Terapias.onClick(action, id);
        });
    },

    iniciar() {
        this.bind();
        Agenda.bind();
        Clientes.bind();
        Terapias.bind();
        Financeiro.bind();
        this.renderTudo();
        this.mostrarAba('inicio');
    }
};

document.addEventListener('DOMContentLoaded', () => App.iniciar());
