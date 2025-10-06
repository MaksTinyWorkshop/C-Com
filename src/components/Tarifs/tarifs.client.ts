const ROOT_SELECTOR = "[data-tarifs-root]";
const PLAN_CARD_SELECTOR = "[data-plan-card]";
const OPTION_CARD_SELECTOR = "[data-option-card]";
const OPTION_VALUE_SELECTOR = "[data-option-value]";
const OPTION_DECREMENT_SELECTOR = "[data-option-decrement]";
const OPTION_INCREMENT_SELECTOR = "[data-option-increment]";
const MODAL_TRIGGER_SELECTOR = "[data-tarif-modal-trigger]";

const PLAN_CHANGE_EVENT = "tarif:plan-change";
const MODAL_OPEN_EVENT = "tarif:modal-open";

interface PlanConfig {
  slug: string;
  badge: string | null;
  moreInfoTitle: string | null;
  moreInfoContent: string | null;
}

interface OptionConstraint {
  min: number;
  max: number | null;
  step: number;
}

interface TarifConfig {
  defaultPlan: string;
  baseOptionIds: string[];
  videoOptionIds: string[];
  optionQuantities: Record<string, number>;
  optionConstraints: Record<string, OptionConstraint>;
  plans: PlanConfig[];
}

interface PlanDetailPayload {
  slug: string;
  badge: string | null;
  moreInfoTitle: string | null;
  moreInfoContent: string | null;
}

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

const updateDisplayedPrice = (card: HTMLElement, quantity: number) => {
  const priceNode = card.querySelector<HTMLElement>("[data-option-price]");
  if (!priceNode) return;

  const unitAttr = priceNode.dataset.unitPrice;
  const fallback = priceNode.dataset.priceFallback ?? priceNode.textContent ?? "";

  if (!unitAttr) {
    if (quantity <= 0 && fallback) {
      priceNode.textContent = fallback;
    }
    return;
  }

  const unit = Number(unitAttr);
  if (!Number.isFinite(unit)) {
    return;
  }

  if (quantity <= 0) {
    const suffix = priceNode.dataset.priceSuffix ?? "";
    priceNode.textContent = suffix ? `0${suffix}` : fallback;
    return;
  }

  const suffix = priceNode.dataset.priceSuffix ?? "";
  const total = unit * quantity;
  priceNode.textContent = `${total}${suffix}`;
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

  const valueNode = card.querySelector<HTMLElement>(OPTION_VALUE_SELECTOR);
  if (valueNode) {
    valueNode.textContent = String(clamped);
  }

  const decrement = card.querySelector<HTMLButtonElement>(
    OPTION_DECREMENT_SELECTOR
  );
  const increment = card.querySelector<HTMLButtonElement>(
    OPTION_INCREMENT_SELECTOR
  );
  const maxValue = constraint.max === null ? Number.POSITIVE_INFINITY : constraint.max;

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

  updateDisplayedPrice(card, clamped);
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
  const planDetails = new Map<string, PlanConfig>(
    (config.plans || []).map((plan) => [plan.slug, plan])
  );

  const constraintsCache = new Map<string, OptionConstraint>();

  optionCards.forEach((card) => {
    const optionId = card.dataset.optionId ?? "";
    const min = Number(card.dataset.min ?? "0") || 0;
    const maxAttr = card.dataset.max;
    const max = typeof maxAttr === "string" ? Number(maxAttr) : null;
    const step = Number(card.dataset.step ?? "1") || 1;
    const constraint: OptionConstraint = {
      min,
      max: Number.isFinite(max ?? NaN) ? (max as number) : null,
      step: step > 0 ? step : 1,
    };
    constraintsCache.set(optionId, constraint);

    const defaultQuantity = config.optionQuantities?.[optionId];
    const initialQuantity = clampQuantity(
      typeof defaultQuantity === "number" ? defaultQuantity : constraint.min,
      constraint.min,
      constraint.max
    );

    applyQuantityState(card, initialQuantity, constraint);
  });

  const quantityForCard = (card: HTMLElement) =>
    Number(card.dataset.quantity ?? "0") || 0;

  const getPlanDetail = (slug: string): PlanDetailPayload => {
    const plan = planDetails.get(slug);
    return {
      slug,
      badge: plan?.badge ?? null,
      moreInfoTitle: plan?.moreInfoTitle ?? null,
      moreInfoContent: plan?.moreInfoContent ?? null,
    };
  };

  let lastPlanDetail: PlanDetailPayload | null = null;

  const dispatchPlanChange = (slug: string) => {
    const detail = getPlanDetail(slug);
    lastPlanDetail = detail;
    document.dispatchEvent(
      new CustomEvent<PlanDetailPayload>(PLAN_CHANGE_EVENT, {
        detail,
      })
    );
    return detail;
  };

  const updateActivePlan = () => {
    const hasBase = optionCards
      .filter((card) => card.dataset.optionType === "base")
      .some((card) => quantityForCard(card) > 0);

    const hasVideo = optionCards
      .filter((card) => card.dataset.optionType === "video")
      .some((card) => quantityForCard(card) > 0);

    let slug = planDetails.has(config.defaultPlan)
      ? config.defaultPlan
      : planCards[0]?.dataset.planSlug ?? "";

    if (!hasBase && planDetails.has("csimple")) {
      slug = "csimple";
    }

    if (hasVideo && planDetails.has("cpro")) {
      slug = "cpro";
    }

    planCards.forEach((card) => {
      card.dataset.active = card.dataset.planSlug === slug ? "true" : "false";
    });

    dispatchPlanChange(slug);
    return slug;
  };

  optionCards.forEach((card) => {
    if (card.dataset.disabled === "true") {
      return;
    }

    if (card.dataset.counterEnabled === "false") {
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
      OPTION_DECREMENT_SELECTOR
    );
    const increment = card.querySelector<HTMLButtonElement>(
      OPTION_INCREMENT_SELECTOR
    );

    decrement?.addEventListener("click", () => changeQuantity(-step));
    increment?.addEventListener("click", () => changeQuantity(step));
  });

  const triggers = root.querySelectorAll<HTMLElement>(MODAL_TRIGGER_SELECTOR);
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const slug = updateActivePlan();
      const detail = lastPlanDetail ?? getPlanDetail(slug);
      document.dispatchEvent(
        new CustomEvent<PlanDetailPayload>(MODAL_OPEN_EVENT, {
          detail,
        })
      );
    });
  });

  updateActivePlan();

  root.dataset.initialised = "true";
};

const initialiseAll = () => {
  document
    .querySelectorAll<HTMLElement>(ROOT_SELECTOR)
    .forEach(initialiseRoot);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseAll, { once: true });
} else {
  initialiseAll();
}

export {};
