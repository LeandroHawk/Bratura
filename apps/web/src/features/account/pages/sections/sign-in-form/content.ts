import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Entre no seu portfólio',
  lead: 'Seus editais, o que falta para cada um e a inscrição preparada esperam por você.',
  demoNotice:
    'Demonstração até 30/11: não há senha nem conta de verdade. O cadastro fica só no navegador em que foi feito e é apagado quando você sai.',
  email: 'E-mail do cadastro deste navegador',
  emailHint: 'Sem senha: o e-mail só encontra o cadastro de demonstração guardado aqui.',
  submit: 'Entrar',
  noAccountHere: 'Não há cadastro com este e-mail neste navegador.',
  noAccount: 'Ainda não tem cadastro?',
  signUp: 'Criar meu cadastro',
  exampleTitle: 'Só quer ver como funciona?',
  exampleLead:
    'Entre com o portfólio da Dona Maria, rendeira de Juazeiro do Norte. Ela é um exemplo: não é uma pessoa real.',
  useExample: 'Entrar como Dona Maria',
  replacesAccount: (email: string) =>
    `Este navegador guarda o cadastro de ${email}. Entrar como Dona Maria apaga esse cadastro, o portfólio e os editais salvos.`,
  confirmUseExample: 'Apagar e entrar como Dona Maria',
  cancel: 'Cancelar',
};

export const SIGN_IN_FORM_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Sign in to your portfolio',
    lead: 'Your calls, what each one still asks of you and the prepared application are waiting.',
    demoNotice:
      'Demo until 30/11: there is no password and no real account. An account lives only in the browser where it was created and is erased when you sign out.',
    email: 'E-mail of this browser’s account',
    emailHint: 'No password: the e-mail only finds the demo account kept here.',
    submit: 'Sign in',
    noAccountHere: 'There is no account with this e-mail in this browser.',
    noAccount: 'No account yet?',
    signUp: 'Create my account',
    exampleTitle: 'Just want to see how it works?',
    exampleLead:
      'Sign in with the portfolio of Dona Maria, a lace maker from Juazeiro do Norte. She is an example, not a real person.',
    useExample: 'Sign in as Dona Maria',
    replacesAccount: (email) =>
      `This browser keeps the account of ${email}. Signing in as Dona Maria erases that account, its portfolio and its saved calls.`,
    confirmUseExample: 'Erase and sign in as Dona Maria',
    cancel: 'Cancel',
  },
};
