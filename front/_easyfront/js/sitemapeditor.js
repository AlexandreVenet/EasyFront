let btnAjouter;
let btnPlier;
let btnDeplier;
let btnEnregistrer;
let btnFichier;
let btnAide;

let templateHtml;

let form;

let contenuXml;

const tousBtnActiverTextes = {activer:'Activer', desactiver:'Désactiver'};


let demarrer = async () =>
{
	btnAjouter = document.querySelector('#ajouter');
	btnPlier = document.querySelector('#plier');
	btnDeplier = document.querySelector('#deplier');
	btnEnregistrer = document.querySelector('#enregistrer');
	btnFichier = document.querySelector('#fichier');
	btnAide = document.querySelector('#aide');
	
	templateHtml = document.querySelector('#templateBlocDonnees');
	templateHtml.remove();
	
	form = document.forms['formulaire'];
	form.onsubmit = (e) =>
	{
		e.preventDefault();
	}
		
	let sitemapExiste = await fichierExiste();
	if(!sitemapExiste)
	{
		console.log('Pas de sitemap.xml');
	}
	else
	{	
		const parser = new DOMParser();
		const doc = parser.parseFromString(contenuXml, "application/xml");
		const root = doc.documentElement;
				
		for (const noeud of root.children) 
		{
			const titre = noeud.getElementsByTagName('perso:titre')[0]?.textContent ?? null;
			const loc = noeud.getElementsByTagName('loc')[0]?.textContent ?? null;
			const lastmod = noeud.getElementsByTagName('lastmod')[0]?.textContent ?? null;
			const changefreq = noeud.getElementsByTagName('changefreq')[0]?.textContent ?? null;
			const priority = noeud.getElementsByTagName('priority')[0]?.textContent ?? null;
					
			ajouterBlocDonnees(titre, loc, lastmod, changefreq, priority);
		}
	}
	
	activerNav();
	
	setVH();
	window.onresize = setVH;
}

let fichierExiste = async () => 
{
	try 
	{
		let response = await fetch('/_easyfront/lire');
		if (!response.ok) 
		{
			throw new Error('Erreur HTTP : ' + response.status);
        }
		
		let data = await response.json();
		if (data.existe) 
		{
			contenuXml = data.contenu;
			return true;
		} 
		else 
		{
			return false;
		}
	} 
	catch (error) 
	{
		console.log(error);
		return false;
	}
}

let activerNav = () =>
{
	activerNavBtn(btnAjouter, clickBtnAjouter);
	activerNavBtn(btnPlier, clickBtnPlier);
	activerNavBtn(btnDeplier, clickBtnDeplier);
	activerNavBtn(btnEnregistrer, clickBtnEnregistrer);
	activerNavBtn(btnFichier, clickBtnFichier);
	activerNavBtn(btnAide, clickBtnAide);
}

let activerNavBtn = (btn, methode) =>
{
	btn.disabled = false;
	btn.onclick = methode;
}

