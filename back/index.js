const http = require('http');
const fs = require('fs');
const fsPromise = require('fs').promises;
const path = require('path');
const url = require('url');
const process = require('process');
const zlib = require('zlib');


// Ajouter mes variables d'environnement à celles éventuellement déjà déclarées.
// En effet, l'hébergeur peut utiliser process.env pour stocker des infos du serveur.
const env = require('./env');
env.chargerENVLocal();

// Déclarer le serveur et le port selon les éventuelles variables d'environnement du serveur.
// Si rien, alors le serveur est local.
const SERVEUR = process.env.HOST || process.env.LOCAL_HOST;
const PORT = process.env.PORT || process.env.LOCAL_PORT;

// On est en environnement de dev ou pas ?
let estEnDev = SERVEUR === process.env.LOCAL_HOST;

// Le referer du serveur
let refereur; 
if(estEnDev)
{
	refereur = SERVEUR;
}
else
{
	refereur = process.env.DISTANT_HOST;
}


const fichiersHTML = path.join(__dirname, 'pagesHtml');
const fichiersFront = path.join(__dirname, '../front');

const fichiersModeles = path.join(__dirname, 'modelesHtml');
const cheminModele = path.join(fichiersModeles, 'modele.html');

const nomPageErreur = '_erreur.html';

const types_MIME = 
{
	'.txt': 'text/plain',
	'.html': 'text/html',
	'.htm': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.ico': 'image/x-icon',
	
	'.svg': 'image/svg+xml',
	
	'.ttf': 'font/ttf',
	'.otf': 'font/otf',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.eot': 'application/vnd.ms-fontobject',
	
	'.pdf': 'application/pdf',
	
	'.xml': 'application/xml',
	
	'.zip': 'application/zip'
};

const type_MIME_defaut = 'application/octet-stream';

const contentTypeCharset = '; charset=utf-8';

const encodages = [
	{ nom: 'br', methodeRessource: zlib.brotliCompress, methodeTelechargement: zlib.createBrotliCompress },
	{ nom: 'gzip', methodeRessource: zlib.gzip, methodeTelechargement: zlib.createGzip },
	{ nom: 'deflate', methodeRessource: zlib.deflate, methodeTelechargement: zlib.createDeflate }
];

const fichiersNonCompressables = ['.zip', '.rar', '.mp3', '.mp4', '.jpg', '.png', '.pdf', '.ico', '.woff2'];

const repertoireEasyFront = '/_easyfront';




