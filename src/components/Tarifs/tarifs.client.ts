import type {
  OptionConstraint,
  PlanConfig,
  PlanDetailPayload,
  TarifClientConfig,
} from "@app-types/tarifs";

const ROOT_SELECTOR = "[data-tarifs-root]";
const PLAN_CARD_SELECTOR = "[data-plan-card]";
const PLAN_TRIGGER_SELECTOR = "[data-plan-trigger]";
const OPTION_CARD_SELECTOR = "[data-option-card]";
const OPTION_VALUE_SELECTOR = "[data-option-value]";
const OPTION_DECREMENT_SELECTOR = "[data-option-decrement]";
const OPTION_INCREMENT_SELECTOR = "[data-option-increment]";
const MODAL_TRIGGER_SELECTOR = "[data-tarif-modal-trigger]";
const CONTACT_LINK_SELECTOR = "[data-tarifs-contact]";
const PLAN_SUBTITLE_SELECTOR = "[data-plan-subtitle]";
const PLAN_PRICE_SELECTOR = "[data-plan-price]";
const PLAN_FOOTNOTE_SELECTOR = "[data-plan-footnote]";
const PLAN_DIFFUSION_SELECTOR = "[data-plan-diffusion]";
const PLAN_TITLE_SELECTOR = "[data-plan-title]";
const PLAN_BADGE_SELECTOR = "[data-plan-badge]";
const PLAN_BADGE_TEXT_SELECTOR = "[data-plan-badge-text]";

const PLAN_CHANGE_EVENT = "tarif:plan-change";
const MODAL_OPEN_EVENT = "tarif:modal-open";

const clampQuantity = (value: number, min: number, max: number | null) => {
  const upper = typeof max === "number" ? max : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), upper);
};

