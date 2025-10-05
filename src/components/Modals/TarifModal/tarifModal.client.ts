type ModalContent = {
  title?: string | null;
  content?: string | null;
};

type PlanConfig = {
  slug: string;
  moreInfoTitle: string | null;
  moreInfoContent: string | null;
};

type TarifConfig = {
  defaultPlan: string;
  baseOptionIds: string[];
  videoOptionIds: string[];
  optionDefaults: Record<string, boolean>;
  plans: PlanConfig[];
  modal: ModalContent | null;
};

const ROOT_SELECTOR = "[data-tarifs-root]";
const TRIGGER_SELECTOR = "[data-tarif-modal-trigger]";
const PLAN_CARD_SELECTOR = "[data-plan-card]";
const OPTION_CARD_SELECTOR = "[data-option-card]";

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

const applySelectionState = (card: HTMLElement, selected: boolean) => {
  card.dataset.selected = selected ? "true" : "false";
  const toggle = card.querySelector<HTMLElement>("[data-option-toggle]");
  toggle?.setAttribute("aria-pressed", selected ? "true" : "false");
  const valueNode = toggle?.querySelector<HTMLElement>("[data-option-value]");
  if (valueNode) {
    valueNode.textContent = selected ? "1" : "0";
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

  optionCards.forEach((card) => {
    const optionId = card.dataset.optionId ?? "";
    const isSelected = config.optionDefaults[optionId] ?? false;
    applySelectionState(card, isSelected);
  });

  const updateActivePlan = () => {
    const hasBase = optionCards
      .filter((card) => card.dataset.optionType === "base")
      .some((card) => card.dataset.selected === "true");
    const hasVideo = optionCards
      .filter((card) => card.dataset.optionType === "video")
      .some((card) => card.dataset.selected === "true");

    let slug = pickPlanSlug(planDetails, config.defaultPlan) ??
      planCards[0]?.dataset.planSlug ?? "";

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

    const toggle = card.querySelector<HTMLButtonElement>("[data-option-toggle]");
    if (!toggle) {
      return;
    }

    toggle.addEventListener("click", () => {
      const next = card.dataset.selected !== "true";
      applySelectionState(card, next);
      updateActivePlan();
    });
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
      modalBody.innerHTML = pieces.join("") ||
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
    lastFocused = document.activeElement instanceof HTMLElement
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