const server = http.createServer(async (req, res) => 
{
	tracerInformations(req);
		
	definirEntetesSecurite(res);
		
	// Récupérer la liste des encodages supportés
	
	const acceptEncoding = req.headers['accept-encoding'] || '';
	
	// Traitement de l'URL
	
	let cheminRessource;
	
	// Si le fichier demandé à est télécharger ou non. Par défaut, non.
	let fichierEstATelecharger = false;
	let nomFichierATelecharger;
	
	if(req.url === '/')
	{
		cheminRessource = path.join(fichiersHTML, 'index.html');
	}
	else if(req.url === '/_erreur') // Quoi ? On demande l'erreur ? 😄
	{
		// v.1
		// redirigerEnAccueil(res);
		// return;
		// v.2
		cheminRessource = path.join(fichiersHTML, 'dans-l-espaaace.html'); // 🐷
	}
	else if(req.url === '/sitemap.xml')
	{
		cheminRessource = path.join(__dirname, '../sitemap.xml');
	}
	else if (req.url.match(/\.(html?|js|css|png|jpe?g|gif|svg|ico|eot|woff2?|otf|ttf|ttc|txt|pdf|zip)$/)) 
	{
		// Cache control
		// res.setHeader('Cache-Control', 'max-age=31536000, public, immutable');
		
		if(req.url === '/favicon.ico')
		{
			cheminRessource = path.join(__dirname, '../favicon.ico');
		}
		else if(req.url.startsWith(repertoireEasyFront) && !estEnDev) 
		{
			cheminRessource = path.join(fichiersHTML, nomPageErreur);
		}
		else
		{
			cheminRessource = path.join(fichiersFront, req.url);
			
			if(req.url.startsWith('/telechargements'))
			{
				fichierEstATelecharger = true;
				// Conserver le nom du fichier
				const parsed = url.parse(req.url);
				// const baseName = path.basename(parsed.pathname); // séparateur du système d'exploitation
				const baseName = path.posix.basename(parsed.pathname); // utilise le séparateur '/'
				nomFichierATelecharger = baseName;
			}
		}
	}
	else
	{
		let urlPropre = nettoyerURL(req.url);
		
		if(urlPropre.startsWith(repertoireEasyFront))
		{
			if(!estEnDev)
			{	
				urlPropre = nomPageErreur; 
			}
			else
			{
				const sitemapEditor = require('./_easyfront/sitemapEditor');
				await sitemapEditor.creerFichier(fichiersHTML, process.env.DISTANT_HOST);
				if(urlPropre === '/_easyfront/lire')
				{
					sitemapEditor.route_lire(res); 
					return;
				}
				else if(urlPropre === '/_easyfront/enregistrer' && req.method === 'POST')
				{
					sitemapEditor.route_enregistrer(req, res);
					return;
				}
			}
		}
		
		cheminRessource = path.join(fichiersHTML, urlPropre + '.html');	
	}
		
	// L'extension de fichier
	const extension = String(path.extname(cheminRessource)).toLowerCase();
	
	// Déterminer le type MIME et le charset pour l'en-tête Content-Type
	const typeMime = types_MIME[extension] || type_MIME_defaut;
	const contentTypeCharset = retournerContentType(typeMime);
	
	// La ressource est-elle à compresser ? Si oui, alors récupérer nom et méthodes.
	let fichierEstACompresser = false;
	let compressionChoisie;
	if(!fichiersNonCompressables.includes(extension))
	{
		fichierEstACompresser = true;
		for(let el of encodages)
		{
			if(acceptEncoding.includes(el.nom))
			{
				compressionChoisie = el;
				break;
			}
		}
	}
	
	console.log(`Ressource à trouver et à renvoyer
	Chemin ressource : ${cheminRessource}
	typeMime : ${typeMime}
	ContentType : ${contentTypeCharset}
	Compresser ? ${fichierEstACompresser} ${compressionChoisie?compressionChoisie.nom:''}
	Télécharger ? ${fichierEstATelecharger}
	Nom Fichier à télécharger ? ${nomFichierATelecharger}`);
	
	if(fichierEstATelecharger)
	{
		fs.stat(cheminRessource, (error, content) =>
		{
			console.log(`\nTéléchargement de ${cheminRessource} sans compression.`);
			if(error)
			{
				console.log(`Erreur : fichier introuvable à l'adresse ${cheminRessource}`);
				// console.log(error);
				renvoyerPageErreur(res, `${refereur}${req.url}`);
				// OK mais les liens ne doivent pas avoir l'attribut 'download' (sinon la page d'erreur se télécharge 😄)
				return;
			}
			// Définir les en-têtes
			res.statusCode = 200;
			res.setHeader('Content-Type', contentTypeCharset);
			res.setHeader('Content-Disposition', `attachment; filename="${nomFichierATelecharger}"`);
			res.setHeader('Content-length', content.size);
			// V.1
			// Créer un flux de lecture pour le fichier et le transmettre au client
			const fileStream = fs.createReadStream(cheminRessource);
			fileStream.pipe(res);
			// V.2 
			// Créer un flux de lecture du fichier, selon la compression à appliquer, et le transmettre au client
			/*const fileStream = fs.createReadStream(cheminRessource);
			let compressionStream = null;
			if(fichierEstACompresser)
			{
				console.log(`\nFichier ${cheminRessource} à compresser avant téléchargement avec ${compressionChoisie.nom}.`);

				res.setHeader("Content-Encoding", compressionChoisie.nom);
				compressionStream = compressionChoisie.methodeTelechargement();
			}
			
			if(compressionStream)
			{
				fileStream.pipe(compressionStream).pipe(res);
			}
			else
			{
				fileStream.pipe(res);
			}*/
			// Problèmes : temps de traitement plus long ; les fichiers média ne sont pas à compresser car ils le sont déjà ; donc rester en V.1.
		});
		return;
	}
	
	// Si le fichier n'est pas à télécharger, alors le lire et envoyer le contenu comme réponse
	let fichierLu = await lireFichier(cheminRessource);
	if(!fichierLu.succes)
	{
		if(fichierLu.code === 'ENOENT')
		{
			renvoyerPageErreur(res, `${refereur}${req.url}`);
			console.log(`\nEnvoi de ${cheminRessource}. Erreur : ressource introuvable`);
		}
		else
		{
			retournerMessage(res, 500, `500 - ${fichierLu.code}`);
			console.log(`\nEnvoi de ${req.url}. Erreur 500 Internal Server Error. Message : ${fichierLu.message}`);
		}
		return;
	}
	
	// Gérer un modèle HTML pour les pages ainsi que les sous-éléments HTML éventuels
	let donneesFinales = fichierLu.donnees;
	if(cheminRessource.endsWith('.html') && !req.url.startsWith(repertoireEasyFront))
	{
		let donneesUtf8 = fichierLu.donnees.toString('utf8');
		// donneesUtf8 = await inclureSources(donneesUtf8); // n'inclut que pour la page
		
		const valeurTitle = extraireContenu(/<title>([^<]*)<\/title>/i, donneesUtf8);
		const valeurDescription = extraireContenu(/<description>([^<]*)<\/description>/i, donneesUtf8);
		const customTags = extraireContenu(/<customTags>([\s\S]*?)<\/customTags>/i, donneesUtf8);
		const contenuPage = extraireContenu(/<page>([\s\S]*?)<\/page>/i, donneesUtf8);
		
		let page = await lireFichier(cheminModele, true);
		if(!page.succes)
		{
			if(page.code === 'ENOENT')
			{
				renvoyerPageErreur(res, `${refereur}${req.url}`);
				console.log(`\nFichier modèle introuvable`);
			}
			else
			{
				retournerMessage(res, 500, `500 - ${page.code}`);
				console.log(`\nEnvoi de ${req.url}. Erreur 500 Internal Server Error. Message : ${page.message}`);
			}
			return;
		}
		// OPTION - Modifier la valeur de <base>
		// page = page.donnees.replace('{{base}}', obtenirTagBase()); 
		page = page.donnees
			.replace('{{title}}', valeurTitle)
			.replace('{{description}}', valeurDescription)
			.replace('{{customTags}}', customTags)
			.replace('{{page}}', contenuPage)
		;
		
		page = await inclureSources(page); // inclut pour tout le doc HTML à retourner
		
		donneesFinales = page;
	}
	
	// Si la compression s'applique, alors envoyer le contenu compressé avec le type MIME correct
	if(fichierEstACompresser)
	{
		compressionChoisie.methodeRessource(donneesFinales, (erreurCompression, dataCompressee) => 
		{
			let contenuFinal;
			if(erreurCompression)
			{
				contenuFinal = donneesFinales;
				console.log(`\nEnvoi de ${cheminRessource}. Erreur de compression ${compressionChoisie.nom}. Renvoi de la ressource non compressée. ${erreurCompression}`);
			}
			else
			{
				res.setHeader('Content-Encoding', compressionChoisie.nom);
				contenuFinal = dataCompressee;
				console.log(`\nEnvoi de ${cheminRessource}. Compression ${compressionChoisie.nom}`);
			}
			retournerRessource(res, 200, contentTypeCharset, contenuFinal);
		});
		return;
	}
	
	// Envoyer le contenu du fichier avec type MIME correct et sans compression
	retournerRessource(res, 200, contentTypeCharset, donneesFinales);
	console.log(`\nEnvoi de ${cheminRessource} sans compression`);	
});

