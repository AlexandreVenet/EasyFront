const process = require('process');
const path = require('path');
const fs = require('fs');

let chargerENVLocal = () =>
{
	const cheminFichier = path.join(__dirname, '.env');
	
	const envContenu = fs.readFileSync(cheminFichier, 'utf-8');
	
	envContenu.split('\n').forEach(line => {
		const [key, value] = line.split('=');
		if (key && value) 
		{
			const trimmedKey = key.trim();
			const trimmedValue = value.trim();

			// Ajoute seulement si la clé n'existe pas déjà dans process.env
			if (!process.env[trimmedKey]) 
			{
				process.env[trimmedKey] = trimmedValue;
			}
		}
		});
}

module.exports = {chargerENVLocal};
