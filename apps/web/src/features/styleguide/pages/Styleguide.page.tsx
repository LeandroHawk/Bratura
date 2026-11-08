import { Badge, Button, Card, COLOR_TOKENS, Container, Eyebrow, Heading, Logo } from '@bratura/ui';

const THEMES = [
  { id: 'light', name: 'Claro · Acervo' },
  { id: 'dark', name: 'Escuro · Galeria' },
] as const;

/** Living reference for @bratura/ui: every block renders once per theme, side by side. */
export function StyleguidePage() {
  return (
    <Container as="main" className="grid gap-8 py-12">
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
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
                {COLOR_TOKENS.map((token) => (
                  <li key={token.name} className="grid gap-1 text-xs">
                    <span
                      className="block h-12 rounded-xl border border-border"
                      style={{ background: `var(--bt-${token.name})` }}
                    />
                    <span className="font-semibold">{token.label}</span>
                    <code className="text-muted-foreground">--bt-{token.name}</code>
                  </li>
                ))}
              </ul>
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
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="open">Aberto até 12/12</Badge>
                <Badge tone="soon">Prazo curto</Badge>
                <Badge tone="missing">Falta: CCMEI</Badge>
              </div>
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