// Démarrer le serveur sur le port 
server.listen(PORT, () => 
{
	const message = `Serveur démarré sur ${SERVEUR}:${PORT}`;
	const messageLongueur = message.length;
	console.log('-'.repeat(messageLongueur));
	console.log(message);
	console.log('-'.repeat(messageLongueur));
});


// Fonctions

let retournerContentType = (typeMime) =>
{
	let charset = '';
	switch (typeMime) 
	{
		case types_MIME['.png']:
		case types_MIME['.jpg']:
		case types_MIME['.jpeg']:
		case types_MIME['.gif']:
		case types_MIME['.ico']:
			break;
		default:
			charset = contentTypeCharset;
			break;
	}
	return `${typeMime}${charset}`;	
}

let retournerRessource = (res, statusCode, contentTypeCharset, message) =>
{
	res.statusCode = statusCode;
	res.setHeader('Content-Type', contentTypeCharset);
	res.end(message);
}

let retournerMessage = (res, statusCode, message) =>
{
	res.statusCode = statusCode;
	res.setHeader('Content-Type',  types_MIME['.txt'] + contentTypeCharset);
	res.end(message);		
}

let renvoyerPageErreur = (res, cheminDemande) =>
{
	const cheminErreur = path.join(fichiersHTML, nomPageErreur);
	
	// Préciser l'encodage pour éditer
	fs.readFile(cheminErreur, 'utf-8', (err404, contenuErreur) => 
	{
		// Si le fichier d'erreur lui-même est introuvable
		if (err404) 
		{
			retournerRessource(res, 500, types_MIME['.html'], '<h1>Erreur 500 - Impossible de charger la page d\'erreur 404</h1>');
			return;
		} 
	
		// Afficher la page d'erreur 
		// v.1 : telle quelle
		// res.writeHead(res.statusCode, { 'Content-Type': mimeTypes['.html'] });
		// res.end(contenuErreur);
		// v.2 : avec contenu spécifique
		let contenuPersonnalise = contenuErreur
			.replace('{{errorCode}}', /*res.statusCode*/ 404)
			.replace('{{errorMessage}}', `Ressource demandée : <br>${cheminDemande}`);
			
		// OPTION - Modifier la valeur de <base>
		// contenuPersonnalise = contenuPersonnalise.replace('{{base}}', obtenirTagBase()); 
		
		retournerRessource(res, 404, types_MIME['.html'], contenuPersonnalise);
	});
}

