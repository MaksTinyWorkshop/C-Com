import type { FormField } from "@app-types/form";

export interface FormGroupLayout {
  title: string;
  rows: string[][];
}

export interface FormGroupDefinition {
  title: string;
  rows: FormField[][];
}

export interface BuildGroupOptions {
  layout?: FormGroupLayout[];
  includeRemainingFields?: boolean;
  remainingGroupTitle?: string;
}

const BASE_LAYOUT: FormGroupLayout[] = [
  {
    title: "Vous",
    rows: [
      ["lastName", "firstName"],
      ["email"],
      ["phone"],
    ],
  },
  {
    title: "Votre entreprise",
    rows: [
      ["industry"],
      ["company"],
      ["city"],
      ["address"],
      ["postalCode"],
      ["siret"],
    ],
  },
  {
    title: "C'Com",
    rows: [
      ["visuals", "videos"],
      ["commitmentDuration"],
      ["customRequest"],
    ],
  },
];

const DEFAULT_OPTIONS: Required<BuildGroupOptions> = {
  layout: BASE_LAYOUT,
  includeRemainingFields: true,
  remainingGroupTitle: "Informations complémentaires",
};

export const buildFormGroups = (
  fields: FormField[],
  options: BuildGroupOptions = {},
): FormGroupDefinition[] => {
  const { layout, includeRemainingFields, remainingGroupTitle } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const fieldById = new Map(fields.map((field) => [field.id, field]));
  const assignedIds = new Set<string>();

  const groups: FormGroupDefinition[] = layout
    .map(({ title, rows }) => {
      const resolvedRows = rows
        .map((ids) =>
          ids
            .map((id) => {
              const field = fieldById.get(id);
              if (field) assignedIds.add(id);
              return field;
            })
            .filter((field): field is FormField => Boolean(field)),
        )
        .filter((row) => row.length > 0);

      if (resolvedRows.length === 0) {
        return null;
      }

      return { title, rows: resolvedRows };
    })
    .filter((group): group is FormGroupDefinition => group !== null);

  if (includeRemainingFields) {
    const remainingFields = fields.filter((field) => !assignedIds.has(field.id));

    if (remainingFields.length > 0) {
      groups.push({
        title: remainingGroupTitle,
        rows: remainingFields.map((field) => [field]),
      });
    }
  }

  return groups;
};

export type {
  FormGroupLayout as FormGroupConfig,
  BuildGroupOptions,
  FormGroupDefinition,
};
