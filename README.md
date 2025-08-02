# ReadMe

But 
- Serveur web en Node.js
- Fournir des pages HTML composées dynamiquement (modèle, pages de contenu, imbrication d'éléments HTML distribués en fichiers) de façon à favoriser le SEO et faciliter l'édition
- Expérience de navigation orientée *front-end* : page spécifique affichée directement (le serveur renvoie du HTML et des ressources) ***puis*** gestion en AJAX avec transitions entre écrans et contrôle de l'historique client
- Gestion d'un `sitemap.xml` général

## Généralités

Le préfixe `_` est utilisé pour les ressources du serveur ou pour des outils. Par exemple, la page d'erreur est préfixée de cette façon pour signifier que ce n'est pas une page à laquelle l'utilisateur peut accéder (la route correspondante est exclue).

## Fichiers en téléchargement

Des fichiers sont soit à télécharger soit à consulter en ligne. L'attribut `download` des `<a>` ne doit pas être utilisé. En effet, avec cet attribut, le navigateur force le téléchargement même si le serveur lui envoie la page d'erreur ! 😄

## Modèle et pages

Utilisation d'un modèle HTML posant une structure unique pour toutes les pages HTML du site. Les éléments suivants sont modifiables : `base`, `title`, `description`, `page`. Le `head` peut accueillir des balises supplémentaires grâce à une balise personnalisée `customTags` (si rien à ajouter, l'omettre).

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
		{{page}}
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

Pourquoi `class="customTag"` dans l'exemple précédent ? Ce n'est pas utile pour ce qui nous occupe ici. Cette classe a une importance si le *front-end* est en AJAX (voir partie idoine).

## Sous-éléments

Une page HTML est construite dynamiquement. Elle peut appeler des fichiers contenant des éléments HTML à insérer.

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
		{{page}}
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

La seconde consiste à utiliser des liens relatifs commençant tous par `/`, ciblant ainsi la racine.

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

`main.js` est aussi utilisé sur la page d'erreur. Ainsi, les transitions entre écrans sont prises en charge aussi depuis cette page.

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

## Répertoire outils

La route `/_easyfront` est destinée à accueillir des pages d'outils. Les ressources *front* utilisées par ces pages se trouvent dans `/front/_easyfront`. Les scripts *back* se trouvent au chemin `/back/_easyfront`.

Ces pages n'utilisent pas le modèle du site et sont autonomes.

Lorsque le serveur n'est pas *localhost*, `index.js` exclut l'accès aux ressources *back* ou *front* qui commençent par `/_easyfront`.

Par souci de sécurité, on peut supprimer les dossiers commençant par `/_easyfront` et les lignes de code correspondantes dans `index.js`.

## Sitemap.xml

En *localhost*, la route `/_easyfront/sitemap-editor` achemine à un éditeur de `sitemap.xml`. Ce fichier XML est généré à la racine du projet. 

Si le fichier n'existe pas, alors il est généré automatiquement. Lors de cette génération automatique, les données sont construites à partir de la valeur `DISTANT_HOST` dans `.env` et des chemins de fichiers ou dossiers. Les fichiers ou dossiers préfixés `_` sont exclus.

**Menu principal**

|Menu|Description|
|-|-|
|**Ajouter**|Ajouter un bloc de données (`<url>`).|
|**Plier**|Fermer tous les blocs pour le confort de lecture.|
|**Déplier**|Ouvrir tous les blocs pour consulter les contenus.|
|**Enregistrer**|Sauvegarder les données dans le `sitemap.xml`.|
|**Fichier**|Consulter dans un nouvel onglet le `sitemap.xml` actuellement sauvegardé.|
|**Aide**|Lance [la page du protocole sitemap](https://www.sitemaps.org/protocol.html) dans un nouvel onglet.|

**Bloc : données**

|Entrée|Description|
|-|-|
|**Titre**|Nommer l'entrée pour le confort de lecture (non pris en charge pour l'indexation).|
|**Loc**|L'adresse web (`<loc>`). Le serveur encodera les caractères spéciaux, les espaces...|
|**LastMod**|Date de la dernière modification (`<lastmod>`).|
|**ChangeFreq**|La fréquence de consultation (`<changefreq>`).|
|**Priority**|Un nombre pouvant être à trois décimales et compris entre 0 et 1 représentant la priorité de l'URL par rapport aux autres du site (`<priority>`).|

**Bloc : actions**

|Action|Description|
|-|-|
|**Monter**|Déplacer le bloc vers le haut.|
|**Descendre**|Déplacer le bloc vers le bas.|
|**Plier/Déplier**|Ouvrir ou fermer le bloc.|
|**Supprimer**|Supprimer le bloc de données.|

## Robots.txt

Le *back-end* peut accueillir un fichier `robots.txt` à la racine.
