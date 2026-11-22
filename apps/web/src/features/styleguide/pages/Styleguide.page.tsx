import {
  Badge,
  Button,
  Card,
  Checkbox,
  COLOR_TOKENS,
  Container,
  Eyebrow,
  Heading,
  Logo,
  SelectField,
  Tag,
  TextAreaField,
  TextField,
} from '@bratura/ui';
import { MAIN_CONTENT_ID } from '@/features/common/components/layout/mainContentId';
import { COLOR_GROUP_LABEL, COLOR_TOKEN_LABEL } from './content';
import { DialogExample } from './DialogExample';

/** Token groups in the order tokens.ts lists them. */
const COLOR_GROUPS = [...new Set(COLOR_TOKENS.map((token) => token.group))];

const THEMES = [
  { id: 'light', name: 'Claro · Acervo' },
  { id: 'dark', name: 'Escuro · Galeria' },
] as const;

/** Living reference for @bratura/ui: every block renders once per theme, side by side. */
export function StyleguidePage() {
  return (
    <Container as="main" id={MAIN_CONTENT_ID} className="grid gap-8 py-12">
      <div className="grid gap-2">
        <Heading as="h1" size="section">
          Design system
        </Heading>
        <p className="max-w-[64ch] text-muted-foreground">
          Componentes de <code>@bratura/ui</code>. O claro é o padrão e o escuro aparece quando
          alguém puxa a corda; aqui os dois aparecem lado a lado. Os contrastes de texto são
          verificados nos testes do pacote.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {THEMES.map((theme) => (
          <section
            key={theme.id}
            data-theme={theme.id}
            aria-labelledby={`tema-${theme.id}`}
            className="grid content-start gap-8 rounded-3xl border border-border bg-background p-6 text-foreground"
          >
            <Heading id={`tema-${theme.id}`} size="card">
              {theme.name}
            </Heading>

            <div className="grid justify-items-center gap-4 py-4">
              <Logo className="text-6xl" />
            </div>

            <div className="grid gap-3">
              <Eyebrow as="span">Cores</Eyebrow>
              {COLOR_GROUPS.map((group) => (
                <div key={group} className="grid gap-2">
                  <p className="font-display text-small italic">{COLOR_GROUP_LABEL[group]}</p>
                  <ul className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
                    {COLOR_TOKENS.filter((token) => token.group === group).map((token) => (
                      <li key={token.name} className="grid gap-1 text-xs">
                        <span
                          className="block h-12 rounded-xl border border-border"
                          style={{ background: `var(--bt-${token.name})` }}
                        />
                        <span className="font-semibold">{COLOR_TOKEN_LABEL[token.name]}</span>
                        <code className="text-muted-foreground">--bt-{token.name}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="grid gap-3">
              <Eyebrow as="span">Tipografia</Eyebrow>
              <Heading as="p" size="section">
                Fraunces nos títulos
              </Heading>
              <p className="font-display text-lg italic">Fraunces itálico nas legendas</p>
              <p>Instrument Sans no texto corrido, feito para ler bem em qualquer tela.</p>
              <Eyebrow>Etiqueta (Eyebrow)</Eyebrow>
            </div>

            <div className="grid gap-3">
              <Eyebrow as="span">Botões e selos</Eyebrow>
              <div className="flex flex-wrap gap-3">
                <Button>Começar meu acervo</Button>
                <Button variant="ghost">Ver editais abertos</Button>
                <Button variant="ghost" size="sm">
                  Botão pequeno
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="open">Aberto até 12/12</Badge>
                <Badge tone="soon">Prazo curto</Badge>
                <Badge tone="missing">Falta: CCMEI</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Tag>Portfólio</Tag>
                <Tag>SICAB</Tag>
                <Tag size="md">Kit de inscrição</Tag>
              </div>
            </div>

            <div className="grid gap-3">
              <Eyebrow as="span">Formulários</Eyebrow>
              <TextField
                label="Nome completo"
                name={`nome-${theme.id}`}
                hint="Como está no seu documento."
              />
              <TextField
                label="CPF"
                name={`cpf-${theme.id}`}
                defaultValue="111.111.111-11"
                error="Confira o CPF: os dígitos não batem."
              />
              <SelectField label="Estado" name={`estado-${theme.id}`} defaultValue="CE">
                <option value="CE">Ceará</option>
                <option value="PE">Pernambuco</option>
              </SelectField>
              <TextAreaField
                label="Biografia"
                optionalMark="(opcional)"
                name={`biografia-${theme.id}`}
                rows={2}
              />
              <Checkbox name={`lembrete-${theme.id}`} defaultChecked>
                Lembrar do prazo de inscrição
              </Checkbox>
              <div>
                <DialogExample />
              </div>
            </div>

            <div className="grid gap-3">
              <Eyebrow as="span">Movimento</Eyebrow>
              <ul className="grid grid-cols-3 gap-3">
                {['rise-in', 'um depois', 'do outro'].map((text, index) => (
                  <li
                    key={text}
                    className="rise-in rounded-xl border border-border bg-card p-3 text-small"
                    style={{ '--rise-index': index } as React.CSSProperties}
                  >
                    {text}
                  </li>
                ))}
              </ul>
              <p className="text-small text-muted-foreground">
                Itens de uma lista sobem um após o outro; o campo ganha uma pincelada ao receber
                foco e treme ao ser recusado; o botão salvo dá um pulo. Tudo desliga com
                &quot;reduzir movimento&quot;.
              </p>
            </div>

            <Card className="grid gap-1">
              <Heading as="p" size="item">
                Card
              </Heading>
              <span className="text-muted-foreground">
                Superfície para um edital, uma peça do acervo, um aviso.
              </span>
            </Card>
          </section>
        ))}
      </div>
    </Container>
  );
}
