(function () {
  // Módulo de sincronização de estado.
  // Salva o estado local no backend, agenda salvamentos e envia no evento de saída.
  function criar(config) {
    let pendingTimeout = null;

    function limparAgendamentoPendente() {
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
        pendingTimeout = null;
      }
    }

    async function salvar(options) {
      if (!config.isEnabled()) return false;

      const opts = options || {};
      const forcar = Boolean(opts.forcar);
      const usarKeepAlive = Boolean(opts.usarKeepAlive);
      const estado = config.getState();
      const serializado = JSON.stringify(estado);

      if (!forcar && serializado === config.getLastSerialized()) {
        return true;
      }

      try {
        const resposta = await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: serializado,
          keepalive: usarKeepAlive,
        });

        if (!resposta.ok) {
          const contentType = String(resposta.headers.get('content-type') || '').toLowerCase();
          if (config.isSessionExpiredResponse(resposta, contentType)) {
            config.onAuthExpired();
            return false;
          }
          if (config.isCsrfFailureResponse(resposta)) {
            config.onCsrfFailure();
            return false;
          }
          return false;
        }

        config.setLastSerialized(serializado);
        config.onSaveSuccess();
        return true;
      } catch (error) {
        return false;
      }
    }

    function agendar() {
      if (!config.isEnabled()) return;
      limparAgendamentoPendente();
      pendingTimeout = setTimeout(() => {
        salvar();
      }, 350);
    }

    function salvarAoSair() {
      // Tenta enviar o estado com sendBeacon ao fechar a página.
      if (!config.isEnabled()) return;
      limparAgendamentoPendente();

      const serializado = JSON.stringify(config.getState());
      if (serializado === config.getLastSerialized()) return;

      if (navigator.sendBeacon) {
        try {
          const payload = new Blob([serializado], { type: 'application/json' });
          const sent = navigator.sendBeacon(config.getFlushUrl(), payload);
          if (sent) {
            config.setLastSerialized(serializado);
            return;
          }
        } catch (error) {
          // Fallback abaixo.
        }
      }

      salvar({ forcar: true, usarKeepAlive: true });
    }

    return {
      salvar,
      agendar,
      salvarAoSair,
      limparAgendamentoPendente,
    };
  }

  window.TocaStateSync = { criar };
})();
