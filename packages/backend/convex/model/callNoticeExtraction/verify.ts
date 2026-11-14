import {
  ApplicantTypeEnum,
  ArtFormEnum,
  type ArtForm,
  type CallNoticeExtraction,
} from '@bratura/shared/entities/call-notice-extraction/entity';
import { requiredString, textLengths } from '@bratura/shared/primitives/code/string/fields';
import { requiredAmountInCents } from '@bratura/shared/primitives/domain/money/fields';
import { z } from 'zod';
import { amountAppearsInQuote, dateAppearsInQuote, sourcePassageForQuote } from '../llm/evidence';

// The model's answer is untrusted (`docs/security.md` §3): each value is parsed on its own, its
// quote replaced by the source passage it stands for, and the value checked against that passage.
// A value that fails is dropped and counted, never guessed.

const plain = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[–—−]/g, '-').toLowerCase();

/** Words that name each art form in a call notice; a value is kept only when its quote has one. */
const artFormWords: Record<ArtForm, string[]> = {
  any: ['qualquer', 'todas as linguagens', 'diversas linguagens', 'linguagens gerais'],
  music: [
    'music',
    'coral',
    'banda',
    'cantor',
    'canto',
    'violeiro',
    'repentista',
    'samba',
    'orquestra',
    'instrumental',
    'forro',
    'concerto',
  ],
  theatre: ['teatr', 'cenic', 'ator', 'atriz', 'atrizes', 'dramaturg'],
  dance: ['danc', 'coreograf'],
  circus: ['circ', 'palhac'],
  visualArts: ['artes visuais', 'artes plasticas'],
  audiovisual: ['audiovisual', 'cinema', 'filme'],
  literature: ['literat', 'livro', 'poesia', 'poeta', 'leitura', 'contacao', 'cordel', 'escritor'],
  crafts: ['artesanato', 'artesa'],
  popularCultures: [
    'popular',
    'tradicion',
    'mestre',
    'quadrilha',
    'junin',
    'capoeira',
    'quilombola',
    'afro',
    'indigena',
    'vaqueir',
    'maracatu',
    'reisado',
    'folguedo',
    'cultura viva',
  ],
  heritage: ['patrimoni', 'memoria', 'museu', 'acervo'],
  photography: ['fotograf'],
  design: ['design'],
  fashion: ['moda'],
  digitalCulture: ['digital'],
};

const quoted = <Shape extends z.ZodRawShape>(shape: Shape) =>
  z.object({ ...shape, quote: z.string() });

const answerSchemas = {
  isCreatorCall: quoted({ value: z.boolean() }),
  amountsPerProject: quoted({
    category: requiredString('long'),
    amountInCents: requiredAmountInCents,
  }),
  totalBudgetInCents: quoted({ value: requiredAmountInCents }),
  applicantTypes: quoted({ value: z.array(ApplicantTypeEnum).min(1) }),
  residenceRequirement: quoted({ value: requiredString('long') }),
  artForms: quoted({ value: ArtFormEnum }),
  requiredDocuments: quoted({ value: requiredString('long') }),
  evaluationCriteria: quoted({
    criterion: requiredString('long'),
    maxPoints: z.number().nonnegative().nullish(),
  }),
  registrationCloses: quoted({ date: z.iso.date() }),
};

export type VerifiedExtraction = Omit<
  CallNoticeExtraction,
  'callNoticeId' | 'documentHashes' | 'promptVersion' | 'extractedAt' | 'model'
>;

/** The values of a model's answer that its own quotes prove, against the text the model read. */
export function verifyExtractionAnswer(answer: unknown, text: string): VerifiedExtraction {
  const fields = z.record(z.string(), z.unknown()).catch({}).parse(answer);
  let valuesRefused = 0;

  function checked<Value extends { quote: string }>(
    raw: unknown,
    schema: z.ZodType<Value>,
    backs: (value: Value, passage: string) => boolean = () => true,
  ): Value | null {
    if (raw === null || raw === undefined) return null;
    const parsed = schema.safeParse(raw);
    const passage = parsed.success ? sourcePassageForQuote(parsed.data.quote, text) : null;
    if (!parsed.success || !passage || passage.length > textLengths.long) {
      valuesRefused += 1;
      return null;
    }
    if (!backs(parsed.data, passage)) {
      valuesRefused += 1;
      return null;
    }
    return { ...parsed.data, quote: passage };
  }

  function checkedList<Value extends { quote: string }>(
    raw: unknown,
    schema: z.ZodType<Value>,
    backs?: (value: Value, passage: string) => boolean,
  ): Value[] {
    if (!Array.isArray(raw)) {
      if (raw !== null && raw !== undefined) valuesRefused += 1;
      return [];
    }
    return raw.flatMap((item) => {
      const value = checked(item, schema, backs);
      return value ? [value] : [];
    });
  }

  const spaceless = (text: string) => plain(text).replace(/\s+/g, '');
  const isCreatorCall = checked(fields.isCreatorCall, answerSchemas.isCreatorCall);
  const amountsPerProject = checkedList(
    fields.amountsPerProject,
    answerSchemas.amountsPerProject,
    (f, q) => amountAppearsInQuote({ amountInCents: f.amountInCents, quote: q }),
  );
  const totalBudget = checked(fields.totalBudgetInCents, answerSchemas.totalBudgetInCents, (f, q) =>
    amountAppearsInQuote({ amountInCents: f.value, quote: q }),
  );
  const applicantTypes = checked(fields.applicantTypes, answerSchemas.applicantTypes);
  const residenceRequirement = checked(
    fields.residenceRequirement,
    answerSchemas.residenceRequirement,
    (f, q) => spaceless(q).includes(spaceless(f.value)),
  );
  const artForms = checkedList(fields.artForms, answerSchemas.artForms, (f, q) =>
    artFormWords[f.value].some((word) => plain(q).includes(word)),
  );
  const requiredDocuments = checkedList(fields.requiredDocuments, answerSchemas.requiredDocuments);
  const evaluationCriteria = checkedList(
    fields.evaluationCriteria,
    answerSchemas.evaluationCriteria,
  );
  const closes = checked(fields.registrationCloses, answerSchemas.registrationCloses, (f, q) =>
    dateAppearsInQuote({ date: f.date, quote: q }),
  );

  return {
    valuesRefused,
    isCreatorCall,
    amountsPerProject,
    totalBudget: totalBudget && { amountInCents: totalBudget.value, quote: totalBudget.quote },
    applicantTypes,
    residenceRequirement,
    // One item per art form: a repeated one keeps its first quote.
    artForms: artForms.filter(
      (form, index) => artForms.findIndex((other) => other.value === form.value) === index,
    ),
    requiredDocuments,
    evaluationCriteria: evaluationCriteria.map(({ criterion, maxPoints, quote }) => ({
      criterion,
      maxPoints: maxPoints ?? null,
      quote,
    })),
    registrationCloses: closes,
  };
}