let tracerInformations = (req) =>
{
	console.log('');
	
	// console.log('Headers :', JSON.stringify(req.headers, null, 2));
	// console.log('\tHost : ' + req.headers.host); //  Host : localhost:3000
	console.log(`Requête entrante
	Méthode et URL : ${req.method} ${req.url}
	Adresse IP : ${req.socket.remoteAddress}
	Adresse IP si Proxy : ${req.headers['x-forwarded-for']}
	User agent: ${req.headers['user-agent']}
	acceptEncoding : ${req.headers['accept-encoding']}
	x-forwarded-proto : ${req.headers['x-forwarded-proto'] || 'non présent'}`); 
	// socket = connexion TCP, remoteAddress = adresse IP de l'utilisateur ayant fait la requête
	// Adresse IPv4, par exemple 192.168.0.1
	// Adresse IPv6, par exemple ::1 (localhost en IPv6).
	
	console.log('');
}

let definirEntetesSecurite = (res) =>
{
	// HSTS
	/*
	On ajoute cet en-tête en testant par exemple req.headers['x-forwarded-proto'] (donc, il faut passer req en paramètre de cette fonction). Ce qui donnerait :
		const forwardedProto = req.headers['x-forwarded-proto'];
		if(forwardedProto === 'https')
		{
			res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains') // 2 ans
		}
	Or, cela dépend du serveur. En effet, celui-ci peut ne pas ajouter cet en-tête ou encore renvoyer un tableau...
	Donc, autre méthode possible : déclarer qu'on est en dev (ou en prod) et tester le cas.
	*/
	if(!estEnDev)
	{
		res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains') // 2 ans
	}
	
	// CSP 
	res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; img-src 'self' data:; style-src 'self'; font-src 'self'; base-uri 'self'; form-action 'self'; object-src 'self'; connect-src 'self'; frame-ancestors 'none'; child-src 'self';");
	
	// Eviter exploit sniffing par type MIME
	res.setHeader('X-Content-Type-Options', 'nosniff');
	
	// Bloquer les requêtes malveillantes par les navigateurs supportant cet en-tête
	// res.setHeader('X-XSS-Protection', '1; mode=block');
	// Déprécié
	
	// Pas d'ouverture en cadre
	// res.setHeader('X-Frame-Options', 'DENY');
	// Déprécié 
	
	// Le partage du contexte de navigation avec d'autres entités
	res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
	
	// Ne pas envoyer l'origine des requêtes aux autres
	res.setHeader('Referrer-Policy', 'same-origin');
}

