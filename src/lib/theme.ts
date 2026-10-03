// Runs before first paint. Light by default; dark only if chosen in the app.
export const THEME_SCRIPT = `try{document.documentElement.dataset.theme=localStorage.getItem('theme')==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}`;
