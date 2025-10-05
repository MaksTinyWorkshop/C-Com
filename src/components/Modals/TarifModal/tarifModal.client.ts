type ModalContent = {
  title?: string | null;
  content?: string | null;
};

type PlanConfig = {
  slug: string;
  moreInfoTitle: string | null;
  moreInfoContent: string | null;
};

type OptionConstraint = {
  min: number;
  max: number | null;
  step: number;
};

type TarifConfig = {
  defaultPlan: string;
  baseOptionIds: string[];
  videoOptionIds: string[];
  optionQuantities: Record<string, number>;
  optionConstraints: Record<string, OptionConstraint>;
  plans: PlanConfig[];
  modal: ModalContent | null;
};

const ROOT_SELECTOR = "[data-tarifs-root]";
const TRIGGER_SELECTOR = "[data-tarif-modal-trigger]";
const PLAN_CARD_SELECTOR = "[data-plan-card]";
const OPTION_CARD_SELECTOR = "[data-option-card]";

const clampQuantity = (value: number, min: number, max: number | null) => {
  const upper = typeof max === "number" ? max : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), upper);
};

const decodeConfig = (value: string | null | undefined): TarifConfig | null => {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as TarifConfig;
  } catch (error) {
    console.warn("Impossible d'analyser la configuration des tarifs", error);
    return null;
  }
};

const pickPlanSlug = (plans: Map<string, PlanConfig>, slug?: string | null) =>
  slug && plans.has(slug) ? slug : null;

const getConstraint = (
  config: TarifConfig,
  optionId: string,
  card: HTMLElement
): OptionConstraint => {
  const fallbackMinRaw = Number(card.dataset.min ?? "0");
  const fallbackMin = Number.isFinite(fallbackMinRaw) ? fallbackMinRaw : 0;

  const fallbackMaxRaw = card.dataset.max ? Number(card.dataset.max) : null;
  const fallbackMax =
    typeof fallbackMaxRaw === "number" && Number.isFinite(fallbackMaxRaw)
      ? fallbackMaxRaw
      : null;

  const fallbackStepRaw = Number(card.dataset.step ?? "1");
  const fallbackStep =
    Number.isFinite(fallbackStepRaw) && fallbackStepRaw > 0
      ? fallbackStepRaw
      : 1;

  const constraint = config.optionConstraints?.[optionId];
  const rawMin = constraint?.min;
  const rawMax = constraint?.max;
  const rawStep = constraint?.step;

  return {
    min:
      typeof rawMin === "number" && Number.isFinite(rawMin)
        ? rawMin
        : fallbackMin,
    max:
      typeof rawMax === "number" && Number.isFinite(rawMax)
        ? rawMax
        : fallbackMax,
    step:
      typeof rawStep === "number" && rawStep > 0
        ? rawStep
        : fallbackStep,
  };
};

const applyQuantityState = (
  card: HTMLElement,
  quantity: number,
  constraint: OptionConstraint
) => {
  const clamped = clampQuantity(quantity, constraint.min, constraint.max);
  const isDisabled = card.dataset.disabled === "true";
  card.dataset.quantity = String(clamped);
  card.dataset.selected = clamped > 0 ? "true" : "false";

  const valueNode = card.querySelector<HTMLElement>("[data-option-value]");
  if (valueNode) {
    valueNode.textContent = String(clamped);
  }

  const decrement = card.querySelector<HTMLButtonElement>("[data-option-decrement]");
  const increment = card.querySelector<HTMLButtonElement>("[data-option-increment]");
  const maxValue =
    constraint.max === null ? Number.POSITIVE_INFINITY : constraint.max;

  if (decrement) {
    decrement.disabled = isDisabled || clamped <= constraint.min;
  }

  if (increment) {
    if (isDisabled) {
      increment.disabled = true;
    } else if (maxValue === Number.POSITIVE_INFINITY) {
      increment.disabled = false;
    } else {
      increment.disabled = clamped >= maxValue;
    }
  }
};

