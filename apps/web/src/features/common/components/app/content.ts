import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  nav: 'Sua área',
  portfolio: 'Portfólio',
  matches: 'Editais para você',
  callNotices: 'Todos os editais',
  room: 'Sala',
  exit: 'Saída',
  exitHint: 'sair da demonstração',
  loading: 'Abrindo seu portfólio…',
  gateTitle: 'Entre para ver esta página',
  gateLead: 'Ela usa o seu portfólio cultural. Crie seu cadastro ou entre para continuar.',
  signIn: 'Entrar',
  signUp: 'Criar meu cadastro',
};

export const APP_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    nav: 'Your area',
    portfolio: 'Portfolio',
    matches: 'Calls for you',
    callNotices: 'All calls',
    room: 'Room',
    exit: 'Exit',
    exitHint: 'leave the demo',
    loading: 'Opening your portfolio…',
    gateTitle: 'Sign in to see this page',
    gateLead: 'It uses your cultural portfolio. Create your account or sign in to continue.',
    signIn: 'Sign in',
    signUp: 'Create my account',
  },
};
