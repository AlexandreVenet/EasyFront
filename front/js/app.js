class App
{
	constructor()
	{
		this.nomConteneur = 'conteneurPage';
		this.conteneur =  this.chercherConteneur(document);
		this.metaDescription = this.chercherMetaDescription(document); 
		// this.headCustomTag = 'customTag';
		this.pageDemandee;
		this.dureeTransition;

		this.enregistrerPremierEtatHistorique();
		this.obtenirDureeTransition();
		this.configurerLiensPages();
		this.gererJSPages(); 
		
		this.coul = 'Violet';
		logDetail('app.js', 'Démarré', 'Classe principale', this.coul);
	}
		
	configurerLiensPages = () =>
	{
		const tousLiens = document.querySelectorAll('a');		
		for (const a of tousLiens) 
		{
			a.onclick = (e) =>
			{
				e.preventDefault();
				const href = a.getAttribute('href'); // contenu de l'attribut
				const url = e.target.href; // l'adresse absolue
				if(href?.startsWith('/telechargements'))
				{
					this.telechargerFichier(url);
				}
				else if(href?.startsWith('/ressources') || href?.startsWith('http'))
				{
					this.ouvrirNouvelOnglet(url);
				}
				else if(href?.startsWith('/'))
				{
					this.pageDemandee = url;
					this.pageTransition();
				}
			}
		}
	}
	
	chercherConteneur = (element) => element.querySelector('#' + this.nomConteneur);
		
	chercherMetaDescription = (element) => element.querySelector('meta[name="description"]'); 
	
	pageTransition = async () =>
	{		
		this.transitionPageMasquer();		
		await this.attendreMillisecondesAsync(this.dureeTransition);
		this.viderConteneur();
		
		const doc = await this.chargerPage();
		
		let stateData = this.definirStateData(this.pageDemandee); // Un *state* d'historique peut contenir quelques données.
		window.history.pushState(stateData, '', this.pageDemandee);
		
		// Gérer le contenu et le titre du document APRES la gestion de l'historique (sinon, confusion du titre et de l'entrée)
				
		this.modifierDOM(doc);
		this.configurerLiensPages();
		await this.gererJSPages();
		this.transitionPageAfficher();
	}
	
	chargerPage = async () =>
	{
		/*return await fetch(this.pageDemandee)
			.then(reponse =>
			{
				if(!reponse.ok)	
				{
					throw new Error(reponse.status);
				}
				return reponse.text();
			})
			.then(html =>
			{
				const parser = new DOMParser();
				const doc = parser.parseFromString(html, 'text/html');
				return doc;
			})
			.catch(erreur =>
			{
				log(`💢 app.js > chargerPage() > Message d'erreur : ${erreur.message}`, this.coul);
				
				const doc = document.implementation.createHTMLDocument('Erreur');
				
				const meta = doc.createElement('meta');
				meta.name = 'description';
				meta.content = "Une erreur s'est produite.";
				doc.head.appendChild(meta);
				
				const template = document.createElement('template');
				template.innerHTML = `
					<div id="${this.nomConteneur}">
						<h1>Erreur</h1>
						<p>Code d'erreur : ${erreur.message}</p>
						<p>Ressource demandée :
						<br>${this.pageDemandee}</p>
						<p>Cette page générée en JS est différente de celle renvoyée directement par le serveur.</p>
					</div>`;
				doc.body.appendChild(template.content.cloneNode(true));
				
				return doc;
		});*/
		
		return await fetch(this.pageDemandee)
			.then(async reponse => 
			{
				if(!reponse.ok)	
				{
					throw new HttpError(reponse.status, await reponse.text());
				}
				return reponse.text();
			})
			.then(texte =>
			{
				return this.parserTexteEnHTML(texte);
			})
			.catch(erreur =>
			{
				if(erreur instanceof HttpError)
				{
					return this.parserTexteEnHTML(erreur.message);
				}
				else
				{
					log(`💢 app.js > chargerPage() > Message d'erreur : ${erreur.message}`, this.coul);
				}
		});
	}
	
	modifierDOM = (doc) =>
	{
		document.title = doc.title;
		
		this.metaDescription.content = this.chercherMetaDescription(doc).content;
		
		document.head.querySelectorAll('link.customTag').forEach(link => link.remove());
		const links = doc.querySelectorAll('link[rel="stylesheet"].customTag');
		for (const link of links) 
		{
			const href = link.href;
			const newLink = document.createElement('link');
			newLink.rel = 'stylesheet';
			newLink.href = href;
			newLink.setAttribute('class', 'customTag');
			document.head.appendChild(newLink);
		}
		
		const contenus =  this.chercherConteneur(doc).children;
		for (const noeud of contenus) 
		{
			this.conteneur.appendChild(noeud.cloneNode(true));
		}
	}
	
	finiParUneExtension = (href) => /\.\w{2,5}?$/.test(href); 
	
	transitionPageMasquer = () => document.body.classList.add('masquer'); 
	
	transitionPageAfficher = () => document.body.classList.remove('masquer'); 
	
	obtenirDureeTransition = () =>
	{
		this.dureeTransition = parseFloat(window.getComputedStyle(document.body).transitionDuration) * 1000;			
	}
	
	attendreMillisecondesAsync = async (temps) => 
	{
		return await new Promise(resolve => setTimeout(resolve, temps));	
	}
	
	viderConteneur = () =>
	{
		while(this.conteneur.firstChild)
		{
			this.conteneur.removeChild(this.conteneur.firstChild);
		}
	}
	
	// ajouterElementAuConteneur = (element) => 
	// {
	// 	this.conteneur.appendChild(element);
	// }
		
	ecouterHistorique = () =>
	{
		window.onpopstate = async (e) =>
		{
			if(e.state)
			{
				this.pageDemandee = e.state.url;
				this.transitionPageMasquer();
				await this.attendreMillisecondesAsync(this.dureeTransition);
				this.viderConteneur();
				const doc = await this.chargerPage();
				this.modifierDOM(doc);
				this.configurerLiensPages();
				await this.gererJSPages();
				this.transitionPageAfficher();
			}
		}
	}
	
	definirStateData = (url) =>
	{
		return {url:url};
	}
	
	enregistrerPremierEtatHistorique = () =>
	{
		const windowLocationHref = window.location.href;
		const stateData = this.definirStateData(windowLocationHref);
		window.history.replaceState(stateData, '', windowLocationHref);
	}
	
	parserTexteEnHTML = (texte) =>
	{
		const parser = new DOMParser();
		const doc = parser.parseFromString(texte, 'text/html');
		return doc;
	}
	
	telechargerFichier = (chemin) =>
	{
		fetch(chemin, {method:'HEAD'})
			.then(response => 
			{
				if (response.ok) 
				{
					const lien = document.createElement('a');
					lien.href = chemin;
					// lien.download = ''; // non 😄
					document.body.appendChild(lien);
					lien.click();
					document.body.removeChild(lien);
				} else {
					log(`💢 app.js > telechargerFichier() > Fichier introuvable à ${chemin}`, this.coul);
				}
			})
			.catch(error => 
			{
				log(`💢 app.js > telechargerFichier() > ${error}`, this.coul);
			})
		;
	}
	
	ouvrirNouvelOnglet = (chemin) => window.open(chemin, '_blank'); 
	
	gererJSPages = async () =>
	{
		const scripts = this.conteneur.querySelectorAll('script[src]');
		for (const script of scripts)
		{
			try 
			{
				const module = await import(script.src);
				if (module && typeof module.default === 'function') 
				{
					new module.default(); 
				}
			} 
			catch (error) 
			{
				log(`💢 app.js > gererJSPages() > Erreur de chargement du module ${script.src} > ${error}`, this.coul);
			}
		}
	}
}

class HttpError extends Error 
{
    constructor(status, message) 
	{
        super(message);
        this.name = "HttpError";
        this.status = status;
    }
}

export default App;
// export { HttpError }; Exporter si utilisé par ailleurs
