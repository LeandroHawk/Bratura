# Product

The research and decisions behind what Bratura is, who it serves and who pays. Owner: **Atilio
Almeida (PO)**. The pitch-facing version lives in `README.md` and `MANIFEST.md`; the build plan in
`docs/plan.md`.

## The idea and the track

"Monte seu portfólio uma vez. A gente encontra as oportunidades, diz o que falta e prepara sua
inscrição." A copilot for individual creators (artisans, musicians, visual and performing artists,
cultural MEI) who cannot afford a producer or a project consultant.

- **Track fit** (Cultura & economia criativa, rule 5.2, eliminatory): "Projetos de criação,
  circulação ou consumo de cultura", including tools for artists and creators. Out of the track:
  "ferramentas de publicidade e marketing em geral", "automação de perfis e de engajamento
  artificial" and "projetos que reproduzam obras de terceiros sem autorização". So SWOT, sales
  strategy or a sales showcase are never the core, and **a portfolio holds the creator's own work**
  (they confirm authorship when adding an item). Food sellers and generic MEI are out of this track
  (they would fit Pagamentos & finanças).
- **The portfolio is the differentiator**: most calls ask for a portfolio or dated proof of
  activity; LinkedIn does not fit artisans; data the creator provides needs no scraping. The
  Instagram personal-account API is discontinued as far as known, so uploads are manual. Framed as
  proof for calls and fairs, not as marketing.

## Competitors (checked 2026-11-07)

| Who | What they do | The gap |
| --- | --- | --- |
| Prosas | Sells to funders; the applicant side is search + profile + a 150k network | No matching, explanation or preparation on its site |
| Mapa da Cultura | Lists calls | No filtering for a creator |
| Editalis | Free app, manual curation | Manual |
| A paid calls newsletter (artvsm, Substack) | Curated list | Proof that artists pay for this |
| Linguagem Simples (ÍRIS, Ceará government, 2023) | Manual plain-language rewrites of calls | Manual, one state |
| Sebrae | Free consulting | A partner, not a competitor |
| Abroad, from memory | Instrumentl, Submittable, CaFÉ | Not checked |

Sympla is ticketing, not a competitor; its producer API may be a sales channel later.

## Who pays

Decided 2026-11-09: **the creator never pays** (search, portfolio, gaps, the application kit and
alerts are free). Revenue is the **multi-profile panel** for artisan associations, cooperatives,
producers and project consultants; then **city and state culture departments** (more complete
applications, a demand map); **sponsors** looking for projects (Rouanet, ProAC) in phase 2. Not
doing: a share of the prize (may be forbidden in public calls; unverified) or selling creators' data.

**Charging the panel: AbacatePay (under study, 2026-11-13).** A monthly subscription per
organization whose quantity is the number of creators it follows (the "per managed profile" price
on the landing): AbacatePay subscriptions bill price × quantity by card or Pix Automático, its
hosted checkout needs no payment UI of ours, and `subscription.*` webhooks into `http.ts` turn the
panel on or off. Test mode needs no company verification and simulates payments, which the rules
allow for a demo (6.9); real charges need a CNPJ, a site with terms and privacy policy, and up to 3
business days of review. The creator side stays free: AbacatePay never touches a creator.

### Who else gains from a prepared creator (ideas to evaluate, 2026-11-13)

Only the panel is decided. The rule for every idea: the creator never pays, and whoever gains from a
prepared creator does. Each one should raise the impact, not compete with it.

| Idea | Who pays | Why | Risk |
| --- | --- | --- | --- |
| Formalization referral | Banks and accountants serving MEI (C6 Bank is a sponsor) | The "falta MEI" gap becomes a step to formalize with a partner: the creator leaves informality | A transparent partnership at the right gap, never an ad (the track excludes marketing) |
| A tool for whoever publishes calls | Culture departments, institutes, foundations, fairs | We already read calls: offer the reverse, a plain-language version, a clarity and accessibility check, how many eligible creators exist before publishing. Fewer wrong applications, more budget spent | Government buys slowly (procurement): start with institutes and private fairs |
| Exhibitor sign-up for fairs | Fair organizers | The artisan applies in one click with her portfolio; the organizer gets standard applications and collects the stand fee through AbacatePay split, with a share for us (organizers have a CNPJ) | Phase 2: needs partner fairs |
| Panel per managed profile (decided) | Associations, cooperatives, producers | The core; billed through AbacatePay (above) | — |
| Aggregated demand map | Government, Sebrae | Where eligible creators are without a call: guides public policy | Aggregated, anonymized data only (LGPD) |

## Evidence from people

Atilio is talking to real people (artisans' associations, creators, people who support them) to
test the problem and the panel. Record here who (role, not name, unless they agree), what they
said and what it changed: one real sentence in the video is worth more than a slide.

## Phases (pitch only)

Rouanet matchmaking; community-submitted fairs; more states; public pages per open call in plain
Portuguese, indexable, as the main acquisition channel (Search Console only after a definitive
domain); WhatsApp sign-up and portfolio.

**Rouanet facts for the pitch**: only companies under *lucro real* (up to 4% of income tax) and
individuals filing the full declaration (up to 6%) can deduct; MEI and Simples cannot. A
contribution counts only if made by 31/12 of that year. No current open data (`docs/data-sources.md`).

## Impact line

"R$ X em editais abertos que Y criadores estão aptos a disputar", computed from the stored calls and
matches, never estimated. Only figures with a source go into the video and the pitch.

## Open for brainstorming

Product ideas from anyone are welcome here. Open now:

- A "tribuna de honra" row for government (municipal, state, federal; Rouanet named neutrally,
  never as the main payer) and a "próxima temporada" line (an official tool inside Mapas Culturais;
  Brazil, then Latin America). Is internationalization a competition criterion?
- The logo slogan "o seu país com mais cultura" versus the video's closing line ("Bratura. O
  dinheiro da cultura chegando em quem cria."): one, the other, or both?
- A verified phone as the identity, without a password (`docs/integrations/whatsapp.md`).
- **AI crawlers**: blocked in `robots.txt` for now (2026-11-13), search engines allowed. Open:
  being found by AI search (ChatGPT, Perplexity, Claude) versus being used for training; the two can
  be split per crawler.
