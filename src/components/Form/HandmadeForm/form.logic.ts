// src/components/Form/HandmadeForm/form.logic.ts
const SECTION_SELECTOR = "[data-contact-section]";
const SELECT_SELECTOR = "[data-contact-select]";
const FORM_SELECTOR = "[data-formula-fields]";
const NUMBER_FIELD_SELECTOR = "[data-number-field]";
const FORM_ACTIVE_CLASS = "is-active";

const toFiniteOrNull = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clampNumeric = (value: number, min: number, max: number | null) => {
  const upper = typeof max === "number" ? max : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), upper);
};

const syncNumberField = (container: HTMLElement, rawValue: string | number | null | undefined) => {
  const input = container.querySelector<HTMLInputElement>('input[type="number"]');
  if (!input) return null;

  const min = toFiniteOrNull(container.dataset.min ?? input.min) ?? 0;
  const max = toFiniteOrNull(container.dataset.max ?? input.max);
  const step = toFiniteOrNull(container.dataset.step ?? input.step) ?? 1;

  const parsed = Number.parseFloat(String(rawValue ?? input.value ?? ""));
  let nextValue: number | null = Number.isFinite(parsed)
    ? clampNumeric(parsed, min, max)
    : null;

  input.value = nextValue === null ? "" : String(nextValue);
  container.dataset.value = input.value;

  container.querySelector<HTMLButtonElement>("[data-stepper-decrement]")!.disabled =
    nextValue === null ? true : nextValue <= min;

  const increment = container.querySelector<HTMLButtonElement>("[data-stepper-increment]");
  if (increment)
    increment.disabled = max !== null && nextValue !== null ? nextValue >= max : false;

  return { input, min, max, step, value: nextValue };
};

export const initialiseNumberField = (container: HTMLElement) => {
  if (container.dataset.numberFieldInitialised === "true") return;
  const input = container.querySelector<HTMLInputElement>('input[type="number"]');
  if (!input) return;
  syncNumberField(container, input.value);
  container
    .querySelector("[data-stepper-decrement]")
    ?.addEventListener("click", () =>
      syncNumberField(container, Number(input.value) - 1),
    );
  container
    .querySelector("[data-stepper-increment]")
    ?.addEventListener("click", () =>
      syncNumberField(container, Number(input.value) + 1),
    );
  container.dataset.numberFieldInitialised = "true";
};

/* ============================================================
   🧠 NOUVELLE PARTIE : Initialisation “intelligente” du formulaire
   ============================================================ */

const normalise = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const parseCountParam = (params: URLSearchParams, ...names: string[]) => {
  for (const name of names) {
    const raw = params.get(name);
    if (!raw) continue;
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed >= 0) return String(parsed);
  }
  return null;
};

const activateFormula = (
  forms: HTMLFormElement[],
  select: HTMLSelectElement | null,
  requestedId: string | null,
) => {
  const normalisedRequested = normalise(requestedId);
  const targetForm =
    forms.find((f) => normalise(f.dataset.formula) === normalisedRequested) ?? forms[0] ?? null;

  if (!targetForm) return;

  forms.forEach((f) => {
    const isTarget = f === targetForm;
    f.classList.toggle(FORM_ACTIVE_CLASS, isTarget);
    f.toggleAttribute("hidden", !isTarget);
  });

  if (select && targetForm.dataset.formula) select.value = targetForm.dataset.formula;
};

export const initContactForm = (section: HTMLElement) => {
  const select = section.querySelector<HTMLSelectElement>(SELECT_SELECTOR);
  const forms = Array.from(section.querySelectorAll<HTMLFormElement>(FORM_SELECTOR));
  const numberFields = Array.from(section.querySelectorAll<HTMLElement>(NUMBER_FIELD_SELECTOR));

  if (forms.length === 0) return;

  numberFields.forEach(initialiseNumberField);

  // Lire les paramètres d’URL
  const urlParams = new URLSearchParams(window.location.search);
  const requestedFormula = urlParams.get("formula") ?? urlParams.get("plan");
  const visualsValue = parseCountParam(urlParams, "visuals", "visuels");
  const videosValue = parseCountParam(urlParams, "videos", "video", "vidéos");

  // 🧩 Appliquer les valeurs trouvées
  if (visualsValue) {
    forms.forEach((form) => {
      const input = form.querySelector<HTMLInputElement>('input[name="visuals"]');
      if (input) {
        input.value = visualsValue;
        const container = input.closest<HTMLElement>(NUMBER_FIELD_SELECTOR);
        if (container) syncNumberField(container, visualsValue);
      }
    });
  }

  if (videosValue) {
    forms.forEach((form) => {
      const input = form.querySelector<HTMLInputElement>('input[name="videos"]');
      if (input) {
        input.value = videosValue;
        const container = input.closest<HTMLElement>(NUMBER_FIELD_SELECTOR);
        if (container) syncNumberField(container, videosValue);
      }
    });
  }

  // 🧩 Sélection automatique de la formule (depuis l’URL)
  activateFormula(forms, select, requestedFormula);

  // 🧩 Écoute le changement de formule manuellement
  if (select) {
    select.addEventListener("change", (e) => {
      const value = (e.target as HTMLSelectElement).value;
      activateFormula(forms, select, value);
    });
  }
};

/* ============================================================
   🧾 Collecte des données pour l’envoi
   ============================================================ */
export const collectContactData = (form: HTMLFormElement) => {
  const formData = new FormData(form);
  const fields: Record<string, string> = {};

  formData.forEach((value, key) => {
    fields[key] = typeof value === "string" ? value.trim() : String(value);
  });

  return {
    formula: form.dataset.formula ?? "",
    formulaLabel: form.dataset.formulaLabel ?? "",
    formulaValue: form.dataset.formulaValue ?? "",
    fields,
  };
};