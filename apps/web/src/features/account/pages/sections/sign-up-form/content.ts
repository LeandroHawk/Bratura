import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Crie seu cadastro de demonstração',
  lead: 'Só o que serve para conferir os editais com você: quem se inscreve, onde e em que área.',
  demoNotice:
    'Demonstração até 30/11: não há senha nem conta de verdade. O que você digitar fica só neste navegador e é apagado quando você sai.',
  applicantType: 'Quem se inscreve',
  mainCulturalArea: 'Área cultural principal',
  state: 'Estado',
  city: 'Cidade',
  email: 'E-mail',
  emailHint: 'Só dá nome a este cadastro de demonstração: nenhuma mensagem é enviada.',
  submit: 'Criar meu cadastro',
  haveAccount: 'Já tem cadastro neste navegador?',
  signIn: 'Entrar',
};

export const SIGN_UP_FORM_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Create your demo account',
    lead: 'Only what it takes to check the calls against you: who applies, where and in which area.',
    demoNotice:
      'Demo until 30/11: there is no password and no real account. What you type stays in this browser only and is erased when you sign out.',
    applicantType: 'Who applies',
    mainCulturalArea: 'Main cultural area',
    state: 'State',
    city: 'City',
    email: 'E-mail',
    emailHint: 'It only names this demo account: no message is sent.',
    submit: 'Create my account',
    haveAccount: 'Already have an account in this browser?',
    signIn: 'Sign in',
  },
};
