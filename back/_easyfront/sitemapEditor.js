const fsPromises = require('fs/promises');
const path = require('path');



const headers = { 'Content-Type': 'application/json' };

const cheminFichier = './sitemap.xml';

const sitemapXmlDebut = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
	xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
	xmlns:perso="http://easyfront/perso">`;

const sitemapXmlFin = `
</urlset>
`;



let route_lire = async (res) =>
{
	const existe = await fichierExiste(cheminFichier);
	if(!existe)
	{
		renvoyerJson(res, 200, {existe: false});
		return;
	}
	
	try 
	{
		const contenu = await fsPromises.readFile(cheminFichier, 'utf8');
		renvoyerJson(res, 200, {existe: true, contenu: contenu});
	} 
	catch (err) 
	{
		console.log(err);
		renvoyerJson(res, 200, {existe: false});
	}
}

let fichierExiste = async (chemin) =>
{
	try 
	{
		await fsPromises.access(chemin);
		return true;
	} 
	catch (err) 
	{
		// console.log(err);
		return false;
	}
}

let renvoyerJson = (res, codeHttp, objet=null) =>
{
	res.writeHead(codeHttp, headers);
	res.end(JSON.stringify(objet));
}

let route_enregistrer = async (req, res) =>
{
	let body = '';
	
	req.on('data', chunk => 
	{
		body += chunk.toString();
	});
	
	req.on('end', async () => 
	{
		const data = JSON.parse(body);
		// console.log('Données reçues :', data);
			
		const fichierCree = await creerSitemap(data);
		if(!fichierCree)
		{
			renvoyerJson(res, 200, {etat: false, message : 'Une erreur est survenue.'});
			return;
		}
		renvoyerJson(res, 200, {etat: true, message: 'Le fichier est enregistré.'});
	});
}

let obtenirBlocUrl = (objetUrl) =>
{
	let fragmentXml = '\n\t<url>';
	
	fragmentXml += `\n\t\t<perso:titre>${echapper(objetUrl.titre)}</perso:titre>`;
	fragmentXml += `\n\t\t<loc>${echapper(encoderUrl(objetUrl.loc))}</loc>`;
	
	if(objetUrl.lastmod)
	{
		fragmentXml += `\n\t\t<lastmod>${echapper(objetUrl.lastmod)}</lastmod>`;
	}
	
	if(objetUrl.changefreq)
	{
		fragmentXml += `\n\t\t<changefreq>${echapper(objetUrl.changefreq)}</changefreq>`;
	}
	
	if(objetUrl.priority)
	{
		fragmentXml += `\n\t\t<priority>${echapper(objetUrl.priority)}</priority>`;
	}
	
	fragmentXml += '\n\t</url>';
	
	return fragmentXml;
}

let echapper = (str) =>
{
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

let encoderUrl = (str) =>
{
	let urlNettoyee = decodeURI(str);
	return encodeURI(urlNettoyee);
}

let obtenirUrlsPages = async (dossier, racinePagesHtml) =>
{
	let urls = [];
	
	const items = await fsPromises.readdir(dossier, {withFileTypes:true});
	
	for (const item of items) 
	{
		if(item.name.startsWith('_')) continue; // ignorer les dossiers préfixés '_'
		
		const itemPath = path.join(dossier, item.name);
		
		if(item.isDirectory())
		{
			const subUrls = await obtenirUrlsPages(itemPath, racinePagesHtml);
			urls = urls.concat(subUrls);
		}
		else if(item.isFile() && path.extname(item.name) === '.html')
		{
			let chemin = path.relative(racinePagesHtml, itemPath)
				.replace(/\\/g, '/') // Compatibilité Windows
				.replace(/\.html$/, ''); // Supprimer l'extension

			if(chemin === 'index')
			{
				urls.push('');
			}
			else
			{
				urls.push('/' + chemin);
			}
		}
	}
	return urls;
}

let creerSitemap = async (data)  =>
{
	let sitemapXml = sitemapXmlDebut;
	data.donnees.forEach(element => 
	{
		const fragmentXml = obtenirBlocUrl(element);
		sitemapXml += fragmentXml;
	});
	sitemapXml += sitemapXmlFin;
	
	try 
	{
		await fsPromises.writeFile(cheminFichier, sitemapXml);
		return true;	
	} 
	catch (error) 
	{
		console.log(err);	
		return false;
	}
}

let creerFichier = async (cheminPagesHtml, refereur) =>
{
	const existe = await fichierExiste(cheminFichier);
	if(!existe)
	{	
		const urls = await obtenirUrlsPages(cheminPagesHtml, cheminPagesHtml);

		let data = {donnees:[]};
		urls.forEach((chemin) =>
		{
			let obj = {};
			const cheminComplet = refereur + chemin;
			if(chemin === '') // page d'accueil
			{
				obj.titre = cheminComplet;	
			}
			else
			{
				obj.titre = chemin;
			}
			obj.loc = cheminComplet;
			data.donnees.push(obj);
		});
		
		const fichierCree = await creerSitemap(data);
		if(fichierCree)
		{
			console.log('sitemap.xml généré');
		}
	}
}


module.exports = {route_lire, route_enregistrer, creerFichier};

