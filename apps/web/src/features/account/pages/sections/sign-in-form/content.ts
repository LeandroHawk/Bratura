import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Entre no seu portfólio',
  lead: 'Seus editais, o que falta para cada um e a inscrição preparada esperam por você.',
  demoNotice:
    'Versão de demonstração: o cadastro fica só no navegador em que foi feito, e a senha não é conferida.',
  email: 'E-mail',
  password: 'Senha',
  submit: 'Entrar',
  noAccountHere: 'Não há cadastro com este e-mail neste navegador.',
  noAccount: 'Ainda não tem cadastro?',
  signUp: 'Criar meu cadastro',
  exampleTitle: 'Só quer ver como funciona?',
  exampleLead:
    'Entre com o portfólio da Dona Maria, rendeira de Juazeiro do Norte. Ela é um exemplo: não é uma pessoa real.',
  useExample: 'Entrar com o exemplo',
};

export const SIGN_IN_FORM_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Sign in to your portfolio',
    lead: 'Your calls, what each one still asks of you and the prepared application are waiting.',
    demoNotice:
      'Demo version: an account lives only in the browser where it was created, and the password is not checked.',
    email: 'E-mail',
    password: 'Password',
    submit: 'Sign in',
    noAccountHere: 'There is no account with this e-mail in this browser.',
    noAccount: 'No account yet?',
    signUp: 'Create my account',
    exampleTitle: 'Just want to see how it works?',
    exampleLead:
      'Sign in with the portfolio of Dona Maria, a lace maker from Juazeiro do Norte. She is an example, not a real person.',
    useExample: 'Sign in with the example',
  },
};
