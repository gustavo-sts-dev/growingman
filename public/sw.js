/*
 * Service worker do painel Growingman.
 *
 * Escopo único hoje: receber Web Push de agendamento e abrir a agenda no clique.
 * NÃO faz cache/offline de propósito — o painel depende de dados ao vivo, e um
 * cache mal ajustado serviria agenda velha. Se offline virar requisito, entra
 * aqui, isolado.
 *
 * Servido de /sw.js (raiz do domínio), então controla todo o app.
 */

// Assume o controle assim que instala/ativa, sem esperar as abas fecharem — a
// primeira ativação já passa a receber push sem exigir reload.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { body: event.data && event.data.text() };
  }

  const title = data.title || 'Growingman';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    // Guarda a rota para o notificationclick abrir/focar.
    data: { url: data.url || '/dashboard' },
    // Vibra no celular; ignorado no desktop.
    vibrate: [80, 40, 80],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    (async () => {
      const abas = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Já existe uma aba na rota alvo? Foca ela.
      for (const aba of abas) {
        if (aba.url.includes(targetUrl) && 'focus' in aba) return aba.focus();
      }
      // Existe alguma aba do painel? Navega-a para o alvo e foca.
      for (const aba of abas) {
        if (aba.url.includes('/dashboard') && 'focus' in aba) {
          if ('navigate' in aba) await aba.navigate(targetUrl);
          return aba.focus();
        }
      }
      // Nenhuma aberta: abre uma nova.
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })(),
  );
});

// O navegador pode rotacionar a inscrição por conta própria (expira a chave).
// Reinscreve com a mesma applicationServerKey e reenvia ao backend, senão o push
// simplesmente para de chegar sem ninguém perceber. Best-effort: se o cookie de
// sessão já expirou, o reenvio falha e o usuário reativa ao abrir o app.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const applicationServerKey =
          event.oldSubscription &&
          event.oldSubscription.options &&
          event.oldSubscription.options.applicationServerKey;
        if (!applicationServerKey) return;

        const sub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        await fetch('/api-proxy/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(sub),
        });
      } catch (_e) {
        /* best-effort — reativa no próximo acesso ao painel */
      }
    })(),
  );
});