let ajouterBlocDonnees = (titre, loc, lastmod, changefreq, priority) =>
{
	const clone = templateHtml.content.cloneNode(true);

	const tamponHoraire =  Date.now();
	clone.querySelector('.blocDonnees').dataset.id = tamponHoraire; // pour sauvegarde
	definirForEtId(clone, 'titre', tamponHoraire);
	definirForEtId(clone, 'loc', tamponHoraire);
	definirForEtId(clone, 'lastmod', tamponHoraire);
	definirForEtId(clone, 'changefreq', tamponHoraire);
	definirForEtId(clone, 'priority', tamponHoraire);
	
	const h2 = clone.querySelector('h2');
	const champTitre = clone.querySelector(`#titre_${tamponHoraire}`);
	const champLoc = clone.querySelector(`#loc_${tamponHoraire}`);
	const tousBtnActiver = clone.querySelectorAll('.btnActiver');
	const champLastmod = clone.querySelector(`#lastmod_${tamponHoraire}`);
	const champChangefreq = clone.querySelector(`#changefreq_${tamponHoraire}`);
	const champPriority = clone.querySelector(`#priority_${tamponHoraire}`);
	
	if(titre)
	{	
		h2.textContent = titre;
		champTitre.value = titre;
	}
	if(loc)
	{
		champLoc.value = loc;
	}
	if(lastmod)
	{
		activerChampOptionnel(tousBtnActiver[0], champLastmod, lastmod);
	}
	if(changefreq)
	{	
		activerChampOptionnel(tousBtnActiver[1], champChangefreq, changefreq);
	}
	if(priority)
	{
		activerChampOptionnel(tousBtnActiver[2], champPriority, priority);
	}
	
	clone.querySelector('.btnMonter').onclick = (e) =>
	{
		e.preventDefault();
		const bloc = e.target.closest('.blocDonnees');
		const blocPrecedent = bloc.previousElementSibling;
		if(blocPrecedent)
		{
			bloc.parentNode.insertBefore(bloc, blocPrecedent);
		}
	}
	
	clone.querySelector('.btnDescendre').onclick = (e) =>
	{
		e.preventDefault();
		const bloc = e.target.closest('.blocDonnees');
		const blocSuivant = bloc.nextElementSibling;
		if(blocSuivant)
		{
			bloc.parentNode.insertBefore(blocSuivant, bloc);
		}
	}
	
	clone.querySelector('.btnPlierDeplier').onclick = (e) =>
	{
		e.preventDefault();
		e.target.closest('.titre').nextElementSibling.classList.toggle('masquerBloc');
	}
		
	champTitre.oninput = (e) =>
	{
		let contenu = e.target.value;
		if(!contenu)
		{
			contenu = 'Titre...'
		}
		const h2 = e.target.closest('.blocDonnees').querySelector('.titre h2');
		h2.textContent = contenu;
	}
	
	for (const el of tousBtnActiver) 
	{
		el.onclick = (e) =>
		{
			e.preventDefault();
			const input = e.target.nextElementSibling;
			input.disabled = !input.disabled;
			if(!input.disabled)
			{	
				if(input.type === 'date')
				{
					if(!input.value)
					{
						input.value = obtenirDateAujourdhuiFormatee();
					}
				}
				e.target.textContent = tousBtnActiverTextes.desactiver;
			}
			else
			{
				e.target.textContent = tousBtnActiverTextes.activer;
			}
			/*if(input.disabled)
			{
				if(input.nodeName === 'SELECT')
				{
					input.selectedIndex = input.dataset.default;
				}
				else
				{
					console.log(input);
					
					input.value = input.dataset.default;
				}
			}*/
		}
	}
	
	champLastmod.oninput = (e) =>
	{
		e.preventDefault();
		const valeur = e.target.value;
		if(!valeur)
		{
			e.target.value = obtenirDateAujourdhuiFormatee();	
		}
	}
	
	champPriority.oninput = (e) =>
	{
		const valeur = Number(e.target.value);
		const min = Number(e.target.min);
		const max = Number(e.target.max);
		if(!valeur && valeur != 0)
		{
			e.target.value = e.target.dataset.default;
		}
		else if(valeur > max)
		{
			e.target.value = max;
		}
		else if(valeur < min)
		{
			e.target.value = min;
		}
	}
	
	clone.querySelector('.btnSupprimer').onclick = (e) =>
	{
		e.preventDefault();
		const bloc = e.target.closest('.blocDonnees');
		bloc.remove();
	}
	
	form.appendChild(clone);	
}

let activerChampOptionnel = (btnActiver, champ, valeur) =>
{
	champ.value = valeur;
	champ.disabled = false;
	btnActiver.disabled = false;
	btnActiver.textContent = tousBtnActiverTextes.desactiver;
}

let clickBtnAjouter = (e) =>
{
	e.preventDefault();
	ajouterBlocDonnees(null, null, null, null, null);
}

let obtenirDateAujourdhuiFormatee = () =>
{
	const aujourdHui = new Date();
	// Formater YYYY-MM-DD
	const annee = aujourdHui.getFullYear();
	// Pour les mois et les jours, ajouter un 0 si la valeur est inférieure à 10.
	// Les mois commencent à 0.
	const mois = String(aujourdHui.getMonth() + 1).padStart(2, '0');
	const jour = String(aujourdHui.getDate()).padStart(2, '0'); 
	const dateFormatee = `${annee}-${mois}-${jour}`;
	return dateFormatee;
}

