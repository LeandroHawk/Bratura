import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Checkbox, Collapse, SelectField, TextAreaField, TextField, type Theme } from '@bratura/ui';
import { StyleguideBlock } from '@/features/styleguide/pages/sections/common/StyleguideBlock';
import { FORMS_CONTENT } from './content';
import { DialogExample } from './DialogExample';

/** Fields, a checkbox, the dialog and the drawers; `theme` keeps each panel's field names apart. */
export function Forms({ locale, theme }: { locale: Locale; theme: Theme }) {
  const content = FORMS_CONTENT[locale];
  return (
    <StyleguideBlock title={content.title}>
      <TextField label={content.name} name={`name-${theme}`} hint={content.nameHint} />
      <TextField
        label={content.cpf}
        name={`cpf-${theme}`}
        defaultValue="111.111.111-11"
        error={content.cpfError}
      />
      <SelectField label={content.state} name={`state-${theme}`} defaultValue="CE">
        <option value="CE">Ceará</option>
        <option value="PE">Pernambuco</option>
      </SelectField>
      <TextAreaField
        label={content.bio}
        optionalMark={content.optional}
        name={`bio-${theme}`}
        rows={2}
      />
      <Checkbox name={`reminder-${theme}`} defaultChecked>
        {content.reminder}
      </Checkbox>
      <div>
        <DialogExample copy={content.dialog} />
      </div>
      <Collapse title={content.collapse.closedTitle} count={2}>
        <p className="text-small">{content.collapse.closedBody}</p>
      </Collapse>
      <Collapse title={content.collapse.openTitle} count={3} defaultOpen>
        <p className="text-small">{content.collapse.openBody}</p>
      </Collapse>
    </StyleguideBlock>
  );
}
