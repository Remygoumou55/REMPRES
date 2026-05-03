/**
 * Après une action serveur (supprimer, restaurer…), `router.push` seul peut laisser
 * les Server Components avec des données périmées. On enchaîne un `refresh` au tick suivant
 * pour recharger les listes tout en conservant l’URL avec success/error en query.
 */

export type RouterPushRefresh = {
  push: (href: string) => void;
  refresh: () => void;
};

export function pushThenRefresh(router: RouterPushRefresh, href: string): void {
  router.push(href);
  setTimeout(() => {
    router.refresh();
  }, 0);
}
