# ReadMe

But 
- Serveur web en Node.js
- Fournir des pages HTML composées dynamiquement (modèle, pages de contenu, imbrication d'éléments HTML distribués en fichiers) de façon à favoriser le SEO et faciliter l'édition
- Expérience de navigation orientée *front-end* : page spécifique affichée directement (le serveur renvoie du HTML et des ressources) ***puis*** gestion en AJAX avec transitions entre écrans

## Fichiers en téléchargement

Des fichiers sont soit à télécharger soit à consulter en ligne. L'attribut `download` des `<a>` ne doit pas être utilisé. En effet, avec cet attribut, le navigateur force le téléchargement même si le serveur lui envoie la page d'erreur ! 😄

## Modèle

Utilisation d'un modèle HTML posant une structure unique pour toutes les pages HTML du site. Les léments suivants sont modifiables : `base`, `title`, `description`, `body`. Le `head` peut accueillir des balises supplémentaires grâce à une balise personnalisée `customTags` (si rien à ajouter, l'omettre).

Exemple de modèle :

```HTML
<!DOCTYPE html>
<html lang="fr">
	<head>
		<meta charset="utf-8">
		<base href="{{base}}">
		<title>{{title}}</title>
		<meta name="description" content="{{description}}">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="icon" type="image/x-icon" href="/favicon.ico">
		<link rel="stylesheet" href="/css/styles.css">
		{{customTags}}
	</head>
	<body>
		{{body}}
	</body>
</html>
```

Exemple de page avec un style spécifique :

```HTML
<head>
	<title>Test modèle</title>
	<description>Tester le modèle HTML</description>
	<customTags>
		<link rel="stylesheet" href="/css/stylesSpeciaux.css" class="customTag">
	</customTags>
</head>
<body>
	<h1>Test modèle</h1>
	<p>Non mais c'est fabuleux, non ?</p>
</body>
```

Attention, la page d'erreur, quant à elle, n'est pas associée au modèle. Mais son *tag* `<base>` peut être modifié comme celui du modèle.

Pourquoi `class="customTag"` ? Ce n'est pas utile pour ce qui nous occupe ici. Cette classe a une importance si le *front-end* est en AJAX (voir partie idoine).

## Sous-éléments

La page HTML est construite dynamiquement. Elle peut appeler des fichiers contenant des éléments HTML à insérer. Avec le modèle principal, on obtient donc de ce schéma d'imbrication :

```
Modèle > Page > Contenus imbriquables
```

Exemple d'imbrication en profondeur : le modèle principal, la page, une nav, des liens.

```HTML
<!DOCTYPE html>
<html lang="fr">
	<head>
		<meta charset="utf-8">
		<base href="{{base}}">
		<title>{{title}}</title>
		<meta name="description" content="{{description}}">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="icon" type="image/x-icon" href="/favicon.ico">
		<link rel="stylesheet" href="/css/styles.css">
		{{customTags}}
	</head>
	<body>
		{{body}}
	</body>
</html>
```

```HTML
<head>
	<title>Youpi</title>
	<description>Exprimer la joie</description>
</head>
<page>
	<source fichier="nav.html"/>
	<h1>Youpi !</h1>
	<p>Quel bonheur...</p>
	<source fichier="nav.html"/>
</page>
```

```HTML
<nav>
	<source fichier="test_imbrication.html"/>
</nav>
```

```HTML
<a href="/" title="Accueil">Accueil</a> | 
<a href="/toto/zero" title="Une info sur Toto">toto/zero</a> | 
<a href="/test-modele" title="Test et modèle">test-modele</a> | 
<a href="/gne" title="Page inconnue">gne</a>
```

L'auto-imbrication est détectée et exclue (sinon, boucle infinie).

Si le *front-end* est en AJAX, alors il faut placer le contenu dans un conteneur (ici `<nav>`) pour que le *parsing* côté *front-end* prenne les caractères spéciaux (ici `|`). 

## Base

Pour résoudre les chemins vers les ressources, il existe deux solutions.

La première consiste à ce que toutes pages HTML présentent le *tag* `<base>` dans le `<head>` :

```HTML
<base href="http://localhost:3000"> 
```

La seconde consiste à utiliser des liens relatifs commençant tous par `/`. 

```HTML
<link rel="stylesheet" href="/css/styles.css">
```

## AJAX

`main.js` initialise le programme *front-end*.

`app.js` est la classe principale. On y gère les éléments suivants pour l'UX :
- l'historique, 
- les transitions entre page avec chargement à la demande, 
- les liens de page,
- la mise à jour du DOM, du `title`, de la `description`, du contenu de page.

Parlons de `class=customTag` dans un `<link>` situé en `<head>`. Cette classe `customTag` n'existe pas dans les styles CSS. C'est simplement un sélecteur pour le programme *front-end*, sélecteur qui permet d'identifier les `<link>` spécifiques d'une page HTML. Ces balises sont ajoutées et supprimées automatiquement au chargement de page.

## Scripts JS des pages

Les pages du site peuvent utiliser des scripts. Ils doivent être des modules et présenter cette structure :

```JS
class NomModule {...}
export default NomModule;
```

Ces scripts peuvent importer d'autres scripts.

```JS
import NimporteQuoi from "./nimportequoi.js";
class NomModule {...}
export default NomModule;
```

Maintenant, les cas suivants se présentent.
1. La page du site est appelée suite à la saisie de l'URL par l'utilisateur dans la barre d'adresse.
2. La page du site est appelée suite au clic sur un lien du site.
3. La page du site est appelée suite à l'utilisation de l'historique du navigateur.

Dans tous les cas, `app.js` cherche les scripts qui possèdent un `export default` et les exécute. 

Concernant l'ordre de chargement des scripts, les balises `<script>` dans les pages précèdent toujours celles du modèle HTML, ce qui définit l'ordre des requêtes de chargement. S'il faut utiliser d'autres scripts dans le modèle, alors veiller à placer l'appel d'`app.js` en dernière position.
