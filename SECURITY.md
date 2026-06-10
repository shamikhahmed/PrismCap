# PrismOS — Security Notes


## Local-only data
- No server database. Protect device passcode and exported backup files.


## PWA / supply chain
- Static assets served from GitHub Pages; verify `sw.js` cache version when updating.
- Do not commit `.env` or API keys to the repository.

## Reporting
Open a private security issue on the PrismOS GitHub repo for vulnerabilities.
