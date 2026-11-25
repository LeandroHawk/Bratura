'use client';

import type { PortfolioItem } from '@bratura/shared/entities/portfolio-item/entity';
import type { ParsedWithMessages } from '@bratura/shared/messages/messages';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button, Dialog, Heading } from '@bratura/ui';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { removePortfolioItem, setPortfolioItem } from '@/features/common/data/demoStore';
import { PORTFOLIO_COMMON_CONTENT } from './content';
import type { FormField } from './form-fields';
import { RecordDetails } from './RecordDetails';
import { RecordFormDialog } from './RecordFormDialog';

export type PortfolioItemsCopy = {
  title: string;
  lead: string;
  empty: string;
  add: string;
  edit: string;
  fields: Record<string, string>;
};

type OpenDialog<Item> = { mode: 'create' | 'edit' | 'view'; values: Partial<Item> };

/**
 * One kind of portfolio item as a list the creator adds to, reads, edits and deletes. The kind
 * gives its fields, its copy and how a row sums an item up; the rest is the same for every kind.
 */
export function PortfolioItemsSection<Item extends PortfolioItem>({
  locale,
  id,
  kind,
  copy,
  items,
  fields,
  parse,
  rowFromItem,
}: {
  locale: Locale;
  id: string;
  kind: Item['kind'];
  copy: PortfolioItemsCopy;
  items: Item[];
  fields: FormField[];
  parse: (values: Record<string, unknown>) => ParsedWithMessages<Item>;
  rowFromItem: (item: Item) => { title: string; meta: (string | null)[]; badge?: ReactNode };
}) {
  const content = PORTFOLIO_COMMON_CONTENT[locale];
  const [dialog, setDialog] = useState<OpenDialog<Item> | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const titleId = `${id}-title`;
  const close = () => setDialog(null);

  return (
    <section id={id} aria-labelledby={titleId} className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <Heading id={titleId} size="card">
            {copy.title}
          </Heading>
          <p className="max-w-[60ch] text-muted-foreground">{copy.lead}</p>
        </div>
        <Button
          size="sm"
          className="print:hidden"
          onClick={() =>
            // The id is made once, when the form opens: a second click on save writes one item.
            setDialog({
              mode: 'create',
              values: { kind, clientItemId: crypto.randomUUID() } as Partial<Item>,
            })
          }
        >
          {copy.add}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-muted-foreground p-5 text-muted-foreground">
          {copy.empty}
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {items.map((item, index) => {
            const row = rowFromItem(item);
            const isRemoving = removingId === item.clientItemId;
            return (
              <li
                key={item.clientItemId}
                className="rise-in flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4"
                style={{ '--rise-index': Math.min(index, 8) } as CSSProperties}
              >
                <div className="grid min-w-0 gap-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Heading as="h3" size="item">
                      {row.title}
                    </Heading>
                    {row.badge}
                  </div>
                  <p className="text-small text-muted-foreground">
                    {row.meta.filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 print:hidden">
                  {isRemoving ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          removePortfolioItem(item.clientItemId);
                          setRemovingId(null);
                        }}
                      >
                        {content.confirmRemove}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRemovingId(null)}>
                        {content.cancel}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`${content.view}: ${row.title}`}
                        onClick={() => setDialog({ mode: 'view', values: item })}
                      >
                        {content.view}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`${content.edit}: ${row.title}`}
                        onClick={() => setDialog({ mode: 'edit', values: item })}
                      >
                        {content.edit}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`${content.remove}: ${row.title}`}
                        onClick={() => setRemovingId(item.clientItemId)}
                      >
                        {content.remove}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {dialog?.mode === 'view' && (
        <Dialog
          open
          onClose={close}
          title={rowFromItem(dialog.values as Item).title}
          closeLabel={content.close}
        >
          <RecordDetails
            locale={locale}
            fields={fields}
            labels={copy.fields}
            values={dialog.values}
          />
          <div>
            <Button variant="ghost" onClick={() => setDialog({ ...dialog, mode: 'edit' })}>
              {content.edit}
            </Button>
          </div>
        </Dialog>
      )}
      {dialog && dialog.mode !== 'view' && (
        <RecordFormDialog
          key={dialog.values.clientItemId}
          locale={locale}
          title={dialog.mode === 'create' ? copy.add : copy.edit}
          fields={fields}
          labels={copy.fields}
          initialValues={dialog.values}
          // The kind and the id are not typed by anyone: they come from the item being edited.
          parse={(values) => parse({ ...dialog.values, ...values })}
          onSave={setPortfolioItem}
          onClose={close}
        />
      )}
    </section>
  );
}
