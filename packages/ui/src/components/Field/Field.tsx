import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

type FieldTexts = {
  label: string;
  /** Shown after the label of a field that may stay empty: "(opcional)". */
  optionalMark?: string;
  /** Help that stays visible under the control. */
  hint?: string;
  /** Why the value was refused; its presence marks the control invalid. */
  error?: string;
};

const CONTROL =
  'bt-control w-full rounded-xl border-2 border-muted-foreground bg-card px-3.5 py-2.5 ' +
  'font-body text-base text-foreground focus-ring ' +
  'aria-invalid:border-status-missing disabled:cursor-not-allowed disabled:opacity-60';

/** The ids a control points at with `aria-describedby`: its hint, then its error. */
function descriptionIds(id: string, { hint, error }: FieldTexts) {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

/**
 * A label, its control, the hint and the error, wired for a screen reader: the label names the
 * control and the hint and error describe it. The error is announced when it appears.
 */
function Field({
  id,
  texts,
  className = '',
  children,
}: {
  id: string;
  texts: FieldTexts;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`bt-field grid content-start gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-body text-small font-semibold">
        {texts.label}
        {texts.optionalMark && (
          <span className="font-normal text-muted-foreground"> {texts.optionalMark}</span>
        )}
      </label>
      <span className="bt-control-frame">
        {children}
        {/* A brush stroke under the control while it has focus. Decorative. */}
        <span className="bt-control-stroke" aria-hidden="true" />
      </span>
      {texts.hint && (
        <p id={`${id}-hint`} className="text-caption text-muted-foreground">
          {texts.hint}
        </p>
      )}
      {texts.error && (
        <p id={`${id}-error`} role="alert" className="bt-field-error text-caption font-semibold">
          {texts.error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-invalid'> & FieldTexts;

/** One line of text: a name, an e-mail, a date, a number typed as digits. */
export function TextField({
  label,
  optionalMark,
  hint,
  error,
  id,
  className,
  type = 'text',
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const texts = { label, optionalMark, hint, error };
  return (
    <Field id={controlId} texts={texts} className={className}>
      <input
        id={controlId}
        type={type}
        className={CONTROL}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds(controlId, texts)}
        {...props}
      />
    </Field>
  );
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'aria-invalid'> &
  FieldTexts;

/** Several lines of text: a biography, a description. */
export function TextAreaField({
  label,
  optionalMark,
  hint,
  error,
  id,
  className,
  rows = 4,
  ...props
}: TextAreaFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const texts = { label, optionalMark, hint, error };
  return (
    <Field id={controlId} texts={texts} className={className}>
      <textarea
        id={controlId}
        rows={rows}
        className={`${CONTROL} block resize-y`}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds(controlId, texts)}
        {...props}
      />
    </Field>
  );
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'aria-invalid'> &
  FieldTexts & {
    /** The `<option>`s, written by the caller: the copy and its order are the product's. */
    children: ReactNode;
  };

/** One choice from a list, as the platform's own select: keyboard and touch already work. */
export function SelectField({
  label,
  optionalMark,
  hint,
  error,
  id,
  className,
  children,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const texts = { label, optionalMark, hint, error };
  return (
    <Field id={controlId} texts={texts} className={className}>
      <select
        id={controlId}
        className={`${CONTROL} bt-select`}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds(controlId, texts)}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

/**
 * Controls that answer one question together (a list of checkboxes, a start and an end): the
 * legend names the group for a screen reader.
 */
export function Fieldset({
  legend,
  hint,
  error,
  className = '',
  children,
}: {
  legend: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className={`grid min-w-0 content-start gap-2 ${className}`}>
      <legend className="mb-1.5 font-body text-small font-semibold">{legend}</legend>
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
      {children}
      {error && (
        <p role="alert" className="bt-field-error text-caption font-semibold">
          {error}
        </p>
      )}
    </fieldset>
  );
}
