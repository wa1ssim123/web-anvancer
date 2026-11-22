# HORENOVA — Sécurité et montée en charge

Mise à jour : 22 novembre 2026. Ceci est un plan technique vérifiable, **pas une certification anti-piratage ni une garantie de 1 000 000 de connexions simultanées**.

## État de l'hébergement réellement constaté
- Frontend : Render Static Site distribué par CDN, domaine `horenova.com`.
- API : Render Web Service **Free**, **1 instance** ; les services gratuits peuvent s'endormir après 15 minutes sans trafic et ne proposent pas de montée en charge horizontale.
- Base de données : Neon PostgreSQL, pool applicatif actuellement borné à **6 connexions** par instance.
- Authentification et rôles : jeton membre vérifié auprès de Wix. Les permissions et la propriété des candidatures sont revérifiées dans l'API.
- Les tests automatiques actuels utilisent des comptes et données simulés. **Aucun test public à 1 million d'utilisateurs n'a été réalisé.**

## Protections déjà codées
1. Vérification de l'authentification et des rôles pour chaque route privée ; SQL paramétré et isolement candidat / recruteur / admin.
2. Contrôle d'origine CORS avec liste fermée, et refus des méthodes HTTP non autorisées.
3. Restrictions de taille des corps, y compris refus anticipé lorsque `Content-Length` dépasse le maximum ; contrôles et délais sur les requêtes HTTP.
4. En-têtes sur les réponses **de l'API** : anti-sniffing, HSTS, anti-clickjacking, politique de référent, permissions restreintes et CSP dédiée aux ressources API JSON/images.
5. Limites de fréquence locales par rôle et par jeton haché ; suppression automatique des compteurs expirés si le plafond mémoire est approché **sans effacer les limitations encore actives**.
6. Limite de requêtes simultanées avec réponse 503 et `Retry-After` au lieu d'une file d'attente sans borne.
7. Caisse Tech : tickets transactionnels, déduplication de ventes et cohérence des stocks ; protection de l'historique des discussions privées.

### Limites des protections actuelles
- Les limites de fréquence de ce serveur sont **en mémoire et propres à une seule instance**. Elles ne constituent pas un système anti-DDoS distribué.
- La protection par jeton freine les rafales issues du **même jeton**, mais ne protège pas contre des milliers de jetons différents ou des attaquants répartis.
- Aucun système ne peut garantir « impossible à pirater ». Les sauvegardes, mises à jour, audits externes et procédures d'incident restent indispensables.
- Les en-têtes ajoutés s'appliquent aux réponses de l'API ; les **en-têtes du site statique** se configurent séparément dans le tableau de bord Render.

## Étapes indispensables avant une exploitation à grande échelle

### 1. Infrastructure résiliente
- Passer l'API de Render Free à un plan **payant** capable de rester en ligne sans mise en veille.
- Disposer d'au moins deux instances API derrière un répartiteur de charge, en régions appropriées quand la croissance le justifie. Tester la montée en charge automatique et le redémarrage d'une instance.
- Utiliser un pool de connexions PostgreSQL adapté à Neon (pooler) et surveiller les limites de connexions, la latence, les verrous et les requêtes les plus lentes.
- Ajouter un **limiteur partagé** Redis/Key Value et un CDN/WAF en amont, notamment pour les attaques distribuées et l'inondation de requêtes sans jeton.
- Héberger l'API sous un sous-domaine contrôlé (par exemple `api.horenova.com`) si un WAF doit la protéger. Préparer les changements CORS et tester Wix avant de modifier le DNS.
- Mettre en place sauvegardes chiffrées, restauration testée, métriques, alertes et plan de reprise.

### 2. Sécurité organisationnelle
- Exiger MFA pour chaque administrateur (configuration de l'identité Wix à valider).
- Inventorier et révoquer les comptes administrateurs et clés qui ne servent plus.
- Placer les secrets exclusivement dans Render / gestionnaire de secrets ; faire une rotation après tout incident suspecté.
- Configurer dans Render les en-têtes du **site statique** : HSTS, `X-Content-Type-Options`, `Referrer-Policy`, anti-clickjacking. Déployer une `Content-Security-Policy-Report-Only` au préalable pour ne pas casser les scripts Wix, le Shop, les vidéos ou le multilingue.
- Vérifier régulièrement les vulnérabilités des dépendances et faire auditer les droits d'accès des candidats/recruteurs/admins par un tiers.
- Limiter les privilèges de la base de données et prévoir audit d'accès aux dossiers, suppression et rétention des données personnelles.

### 3. Tests de capacité **sur un environnement de staging**
- **Ne jamais lancer un test de charge agressif sur la production sans préparation**, car les personnes utilisant HORENOVA pourraient perdre l'accès.
- Utiliser `qa/load-staging.js` avec k6, sur une copie isolée des services et de la base, sans données personnelles.
- Tester progressivement le trafic réel anticipé : 50, 200, 1 000 puis 5 000 utilisateurs virtuels seulement après dimensionnement et approbation des coûts ; mesurer requêtes/seconde, p95/p99, taux d'erreur, connexions DB et temps d'authentification Wix.
- Tester aussi la perte d'une instance, l'arrêt temporaire de Wix, la saturation de Neon, la rotation des clés et le retour à la normale.
- Fixer des critères chiffrés de succès (par exemple moins de 1 % d'erreurs et une latence p95 adaptée au parcours) **avant** de déclarer une charge supportée.
- Distinguer explicitement **1 000 000 de comptes enregistrés**, **1 000 000 de visiteurs par mois** et **1 000 000 d'utilisateurs connectés simultanément** : ce sont des capacités très différentes.

## Déploiement
- Publier uniquement un commit dont les suites GitHub Actions ont réussi.
- Vérifier l'API, les visiteurs, la connexion candidat/recruteur/admin, les candidatures, les discussions privées et le Shop avec de vrais comptes de test.
- Si un parcours régresse, rétablir immédiatement le dernier déploiement stable et examiner les journaux sans exposer les données personnelles.
- Mesurer la consommation et augmenter la capacité progressivement ; **ne pas activer à l'aveugle un plan payant sans le budget et les seuils décidés par le propriétaire du service**.

## Références
- [OWASP API Security Top 10](https://owasp.org/projects/api-security-project)
- [OWASP API4 – Unrestricted Resource Consumption](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/)
- [Render – Free tier](https://render.com/docs/free)
- [Render – Scaling services](https://render.com/docs/scaling)
- [Render – Static site security headers](https://render.com/docs/static-site-headers)
