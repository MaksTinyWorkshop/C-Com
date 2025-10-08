const SECTION_SELECTOR = "[data-contact-section]";
const SELECT_SELECTOR = "[data-contact-select]";
const FORM_SELECTOR = "[data-formula-fields]";
const NUMBER_FIELD_SELECTOR = "[data-number-field]";
const FORM_ACTIVE_CLASS = "is-active";
const CONTACT_ENDPOINT = import.meta.env.PUBLIC_CONTACT_ENDPOINT;

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const findFieldElement = (form: HTMLFormElement, name: string): HTMLElement | null => {
  const element = form.elements.namedItem(name);

  if (!element) {
    return null;
  }

  if (element instanceof RadioNodeList) {
    for (const node of Array.from(element)) {
      if (node instanceof HTMLElement) {
        return node;
      }
    }
    return null;
  }

  return element instanceof HTMLElement ? element : null;
};

const isPhoneField = (id: string, label: string) => {
  const target = `${id} ${label}`.toLowerCase();
  return target.includes("phone") || target.includes("téléphone") || target.includes("telephone");
};

const formatPhoneValue = (rawValue: string) => {
  const collapsed = collapseWhitespace(rawValue);
  if (!collapsed) {
    return "";
  }

  return collapsed.startsWith("'") ? collapsed : `'${collapsed}`;
};

const normalise = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const toFiniteOrNull = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clampNumeric = (value: number, min: number, max: number | null) => {
  const upper = typeof max === "number" ? max : Number.POSITIVE_INFINITY;

  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), upper);
};

type NumberFieldState = {
  input: HTMLInputElement;
  min: number;
  max: number | null;
  step: number;
  value: number | null;
};

const syncNumberField = (
  container: HTMLElement,
  rawValue: string | number | null | undefined,
): NumberFieldState | null => {
  const input = container.querySelector<HTMLInputElement>('input[type="number"]');
  if (!input) {
    return null;
  }

  const min = toFiniteOrNull(container.dataset.min ?? input.min) ?? 0;
  const max = toFiniteOrNull(container.dataset.max ?? input.max);
  const step = toFiniteOrNull(container.dataset.step ?? input.step) ?? 1;

  const rawString = rawValue ?? input.value ?? "";
  const parsed = Number.parseFloat(String(rawString));

  let nextValue: number | null = null;

  if (Number.isFinite(parsed)) {
    nextValue = clampNumeric(parsed, min, max);
    input.value = String(nextValue);
  } else if (rawString === "" || rawString === null) {
    input.value = "";
  } else {
    const fallback = toFiniteOrNull(input.value);
    nextValue = clampNumeric(fallback ?? min, min, max);
    input.value = String(nextValue);
  }

  container.dataset.value = nextValue === null ? "" : String(nextValue);

  const decrement = container.querySelector<HTMLButtonElement>("[data-stepper-decrement]");
  if (decrement) {
    decrement.disabled = nextValue === null ? true : nextValue <= min;
  }

  const increment = container.querySelector<HTMLButtonElement>("[data-stepper-increment]");
  if (increment) {
    if (nextValue === null) {
      increment.disabled = false;
    } else {
      increment.disabled =
        max !== null && typeof nextValue === "number" ? nextValue >= max : false;
    }
  }

  return { input, min, max, step, value: nextValue };
};

const applyDelta = (container: HTMLElement, direction: number) => {
  const state =
    syncNumberField(container, container.dataset.value ?? null) ?? syncNumberField(container, null);
  if (!state) return;

  const { input, min, max, step, value } = state;

  if (value === null && direction < 0) {
    return;
  }

  const base = value === null ? min : value;
  const next = clampNumeric(base + direction * step, min, max);

  if (value !== null && next === value) {
    return;
  }

  syncNumberField(container, next);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

const initialiseNumberField = (container: HTMLElement) => {
  if (container.dataset.numberFieldInitialised === "true") {
    return;
  }

  const input = container.querySelector<HTMLInputElement>('input[type="number"]');
  if (!input) {
    return;
  }

  syncNumberField(container, input.value);

  const decrement = container.querySelector<HTMLButtonElement>("[data-stepper-decrement]");
  const increment = container.querySelector<HTMLButtonElement>("[data-stepper-increment]");

  decrement?.addEventListener("click", () => applyDelta(container, -1));
  increment?.addEventListener("click", () => applyDelta(container, 1));

  input.addEventListener("input", () => {
    syncNumberField(container, input.value);
  });

  input.addEventListener("blur", () => {
    if (input.value === "") {
      syncNumberField(container, "");
    } else {
      syncNumberField(container, input.value);
    }
  });

  container.dataset.numberFieldInitialised = "true";
};

const setFieldValue = (
  forms: HTMLFormElement[],
  fieldName: string,
  rawValue: string | number | null,
) => {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return;
  }

  const value = String(rawValue);

  forms.forEach((form) => {
    const field = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `[name="${fieldName}"]`,
    );

    if (!field) return;

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      field.value = value;
    } else if (field instanceof HTMLSelectElement) {
      const hasOption = Array.from(field.options).some((option) => option.value === value);
      if (!hasOption) {
        return;
      }
      field.value = value;
    }

    const container = field.closest<HTMLElement>(NUMBER_FIELD_SELECTOR);
    if (container) {
      syncNumberField(container, value);
    }
  });
};

const parseCountParam = (params: URLSearchParams, ...names: string[]) => {
  for (const name of names) {
    const raw = params.get(name);
    if (!raw) continue;

    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return String(parsed);
    }
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
    forms.find((form) => normalise(form.dataset.formula) === normalisedRequested) ?? forms[0] ?? null;

  if (!targetForm) return;

  forms.forEach((form) => {
    const isTarget = form === targetForm;
    form.classList.toggle(FORM_ACTIVE_CLASS, isTarget);
    if (isTarget) {
      form.removeAttribute("hidden");
    } else {
      form.setAttribute("hidden", "");
    }
  });

  if (select && targetForm.dataset.formula) {
    select.value = targetForm.dataset.formula;
  }
};

