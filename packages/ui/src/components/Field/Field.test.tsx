import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Fieldset, SelectField, TextAreaField, TextField } from './Field';

describe('TextField', () => {
  it('names the input by its label', () => {
    const html = renderToStaticMarkup(<TextField id="name" label="Nome completo" />);
    expect(html).toContain('<label for="name"');
    expect(html).toContain('<input id="name" type="text"');
  });

  it('is not marked invalid or described while there is nothing to say', () => {
    const html = renderToStaticMarkup(<TextField id="name" label="Nome" />);
    expect(html).not.toContain('aria-invalid=');
    expect(html).not.toContain('aria-describedby=');
  });

  it('describes the input with the hint, then the error, and announces the error', () => {
    const html = renderToStaticMarkup(
      <TextField id="cpf" label="CPF" hint="Só os números" error="Digite um CPF válido" />,
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="cpf-hint cpf-error"');
    expect(html).toMatch(/<p id="cpf-error" role="alert"[^>]*>Digite um CPF válido<\/p>/);
  });

  it('gives itself an id when none comes, so the label always points somewhere', () => {
    const html = renderToStaticMarkup(<TextField label="Cidade" />);
    const id = html.match(/<label for="([^"]+)"/)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`<input id="${id}"`);
  });

  it('says in text that a field may stay empty', () => {
    const html = renderToStaticMarkup(<TextField label="Site" optionalMark="(opcional)" />);
    expect(html).toContain('(opcional)');
  });
});

describe('SelectField and TextAreaField', () => {
  it('render the platform’s own controls', () => {
    const select = renderToStaticMarkup(
      <SelectField id="uf" label="Estado" defaultValue="CE">
        <option value="CE">Ceará</option>
      </SelectField>,
    );
    expect(select).toMatch(/<select id="uf"[^>]*>/);
    expect(renderToStaticMarkup(<TextAreaField id="bio" label="Biografia" />)).toMatch(
      /<textarea id="bio" rows="4"/,
    );
  });
});

describe('Fieldset', () => {
  it('names the group with a legend', () => {
    const html = renderToStaticMarkup(<Fieldset legend="Áreas secundárias">x</Fieldset>);
    expect(html).toMatch(/^<fieldset[^>]*><legend[^>]*>Áreas secundárias<\/legend>/);
  });
});
