(function () {
  // Módulo de ajuda para inicialização de páginas autenticadas.
  // Fornece produtos padrão, contador de vendas e escuta de eventos de navegação.
  function criarProdutosPadrao() {
    return [
      { id: 1, nome: 'Leite Integral', preco: 4.50, estoque: 50 },
      { id: 2, nome: 'Pão Francês', preco: 0.80, estoque: 100 },
      { id: 3, nome: 'Arroz 5kg', preco: 25.00, estoque: 30 },
      { id: 4, nome: 'Feijão 1kg', preco: 7.50, estoque: 40 },
      { id: 5, nome: 'Açúcar 1kg', preco: 4.00, estoque: 60 },
      { id: 6, nome: 'Sal 1kg', preco: 2.00, estoque: 80 },
    ];
  }

  function atualizarContadorComVendas(vendas, vendaCounter) {
    // Atualiza o contador de vendas garantindo que seja maior do maior id existente.
    const lista = Array.isArray(vendas) ? vendas : [];
    const atual = Number.isFinite(Number(vendaCounter)) ? Number(vendaCounter) : 1;
    if (!lista.length) return atual;

    const maxId = lista.reduce((max, venda) => (venda && venda.id > max ? venda.id : max), 0);
    return Math.max(atual, maxId + 1);
  }

  function atualizarIndicadorUltimaVenda() {
    const info = document.getElementById('lastSaleInfo');
    if (!info) return;

    const lastId = localStorage.getItem('lastSaleId');
    info.textContent = lastId ? `Última venda: #${lastId}` : '';
  }

  function instalarPreviewImagemProduto(atualizarPreviewImagemProduto) {
    // Configura o preview da imagem do produto sempre que o campo de URL mudar.
    const campoUrlImagemProduto = document.getElementById('produtoImagemUrl');
    if (!campoUrlImagemProduto || typeof atualizarPreviewImagemProduto !== 'function') {
      return;
    }

    campoUrlImagemProduto.addEventListener('input', () => {
      const url = campoUrlImagemProduto.value.trim();
      atualizarPreviewImagemProduto(url, url ? 'Imagem definida manualmente' : '');
    });
  }

  async function inicializarPaginaAutenticada(options) {
    // Inicializa páginas que exigem autenticação: sessão, perfil e estado.
    const opts = options || {};

    if (window.TocaSession && typeof window.TocaSession.garantirChaveSessaoNavegador === 'function') {
      window.TocaSession.garantirChaveSessaoNavegador();
    }

    window.addEventListener('offline', () => {
      if (typeof opts.onOffline === 'function') {
        opts.onOffline();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && typeof opts.onBeforeLeave === 'function') {
        opts.onBeforeLeave();
      }
    });

    window.addEventListener('pagehide', () => {
      if (typeof opts.onBeforeLeave === 'function') {
        opts.onBeforeLeave();
      }
    });

    const sessaoValida = await opts.loadProfile();
    if (sessaoValida === false) {
      if (typeof opts.onSessionInvalid === 'function') {
        opts.onSessionInvalid();
      }
      return false;
    }

    await opts.loadState();

    if (typeof opts.onAfterLoadState === 'function') {
      await opts.onAfterLoadState();
    }

    if (typeof opts.enableSync === 'function') {
      opts.enableSync();
    }

    if (typeof opts.startSyncInterval === 'function') {
      opts.startSyncInterval();
    }

    if (typeof opts.onAfterBoot === 'function') {
      await opts.onAfterBoot();
    }

    return true;
  }

  window.TocaPageBootstrap = {
    criarProdutosPadrao,
    atualizarContadorComVendas,
    atualizarIndicadorUltimaVenda,
    instalarPreviewImagemProduto,
    inicializarPaginaAutenticada,
  };
})();
