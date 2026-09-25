(function () {
  // Módulo de sessão do navegador.
  // Gerencia a chave de sessão do browser e adiciona CSRF aos fetchs da API.
  const BROWSER_SESSION_STORAGE_KEY = 'tocaBrowserSessionKey';

  function respostaIndicaSessaoExpirada(resposta, contentType) {
    // Detecta respostas que indicam login expirado ou redirecionamento para /login.html.
    if (!resposta) return false;
    if (resposta.status === 401) return true;

    const finalType = String(contentType || '').toLowerCase();
    const urlFinal = String(resposta.url || '').toLowerCase();
    const foiParaLogin = urlFinal.includes('/login.html');
    if (resposta.redirected && foiParaLogin) return true;
    if (resposta.status === 200 && !finalType.includes('application/json') && foiParaLogin) return true;
    return false;
  }

  function respostaIndicaFalhaCsrf(resposta) {
    // Status 403 indica que o token CSRF foi rejeitado pelo servidor.
    return Boolean(resposta) && resposta.status === 403;
  }

  function criarErroSessaoExpirada() {
    // Cria uma exceção padrão para o fluxo de logout/recuperação.
    const erro = new Error('Sessão expirada. Faça login novamente.');
    erro.codigo = 'SESSION_EXPIRED';
    return erro;
  }

  function erroEhSessaoExpirada(erro) {
    return Boolean(erro && erro.codigo === 'SESSION_EXPIRED');
  }

  function montarUrlComCsrf(url, token) {
    // Anexa o token CSRF à query string da URL da API.
    const csrfToken = String(token || '').trim();
    if (!csrfToken) return url;

    const apiUrl = window.TocaConfig && typeof window.TocaConfig.montarUrlApi === 'function'
      ? window.TocaConfig.montarUrlApi(url)
      : url;
    const finalUrl = new URL(apiUrl, window.location.origin);
    finalUrl.searchParams.set('csrfToken', csrfToken);
    return finalUrl.toString();
  }

  function obterChaveSessaoNavegador() {
    // Lê a chave local de sessão do browser de sessionStorage.
    try {
      return String(window.sessionStorage.getItem(BROWSER_SESSION_STORAGE_KEY) || '').trim();
    } catch (error) {
      return '';
    }
  }

  function definirChaveSessaoNavegador(value) {
    const browserSessionKey = String(value || '').trim();
    try {
      if (!browserSessionKey) {
        window.sessionStorage.removeItem(BROWSER_SESSION_STORAGE_KEY);
        return '';
      }
      window.sessionStorage.setItem(BROWSER_SESSION_STORAGE_KEY, browserSessionKey);
      return browserSessionKey;
    } catch (error) {
      return browserSessionKey;
    }
  }

  function limparChaveSessaoNavegador() {
    try {
      window.sessionStorage.removeItem(BROWSER_SESSION_STORAGE_KEY);
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function criarChaveSessaoNavegador() {
    // Gera identificador de sessão do browser usando randomUUID quando disponível.
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }

  function garantirChaveSessaoNavegador() {
    const existente = obterChaveSessaoNavegador();
    if (existente) {
      return existente;
    }
    return definirChaveSessaoNavegador(criarChaveSessaoNavegador());
  }

  function instalarFetchComCsrf(obterToken) {
    // Substitui fetch global para apontar chamadas relativas ao backend separado.
    if (window.__tocaFetchInstalled) {
      return;
    }

    const originalFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      const options = init ? { ...init } : {};
      const method = String(options.method || (input && typeof input === 'object' && input.method) || 'GET').toUpperCase();
      const originalUrl = typeof input === 'string' ? input : String(input && input.url ? input.url : '');
      const isRelativeApiCall = originalUrl.startsWith('/');
      const url = isRelativeApiCall && window.TocaConfig && typeof window.TocaConfig.montarUrlApi === 'function'
        ? window.TocaConfig.montarUrlApi(originalUrl)
        : originalUrl;
      const sameOrigin = !url || url.startsWith(window.location.origin)
        || (window.TocaConfig && url.startsWith(window.TocaConfig.urlBaseApi));
      const csrfToken = typeof obterToken === 'function' ? String(obterToken() || '').trim() : '';
      const chaveSessaoNavegador = obterChaveSessaoNavegador();
      const headers = new Headers(options.headers || (input && typeof input === 'object' ? input.headers : undefined));

      if (sameOrigin && chaveSessaoNavegador) {
        headers.set('X-Browser-Session', chaveSessaoNavegador);
      }

      if (sameOrigin && !['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) {
        headers.set('X-CSRF-Token', csrfToken);
      }

      options.headers = headers;
      options.credentials = 'include';
      return originalFetch(url, options);
    };

    window.__tocaFetchInstalled = true;
  }

  window.TocaSession = {
    respostaIndicaSessaoExpirada,
    respostaIndicaFalhaCsrf,
    criarErroSessaoExpirada,
    erroEhSessaoExpirada,
    montarUrlComCsrf,
    obterChaveSessaoNavegador,
    definirChaveSessaoNavegador,
    limparChaveSessaoNavegador,
    garantirChaveSessaoNavegador,
    instalarFetchComCsrf,
  };
})();