const buildContactPayload = (form: HTMLFormElement) => {
  const rawFormulaId = form.dataset.formula ?? "";
  const formulaId = rawFormulaId.trim();

  if (!formulaId) {
    return null;
  }

  const formulaLabel = (form.dataset.formulaLabel ?? "").trim();
  const formData = new FormData(form);

  const fields: Record<string, string> = {};
  const entries: Array<{ id: string; label: string; value: string }> = [];

  formData.forEach((value, key) => {
    const trimmedKey = typeof key === "string" ? key.trim() : "";
    if (!trimmedKey) {
      return;
    }

    const fieldElement = findFieldElement(form, trimmedKey);
    const rawLabel = fieldElement?.dataset?.fieldLabel ?? trimmedKey;
    const label = collapseWhitespace(rawLabel) || trimmedKey;

    const baseValue =
      typeof value === "string"
        ? collapseWhitespace(value)
        : value instanceof File
          ? value.name
          : value === undefined || value === null
            ? ""
            : collapseWhitespace(String(value));

    const formattedValue = isPhoneField(trimmedKey, label) ? formatPhoneValue(baseValue) : baseValue;

    fields[label] = formattedValue;
    entries.push({ id: trimmedKey, label, value: formattedValue });
  });

  return {
    formulaId,
    formulaLabel,
    fields,
    entries,
  };
};

const buildContactRequest = (payload: ReturnType<typeof buildContactPayload>) => {
  if (!payload) {
    throw new Error("Invalid contact payload");
  }

  if (!CONTACT_ENDPOINT) {
    throw new Error("PUBLIC_CONTACT_ENDPOINT is not set");
  }

  const endpointUrl = new URL(CONTACT_ENDPOINT, window.location.href);
  const isCrossOrigin = endpointUrl.origin !== window.location.origin;

  const requestInit: RequestInit = {
    method: "POST",
  };

  if (isCrossOrigin) {
    requestInit.mode = "cors";
    requestInit.credentials = "omit";
  }

  requestInit.body = JSON.stringify(payload);
  requestInit.headers = {
    "Content-Type": "application/json",
  };

  return { requestInit };
};

const bindContactFormSubmission = (forms: HTMLFormElement[]) => {
  forms.forEach((form) => {
    if (form.dataset.contactSubmitBound === "true") {
      return;
    }

    form.dataset.contactSubmitBound = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector<HTMLButtonElement>(".submit-button");
      const successMessage = form.querySelector<HTMLElement>("[data-form-success]");
      const errorMessage = form.querySelector<HTMLElement>("[data-form-error]");
      const numberFields = Array.from(
        form.querySelectorAll<HTMLElement>(NUMBER_FIELD_SELECTOR),
      );

      successMessage?.setAttribute("hidden", "");
      errorMessage?.setAttribute("hidden", "");

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.loading = "true";
      }

      try {
        if (!CONTACT_ENDPOINT) {
          throw new Error("PUBLIC_CONTACT_ENDPOINT is not set");
        }

        const payload = buildContactPayload(form);
        const { requestInit } = buildContactRequest(payload);
        const response = await fetch(CONTACT_ENDPOINT, requestInit);

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Réponse invalide du serveur");
        }

        form.reset();
        numberFields.forEach((container) => {
          syncNumberField(container, "");
        });
        successMessage?.removeAttribute("hidden");
      } catch (error) {
        console.error("contact form submit failed", error);
        errorMessage?.removeAttribute("hidden");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          delete submitButton.dataset.loading;
        }
      }
    });
  });
};

const initialiseSection = (section: HTMLElement) => {
  if (section.dataset.contactFormInitialised === "true") {
    return;
  }

  const select = section.querySelector<HTMLSelectElement>(SELECT_SELECTOR);
  const forms = Array.from(section.querySelectorAll<HTMLFormElement>(FORM_SELECTOR));
  const numberFields = Array.from(section.querySelectorAll<HTMLElement>(NUMBER_FIELD_SELECTOR));

  if (forms.length === 0) {
    section.dataset.contactFormInitialised = "true";
    return;
  }

  numberFields.forEach(initialiseNumberField);
  bindContactFormSubmission(forms);

  const urlParams = new URLSearchParams(window.location.search);
  const requestedFormulaParam = urlParams.get("formula") ?? urlParams.get("plan");

  const visualsValue = parseCountParam(urlParams, "visuals", "visuels");
  const videosValue = parseCountParam(urlParams, "videos", "video", "vidéos");

  if (visualsValue) {
    setFieldValue(forms, "visuals", visualsValue);
  }

  if (videosValue) {
    setFieldValue(forms, "videos", videosValue);
  }

  if (select) {
    select.addEventListener("change", (event) => {
      const value = event.target instanceof HTMLSelectElement ? event.target.value : "";
      if (value) {
        activateFormula(forms, select, value);
      }
    });
  }

  const initialFormulaId =
    (requestedFormulaParam &&
      forms.find((form) => normalise(form.dataset.formula) === normalise(requestedFormulaParam))
        ?.dataset.formula) ??
    (select?.value ?? forms[0]?.dataset.formula ?? null);

  activateFormula(forms, select ?? null, initialFormulaId);

  section.dataset.contactFormInitialised = "true";
};

const initialiseAll = () => {
  document
    .querySelectorAll<HTMLElement>(SECTION_SELECTOR)
    .forEach((section) => initialiseSection(section));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseAll, { once: true });
} else {
  initialiseAll();
}

export {};
