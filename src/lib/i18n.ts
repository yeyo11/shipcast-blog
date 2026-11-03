// The few words the template itself writes on a page. A language missing here reads English; add
// yours as a copy of `en`. Articles bring their own words.
const en = {
  home: 'Launches',
  projects: 'Projects',
  all: 'All',
  rss: 'RSS feed',
  themeToggle: 'Switch between dark and light',
  latest: 'Latest launch',
  starOnGitHub: 'Star on GitHub',
  starPrompt: 'If {project} is useful to you, a star helps other developers find it.',
  stars: '{count} stars on GitHub',
  repository: 'Source on GitHub',
  launches: 'Launches of {project}',
  noLaunches: 'No launches yet.',
  noProjects: 'No projects yet. A project appears here with its first launch.',
  projectsIntro: 'Every project launched on this blog, with its launches.',
  copy: 'Copy',
  copied: 'Copied',
  copyLabel: 'Copy code to the clipboard',
  by: 'By {author}',
  readIn: 'Read in {language}',
  languages: 'Languages',
  notFoundTitle: 'Page not found',
  notFoundText: 'Nothing lives at this address. It may have moved, or the link may be mistyped.',
  backHome: 'Back to the launches',
  skip: 'Skip to content',
  home_link: 'Home',
  redirecting: 'This page has moved to',
  oneLaunch: '1 launch',
  launchCount: '{count} launches',
  chooseLanguage: 'Choose a language',
};

export type Strings = typeof en;

const es: Strings = {
  home: 'Lanzamientos',
  projects: 'Proyectos',
  all: 'Todos',
  rss: 'Feed RSS',
  themeToggle: 'Cambiar entre oscuro y claro',
  latest: 'Último lanzamiento',
  starOnGitHub: 'Estrella en GitHub',
  starPrompt: 'Si {project} te resulta útil, una estrella ayuda a que otros desarrolladores lo encuentren.',
  stars: '{count} estrellas en GitHub',
  repository: 'Código en GitHub',
  launches: 'Lanzamientos de {project}',
  noLaunches: 'Aún no hay lanzamientos.',
  noProjects: 'Aún no hay proyectos. Cada proyecto aparece aquí con su primer lanzamiento.',
  projectsIntro: 'Cada proyecto lanzado en este blog, con sus lanzamientos.',
  copy: 'Copiar',
  copied: 'Copiado',
  copyLabel: 'Copiar el código al portapapeles',
  by: 'Por {author}',
  readIn: 'Leer en {language}',
  languages: 'Idiomas',
  notFoundTitle: 'Página no encontrada',
  notFoundText: 'No hay nada en esta dirección. Puede que se haya movido o que el enlace tenga una errata.',
  backHome: 'Volver a los lanzamientos',
  skip: 'Saltar al contenido',
  home_link: 'Inicio',
  redirecting: 'Esta página se ha movido a',
  oneLaunch: '1 lanzamiento',
  launchCount: '{count} lanzamientos',
  chooseLanguage: 'Elige un idioma',
};

const STRINGS: Record<string, Strings> = { en, es };

/** The template's words in a language, English for one it does not have */
export function t(lang: string): Strings {
  return STRINGS[lang] ?? en;
}

/** `{name}` placeholders filled in */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

/** A language's own name for itself (Español, Deutsch), for the language switch */
export function languageName(lang: string): string {
  try {
    const name = new Intl.DisplayNames([lang], { type: 'language' }).of(lang) ?? lang;
    return name.charAt(0).toLocaleUpperCase(lang) + name.slice(1);
  } catch {
    return lang;
  }
}

/** A date as the cards print it: SEPTEMBER 10, 2026, in the page's language */
export function formatDate(date: Date, lang: string): string {
  return new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
}