let definirForEtId = (clone, valeur, tamponHoraire) =>
{
	clone.querySelector(`label[for="${valeur}"]`).htmlFor = valeur + '_' + tamponHoraire;
	clone.querySelector(`#${valeur}`).id = valeur + '_' + tamponHoraire;
}

let clickBtnPlier = (e) =>
{
	e.preventDefault();
	plierDeplier();
}

let clickBtnDeplier  = (e) =>
{
	e.preventDefault();
	plierDeplier(false);
}

let plierDeplier = (plier=true) =>
{
	const allBlocDonneesContenus = document.querySelectorAll('.blocDonneesContenu');
	const classe = 'masquerBloc';
	for (const el of allBlocDonneesContenus) 
	{
		if(plier)
		{
			el.classList.add(classe);
		}
		else
		{
			el.classList.remove(classe);
		}
	}
}

let clickBtnEnregistrer = async (e) =>
{
	e.preventDefault();
		
	const classeErreur = 'erreur';
	const classeSucces = 'succes';
		
	const donnees = {
		donnees:[]
	};
	
	const blocs = document.querySelectorAll('.blocDonnees');
	if(!blocs || blocs.length == 0)
	{
		console.log('Aucune donnée');
		return;
	}
	for (const el of blocs)
	{
		const titre = el.querySelector('input[name="titre"]');
		const loc = el.querySelector('input[name="loc"]');
		const lastmod = el.querySelector('input[name="lastmod"]');
		const changefreq = el.querySelector('select[name="changefreq"]');
		const priority = el.querySelector('input[name="priority"]');
		
		// console.log(titre, loc, lastmod, changefreq, priority);
		
		let auMoins1Erreur = false;
	
		titre.classList.remove(classeErreur);
		btnEnregistrer.classList.remove(classeErreur);
		btnEnregistrer.classList.remove(classeSucces);
		loc.classList.remove(classeErreur);
		
		if(!titre.value)
		{
			titre.classList.add(classeErreur);
			auMoins1Erreur = true;
		}
		
		if(!loc.value || !estUneURL(loc.value))
		{
			loc.classList.add(classeErreur);
			auMoins1Erreur = true;
		}
		
		if(auMoins1Erreur)
		{
			btnEnregistrer.classList.add(classeErreur);
			return;
		}
		
		let obj = 
		{
			titre: titre.value,
			loc: loc.value,
		};
		if(!lastmod.disabled)
		{
			obj.lastmod = lastmod.value;
		}
		if(!changefreq.disabled)
		{
			obj.changefreq = changefreq.value;
		}
		if(!priority.disabled)
		{
			obj.priority = priority.value;
		}
		
		donnees.donnees.push(obj);
		// console.log(donnees);
	}
		
	/*fetch('/_easyfront/enregistrer',
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(donnees),
		})
		.then(response => response.text())
		.then(data => console.log(data))
		.catch(error => console.error(error));*/
	// Oui, c'est propre mais je ne veux pas tout imbriquer dans des then()

	try 
	{
		const response = await fetch('/_easyfront/enregistrer', 
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(donnees)
		});

		const data = await response.json();
		console.log(data);
	} 
	catch (error) 
	{
		console.error('Erreur :', error);
	}
	
	btnEnregistrer.classList.add(classeSucces);
	btnEnregistrer.onblur = (e) =>
	{
		e.target.classList.remove(classeSucces);
		e.target.onblur = null;
	}
}

let estUneURL = (valeur) =>
{
	try 
	{ 
		new URL(valeur); 
		return true;
	}
	catch(e)
	{ 
		return false; 
	}	
}

let clickBtnFichier = (e) =>
{
	e.preventDefault();
	window.open('/sitemap.xml', '_blank');
}

let clickBtnAide = (e) =>
{
	e.preventDefault();
	window.open('https://www.sitemaps.org/protocol.html', '_blank', 'noopener,noreferrer');
}

let setVH = () =>
{
	let vh = window.innerHeight * 0.01;
	document.documentElement.style.setProperty('--vh', `${vh}px`);
}



demarrer();