const decodeConfig = (
  value: string | null | undefined,
): TarifClientConfig | null => {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as TarifClientConfig;
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

  // Synchroniser la modale globale (dans BaseLayout) avec la section tarifs
  const globalModal = document.querySelector<HTMLElement>('#global-tarif-modal');
  if (globalModal) {
    globalModal.dataset.fallbackTitle = root.dataset.fallbackTitle ?? '';
    globalModal.dataset.fallbackContent = root.dataset.fallbackContent ?? '';
    globalModal.dataset.defaultPlan = root.dataset.defaultPlan ?? '';
    globalModal.dataset.initialPlanContent = root.dataset.initialContent ?? '';
  }

  const config = decodeConfig(root.dataset.config);
  if (!config) {
    return;
  }

  const planCard = root.querySelector<HTMLElement>(PLAN_CARD_SELECTOR);
  const planTriggers = Array.from(
    root.querySelectorAll<HTMLElement>(PLAN_TRIGGER_SELECTOR)
  );
  const planTitleEl = planCard?.querySelector<HTMLElement>(PLAN_TITLE_SELECTOR);
  const planSubtitleEl = planCard?.querySelector<HTMLElement>(PLAN_SUBTITLE_SELECTOR);
  const planPriceEl = planCard?.querySelector<HTMLElement>(PLAN_PRICE_SELECTOR);
  const planFootnoteEl = planCard?.querySelector<HTMLElement>(PLAN_FOOTNOTE_SELECTOR);
  const planDiffusionEl = planCard?.querySelector<HTMLElement>(PLAN_DIFFUSION_SELECTOR);
  const planBadgeEl = planCard?.querySelector<HTMLElement>(PLAN_BADGE_SELECTOR);
  const planBadgeTextEl = planBadgeEl?.querySelector<HTMLElement>(PLAN_BADGE_TEXT_SELECTOR);
  const optionCards = Array.from(
    root.querySelectorAll<HTMLElement>(OPTION_CARD_SELECTOR)
  );
  const contactLink = root.querySelector<HTMLAnchorElement>(CONTACT_LINK_SELECTOR);
  const baseContactHref =
    contactLink?.dataset.baseHref || contactLink?.getAttribute("href") || "/contact";
  const planDetails = new Map<string, PlanConfig>(
    (config.plans || []).map((plan) => [plan.slug, plan])
  );

  const constraintsCache = new Map<string, OptionConstraint>();
  const optionSelections = new Map<string, number>();

  const formatPlanLabel = (plan: PlanConfig | null, slug: string) => {
    if (plan?.badge && plan.badge.trim()) {
      return plan.badge.trim();
    }
    const normalized = slug.replace(/[-_]/g, " ").toUpperCase();
    if (normalized.startsWith("C") && normalized.length > 1 && normalized.charAt(1) !== "'") {
      return `C'${normalized.slice(1)}`;
    }
    return normalized;
  };

  const setOptionQuantity = (
    card: HTMLElement,
    quantity: number,
    constraint: OptionConstraint,
    persist = true
  ) => {
    const nextQuantity = clampQuantity(quantity, constraint.min, constraint.max);
    applyQuantityState(card, nextQuantity, constraint);
    if (!persist) {
      return;
    }
    const optionId = card.dataset.optionId ?? "";
    if (optionId) {
      optionSelections.set(optionId, nextQuantity);
    }
  };

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

    setOptionQuantity(card, initialQuantity, constraint);
  });

  const quantityForCard = (card: HTMLElement) =>
    Number(card.dataset.quantity ?? "0") || 0;

  const countByType = (type: string) =>
    optionCards
      .filter((card) => card.dataset.optionType === type)
      .reduce((total, card) => total + quantityForCard(card), 0);

  const updateContactLink = (slug: string) => {
    if (!contactLink) return;

    const url = new URL(baseContactHref, window.location.origin);
    const params = new URLSearchParams(url.search);

    if (slug) {
      params.set("formula", slug);
    } else {
      params.delete("formula");
    }

    const visuals = countByType("base");
    const videos = countByType("video");

    if (visuals > 0) {
      params.set("visuals", String(visuals));
    } else {
      params.delete("visuals");
    }

    if (videos > 0) {
      params.set("videos", String(videos));
    } else {
      params.delete("videos");
    }

    url.search = params.toString();
    contactLink.href = `${url.pathname}${url.search}`;
  };

  const getPlanDetail = (slug: string): PlanDetailPayload => {
    const plan = planDetails.get(slug);
    return {
      slug,
      badge: plan?.badge ?? null,
      subtitle: plan?.subtitle ?? null,
      price: plan?.price ?? null,
      footnote: plan?.footnote ?? null,
      description: plan?.description ?? null,
      moreInfoTitle: plan?.moreInfoTitle ?? null,
      moreInfoContent: plan?.moreInfoContent ?? null,
      availableOptions: plan?.availableOptions ?? null,
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

  const resolveInitialPlan = () => {
    if (planDetails.has(config.defaultPlan)) {
      return config.defaultPlan;
    }
    return config.plans?.[0]?.slug ?? "";
  };

  let currentPlanSlug = resolveInitialPlan();

  const updatePlanTriggersState = (activeSlug: string) => {
    planTriggers.forEach((trigger) => {
      const isActive = trigger.dataset.planSlug === activeSlug;
      trigger.dataset.active = isActive ? "true" : "false";
      trigger.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const updatePlanDisplay = (slug: string) => {
    if (!planCard) {
      return;
    }
    const plan = planDetails.get(slug);
    planCard.dataset.activePlan = slug;

    if (planTitleEl) {
      const label = formatPlanLabel(plan ?? null, slug);
      planTitleEl.textContent = label;
    }

    if (planBadgeEl && planBadgeTextEl) {
      if (plan?.badge) {
        planBadgeTextEl.textContent = plan.badge;
        planBadgeEl.hidden = false;
      } else {
        planBadgeTextEl.textContent = "";
        planBadgeEl.hidden = true;
      }
    }

    if (planSubtitleEl) {
      planSubtitleEl.textContent = plan?.subtitle ?? "";
    }

    if (planPriceEl) {
      planPriceEl.textContent = plan?.price ?? "";
    }

    if (planFootnoteEl) {
      if (plan?.footnote) {
        planFootnoteEl.textContent = plan.footnote;
        planFootnoteEl.hidden = false;
      } else {
        planFootnoteEl.textContent = "";
        planFootnoteEl.hidden = true;
      }
    }

    if (planDiffusionEl) {
      planDiffusionEl.textContent = plan?.description ?? "";
    }
  };

  const applyPlanPermissions = (slug: string) => {
    const plan = planDetails.get(slug);
    const allowedList = Array.isArray(plan?.availableOptions)
      ? plan?.availableOptions ?? []
      : null;
    const allowedSet = allowedList ? new Set(allowedList) : null;

    optionCards.forEach((card) => {
      const optionId = card.dataset.optionId ?? "";
      const constraint = constraintsCache.get(optionId);
      if (!constraint) {
        return;
      }

      const originallyDisabled = card.dataset.originallyDisabled === "true";
      const restricted = allowedSet ? !allowedSet.has(optionId) : false;
      const shouldDisable = originallyDisabled || restricted;

      card.dataset.disabled = shouldDisable ? "true" : "false";
      card.setAttribute("aria-disabled", shouldDisable ? "true" : "false");

      if (shouldDisable) {
        const currentValue = quantityForCard(card);
        if (!optionSelections.has(optionId)) {
          optionSelections.set(optionId, currentValue);
        }
        setOptionQuantity(card, constraint.min, constraint, false);
      } else {
        const stored = optionSelections.get(optionId);
        const nextValue =
          typeof stored === "number"
            ? stored
            : quantityForCard(card);
        setOptionQuantity(card, nextValue, constraint);
      }
    });
  };

  const applyPlanState = (slug: string) => {
    updatePlanTriggersState(slug);
    updatePlanDisplay(slug);
    applyPlanPermissions(slug);
    updateContactLink(slug);
  };

  const setActivePlan = (slug: string) => {
    if (!slug || !planDetails.has(slug)) {
      return null;
    }
    currentPlanSlug = slug;
    applyPlanState(slug);
    return dispatchPlanChange(slug);
  };

  optionCards.forEach((card) => {
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
      if (card.dataset.disabled === "true") {
        return;
      }

      const current = quantityForCard(card);
      const next = clampQuantity(current + delta, constraint.min, constraint.max);
      if (next !== current) {
        setOptionQuantity(card, next, constraint);
        updateContactLink(currentPlanSlug);
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
      const detail = lastPlanDetail ?? getPlanDetail(currentPlanSlug);
      document.dispatchEvent(
        new CustomEvent<PlanDetailPayload>(MODAL_OPEN_EVENT, {
          detail,
        })
      );
    });
  });

  planTriggers.forEach((trigger) => {
    const slug = trigger.dataset.planSlug ?? "";
    if (!slug) {
      return;
    }

    trigger.addEventListener("click", () => {
      setActivePlan(slug);
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActivePlan(slug);
      }
    });
  });

  if (currentPlanSlug) {
    setActivePlan(currentPlanSlug);
  }

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