const initialiseRoot = (root: HTMLElement) => {
  if (root.dataset.initialised === "true") {
    return;
  }

  const config = decodeConfig(root.dataset.config);
  if (!config) {
    return;
  }

  const planCards = Array.from(
    root.querySelectorAll<HTMLElement>(PLAN_CARD_SELECTOR)
  );
  const optionCards = Array.from(
    root.querySelectorAll<HTMLElement>(OPTION_CARD_SELECTOR)
  );
  const planDetails = new Map(config.plans.map((plan) => [plan.slug, plan]));

  const constraintsCache = new Map<string, OptionConstraint>();

  optionCards.forEach((card) => {
    const optionId = card.dataset.optionId ?? "";
    const constraint = getConstraint(config, optionId, card);
    constraintsCache.set(optionId, constraint);

    card.dataset.min = String(constraint.min);
    card.dataset.step = String(constraint.step);
    if (typeof constraint.max === "number") {
      card.dataset.max = String(constraint.max);
    } else {
      delete card.dataset.max;
    }

    const defaultQuantity = config.optionQuantities?.[optionId];
    const initialQuantity = clampQuantity(
      typeof defaultQuantity === "number"
        ? defaultQuantity
        : Number(card.dataset.quantity ?? constraint.min) || constraint.min,
      constraint.min,
      constraint.max
    );

    applyQuantityState(card, initialQuantity, constraint);
  });

  const quantityForCard = (card: HTMLElement) =>
    Number(card.dataset.quantity ?? "0") || 0;

  const updateActivePlan = () => {
    const hasBase = optionCards
      .filter((card) => card.dataset.optionType === "base")
      .some((card) => quantityForCard(card) > 0);

    const hasVideo = optionCards
      .filter((card) => card.dataset.optionType === "video")
      .some((card) => quantityForCard(card) > 0);

    let slug =
      pickPlanSlug(planDetails, config.defaultPlan) ??
      planCards[0]?.dataset.planSlug ??
      "";

    const simpleSlug = pickPlanSlug(planDetails, "csimple");
    const proSlug = pickPlanSlug(planDetails, "cpro");

    if (!hasBase && simpleSlug) {
      slug = simpleSlug;
    }

    if (hasVideo && proSlug) {
      slug = proSlug;
    }

    planCards.forEach((card) => {
      card.dataset.active = card.dataset.planSlug === slug ? "true" : "false";
    });

    return slug;
  };

  optionCards.forEach((card) => {
    if (card.dataset.disabled === "true") {
      return;
    }

    const optionId = card.dataset.optionId ?? "";
    const constraint = constraintsCache.get(optionId);
    if (!constraint) {
      return;
    }

    const step = Math.abs(constraint.step) || 1;

    const changeQuantity = (delta: number) => {
      const current = Number(card.dataset.quantity ?? "0") || 0;
      const next = clampQuantity(current + delta, constraint.min, constraint.max);
      if (next !== current) {
        applyQuantityState(card, next, constraint);
        updateActivePlan();
      }
    };

    const decrement = card.querySelector<HTMLButtonElement>(
      "[data-option-decrement]"
    );
    const increment = card.querySelector<HTMLButtonElement>(
      "[data-option-increment]"
    );

    decrement?.addEventListener("click", () => changeQuantity(-step));
    increment?.addEventListener("click", () => changeQuantity(step));
  });

  let modalRoot: HTMLElement | null = null;
  const modalId = root.dataset.modalId;
  if (modalId) {
    modalRoot = document.getElementById(modalId);
  }
  if (!modalRoot) {
    modalRoot = root.querySelector<HTMLElement>("[data-tarif-modal-root]");
  }

  const modalTitle = modalRoot?.querySelector<HTMLElement>("[data-modal-title]");
  const modalBody = modalRoot?.querySelector<HTMLElement>("[data-modal-body]");
  const closeButtons = modalRoot?.querySelectorAll<HTMLButtonElement>(
    "[data-modal-close]"
  );

  let lastFocused: HTMLElement | null = null;

  const renderModalContent = (slug: string) => {
    if (!modalRoot) return;
    const plan = planDetails.get(slug);
    const fallback = config.modal ?? {};
    const title = plan?.moreInfoTitle || fallback.title || "Plus d'informations";

    const pieces: string[] = [];
    if (plan?.moreInfoContent) pieces.push(plan.moreInfoContent);
    if (fallback.content) pieces.push(fallback.content);

    if (modalTitle) {
      modalTitle.textContent = title;
    }

    if (modalBody) {
      modalBody.innerHTML =
        pieces.join("") ||
        "<p>Aucune information complémentaire pour le moment.</p>";
    }
  };

  const closeModal = () => {
    if (!modalRoot) return;
    modalRoot.dataset.open = "false";
    modalRoot.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", handleKeydown);

    const target = lastFocused;
    lastFocused = null;
    target?.focus({ preventScroll: true });
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    }
  };

  const openModal = () => {
    if (!modalRoot) return;
    lastFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const slug = updateActivePlan();
    renderModalContent(slug);
    modalRoot.dataset.open = "true";
    modalRoot.setAttribute("aria-hidden", "false");
    document.addEventListener("keydown", handleKeydown);

    const focusTarget = modalRoot.querySelector<HTMLElement>(
      "[data-modal-close], button, a, input, select, textarea"
    );
    focusTarget?.focus({ preventScroll: true });
  };

  closeButtons?.forEach((button) => {
    button.addEventListener("click", () => closeModal());
  });

  modalRoot?.addEventListener("click", (event) => {
    if (event.target === modalRoot) {
      closeModal();
    }
  });

  const triggers = root.querySelectorAll<HTMLElement>(TRIGGER_SELECTOR);
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
    });
  });

  updateActivePlan();
  root.dataset.initialised = "true";
};

const initialiseAll = () => {
  document.querySelectorAll<HTMLElement>(ROOT_SELECTOR).forEach((root) => {
    initialiseRoot(root);
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseAll, { once: true });
} else {
  initialiseAll();
}
