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

const decodeConfig = (value: string | null | undefined): TarifConfig | null => {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as TarifConfig;
  } catch (error) {
    console.warn("Impossible d'analyser la configuration des tarifs", error);
    return null;
  }
};

const pickPlan = (plans: Map<string, PlanConfig>, slug?: string | null) => {
  if (!slug) return null;
  return plans.has(slug) ? slug : null;
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
    root.querySelectorAll<HTMLElement>("[data-plan-card]")
  );
  const optionCards = Array.from(
    root.querySelectorAll<HTMLElement>("[data-option-card]")
  );

  const planDetails = new Map(
    config.plans.map((plan) => [plan.slug, plan])
  );

  const applySelectionState = (card: HTMLElement, selected: boolean) => {
    card.dataset.selected = selected ? "true" : "false";
    const toggle = card.querySelector<HTMLElement>("[data-option-toggle]");
    toggle?.setAttribute("aria-pressed", selected ? "true" : "false");
    const valueNode = toggle?.querySelector<HTMLElement>("[data-option-value]");
    if (valueNode) {
      valueNode.textContent = selected ? "1" : "0";
    }
  };

  optionCards.forEach((card) => {
    const optionId = card.dataset.optionId ?? "";
    const isSelected = config.optionDefaults[optionId] ?? false;
    applySelectionState(card, isSelected);
  });

  const updatePlan = () => {
    const hasBase = optionCards
      .filter((card) => card.dataset.optionType === "base")
      .some((card) => card.dataset.selected === "true");
    const hasVideo = optionCards
      .filter((card) => card.dataset.optionType === "video")
      .some((card) => card.dataset.selected === "true");

    let current = pickPlan(planDetails, config.defaultPlan) ?? planCards[0]?.dataset.planSlug ?? "";

    const simpleSlug = pickPlan(planDetails, "csimple");
    const proSlug = pickPlan(planDetails, "cpro");

    if (!hasBase && simpleSlug) {
      current = simpleSlug;
    }

    if (hasVideo && proSlug) {
      current = proSlug;
    }

    planCards.forEach((card) => {
      card.dataset.active = card.dataset.planSlug === current ? "true" : "false";
    });

    return current;
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
      updatePlan();
    });
  });

  updatePlan();

  const modalId = root.dataset.modalId;
  const modal = modalId
    ? (document.getElementById(modalId) as HTMLDialogElement | null)
    : null;
  const openButton = root.querySelector<HTMLButtonElement>("[data-modal-open]");

  const renderModalContent = (planSlug: string) => {
    if (!modal) return;
    const titleNode = modal.querySelector<HTMLElement>("[data-modal-title]");
    const bodyNode = modal.querySelector<HTMLElement>("[data-modal-body]");
    const plan = planDetails.get(planSlug);
    const fallback = config.modal ?? {};
    const title = plan?.moreInfoTitle || fallback.title || "Plus d'informations";
    const pieces = [] as string[];

    if (plan?.moreInfoContent) pieces.push(plan.moreInfoContent);
    if (fallback.content) pieces.push(fallback.content);

    if (titleNode) {
      titleNode.textContent = title;
    }

    if (bodyNode) {
      bodyNode.innerHTML = pieces.join("") ||
        "<p>Aucune information complémentaire pour le moment.</p>";
    }
  };

  if (modal && openButton) {
    const closeButton = modal.querySelector<HTMLButtonElement>("[data-modal-close]");

    openButton.addEventListener("click", () => {
      const slug = updatePlan();
      renderModalContent(slug);
      if (typeof modal.showModal === "function") {
        modal.showModal();
      }
    });

    closeButton?.addEventListener("click", () => {
      modal.close();
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.close();
      }
    });

    modal.addEventListener("cancel", (event) => {
      event.preventDefault();
      modal.close();
    });
  }

  root.dataset.initialised = "true";
};

const initAll = () => {
  const roots = document.querySelectorAll<HTMLElement>("[data-tarifs-root]");
  roots.forEach(initialiseRoot);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAll, { once: true });
} else {
  initAll();
}