/*let redirigerEnAccueil = (res) =>
{
	// 302 Found : Permet de rediriger mais peut entraîner un changement de méthode (ex : une requête POST redirigée pourrait devenir une GET).
	// 307 Temporary Redirect : Garantit que la méthode HTTP initiale (ex : POST) reste la même après la redirection.
	res.statusCode = 307;
	res.setHeader('Location', '/');
	res.end();
}*/

let nettoyerURL = (url) =>
{
	if (typeof url !== 'string') return '';
	return url
		.trim()					// supprimer les espaces blancs en début et fin
		.replace(/\s+/g, '') 	// supprimer les espaces
		.replace(/\/+$/g, '')	// supprimer les slashs de fin
		.replace(/\?.*$/, '')	// supprimer le query string éventuel
}

let extraireContenu = (regex, contenu)  =>
{
	return contenu.match(regex)?.[1] || '';
}

/*let obtenirTagBase = () =>
{
	let baseHtml = SERVEUR;
	if(SERVEUR.includes('localhost'))
	{
		baseHtml = SERVEUR+':'+PORT; 
	}
	return baseHtml;
}*/

let lireFichier = async (chemin, utf8=false) =>
{
	let obj = {succes:false, donnees:undefined, code:undefined, message:undefined};
	
	try 
	{
		let donnees;
		if(utf8)
		{
			donnees = await fsPromise.readFile(chemin, 'utf8'); // buffer converti
		}
		else
		{
			donnees = await fsPromise.readFile(chemin); // buffer
		}
		obj.succes = true;
		obj.donnees = donnees;
		return obj;
	} 
	catch (error) 
	{
		obj.code = error.code; // 'ENOENT' = fichier introuvable
		obj.message = error.message;
		return obj;
	}
}

let inclureSources = async (contenu, pile = []) =>
{
	// Pouvoir inclure plusieurs fois le même fichier
	// Interdire qu’un fichier puisse s’auto-inclure
    const sources = /<source fichier="(.+?)"\/>/g;
    let match;

    while ((match = sources.exec(contenu)) !== null) 
	{
        const tagSource = match[0];
        const tagSourceFichier = match[1];
        const fichierCible = path.join(fichiersModeles, tagSourceFichier);

        if (pile.includes(fichierCible)) {
            console.error(`\nAuto-inclusion détectée : le fichier ${fichierCible} tente de s'inclure lui-même.`);
            contenu = contenu.replace(tagSource, `<!-- Auto-inclusion détectée : ${tagSourceFichier} ignoré -->`);
            continue;
        }

        if (fs.existsSync(fichierCible)) 
		{
			let buffer = await lireFichier(fichierCible, true);
			if(!buffer.succes)
			{
				console.error(`${buffer.code} ${buffer.message}`);
				continue;
			}
            let contenuFichierCible = buffer.donnees;
            // On ajoute le fichier courant à la pile pour cette branche uniquement
            contenuFichierCible = await inclureSources(contenuFichierCible, [...pile, fichierCible]);
            contenu = contenu.replace(tagSource, contenuFichierCible);

            // Reset la position car le contenu a changé
            sources.lastIndex = 0;
        }
    }

    return contenu;
}
