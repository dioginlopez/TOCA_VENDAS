(function () {
  const configuredApiUrl = String(window.TOCA_API_URL || '').trim();
  const urlBaseApi = (configuredApiUrl || 'http://localhost:3000').replace(/\/$/, '');

  window.TocaConfig = {
    urlBaseApi,
    montarUrlApi(caminho) {
      const caminhoNormalizado = String(caminho || '').startsWith('/') ? String(caminho) : `/${caminho}`;
      return `${urlBaseApi}${caminhoNormalizado}`;
    },
  };
})();
