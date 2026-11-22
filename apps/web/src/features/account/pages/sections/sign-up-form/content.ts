import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  replaceTitle: 'Substituir o cadastro deste navegador?',
  replaceLead:
    'Criar outro cadastro apaga o cadastro atual, o portfólio e os editais salvos deste navegador.',
  confirmReplace: 'Apagar e criar cadastro',
  cancel: 'Cancelar',
  close: 'Fechar',
  title: 'Crie seu cadastro de demonstração',
  lead: 'Quem se inscreve, onde e em que área. Os detalhes dos editais conferem seu perfil; as listas usam o exemplo da Dona Maria.',
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
    replaceTitle: 'Replace this browser’s account?',
    replaceLead:
      'Creating another account erases the current account, portfolio and saved calls in this browser.',
    confirmReplace: 'Erase and create account',
    cancel: 'Cancel',
    close: 'Close',
    title: 'Create your demo account',
    lead: 'Who applies, where and in which area. Call details check your profile; lists use Dona Maria’s example.',
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
