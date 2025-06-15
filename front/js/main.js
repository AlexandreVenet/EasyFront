import App from "./app.js";

let procedure = async () =>
{
	const coul = 'GoldenRod';
	
	log('DEMARRAGE', coul);
	log('Propriétés de window.location', coul);
	logDetail('\thref', window.location.href, 'URL', coul);
	logDetail('\thost', window.location.host, "Nom de l\'hôte et port", coul);
	logDetail('\thostname', window.location.hostname, 'Idem précédent', coul);
	logDetail('\tport', window.location.port, 'Port', coul);
	logDetail('\tprotocol', window.location.protocol, 'Protocole HTTP (sans SSL) ou HTTPS (avec SSL)', coul);
	logDetail('\tpathname', window.location.pathname, 'Chemin (après le nom de domaine) sans chaîne de requête', coul);
	logDetail('\thash', window.location.hash, "Partie concernant l'ancre (#...)", coul);
	logDetail('\tsearch', window.location.search, "Chaîne de requête (?...)", coul);
	logDetail('Racine du site', window.location.protocol + '//' + window.location.host + '/', "protocol//host/", coul);
	
	/*
		Exemple : http://localhost:3000/toto?a=1
		
		href           http://localhost:3000/toto?a=1
		host           localhost:3000 
		hostname       localhost 
		port           3000 
		protocol       http: 
		pathname       /toto 
		hashpathname   <empty string>
		search         ?a=1
		racineDuSite   http://localhost:3000/
	*/	
	
	log('Propriétés de document', coul);
	console.log('\t%cdocument.location', 'color:'+coul, document.location);
	console.log('\t%cdocument', 'color:'+coul, document);
	
	const app = new App();
	window.app = app; // Rendre cet objet global
	
	app.ecouterHistorique();
}

window.logDetail = (titre, valeur, commentaire, couleur) =>
{
	console.log(`%c${titre} %c${valeur} %c${commentaire}`, `color:${couleur}`, 'color:default', 'color:Gray');
}

window.log = (valeur, couleur = '') =>
{
	console.log(`%c${valeur}`, `color:${couleur}`);
}

procedure();
