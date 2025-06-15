import NimporteQuoi from "./querystring_lib.js";

class QueryString
{
	constructor()
	{
		this.coul = 'Green';
		
		logDetail('querystring.js', 'Démarré', 'Module', this.coul);
		
		const nimp = new NimporteQuoi();
		log(`Nimp.nom : ${nimp.nom}`, this.coul);
		
		this.queryString();
	}
	
	queryString = () =>
	{
		// Analysons l'URL de cette page pour en tirer quelque-chose.
		const url = new URL(window.location.href);
		
		log("queryString > Analyse de cette URL : ", this.coul);
		console.log(url);
		
		// log("queryString > Analyse de la chaîne de requête : ", this.coul);
		// const searchParamsEntries = Array.from(url.searchParams.entries());
		// console.table(searchParamsEntries);
		
		// De l'URL, récupérons deux paramètres attendus
		const params = url.searchParams;
		const toto = params.get('toto');
		const zaza = params.get('zaza');
		
		if(toto)
		{
			document.querySelector('#valeurToto').textContent = toto;
		}
		
		if(zaza)
		{
			document.querySelector('#valeurZaza').textContent = parseInt(zaza);
		}
	}
}

export default QueryString;

// Imaginons que la page HTML est appelée directement dans le navigateur.
// Alors, ce fichier est chargé AVANT le fichier du programme front-end (car <script> placé avant).
// Donc, n'en exécuter le code qu'une fois tout le reste chargé.
// window.addEventListener("load", (event) => 
// {
// 	const obj = new QueryString();
// });
// Or, en AJAX, ce code ne se déclenche pas. 
// Donc, voir app.js pour gérer les modules de pages que ce soit en appel direct ou en AJAX.

