import type { PlanDetailPayload } from "@app-types/tarifs";

const MODAL_SELECTOR = "[data-tarif-modal-root]";
const ICON_SELECTOR = "[data-modal-icon]";
const TITLE_SELECTOR = "[data-modal-title]";
const PLAN_CONTENT_SELECTOR = "[data-modal-body]";
const CLOSE_SELECTOR = "[data-modal-close]";

const PLAN_CHANGE_EVENT = "tarif:plan-change";
const MODAL_OPEN_EVENT = "tarif:modal-open";

const EMPTY_PLAN_CONTENT =
  "<p>Aucune information complémentaire pour le moment.</p>";

const clonePlanIcon = (slug: string, iconContainer: HTMLElement) => {
  const planIcon = document.querySelector<HTMLElement>(
    `[data-plan-card][data-plan-slug="${slug}"] [data-plan-icon]`
  );

  if (planIcon) {
    const clone = planIcon.cloneNode(true) as HTMLElement;
    clone.removeAttribute("data-plan-icon");
    clone.setAttribute("aria-hidden", "true");
    iconContainer.innerHTML = "";
    iconContainer.appendChild(clone);
    iconContainer.setAttribute("aria-hidden", "true");
    iconContainer.removeAttribute("data-empty");
    return true;
  }

  return false;
};

const initialiseModal = (modal: HTMLElement) => {
  const titleEl = modal.querySelector<HTMLElement>(TITLE_SELECTOR);
  const planContentEl = modal.querySelector<HTMLElement>(PLAN_CONTENT_SELECTOR);
  const iconEl = modal.querySelector<HTMLElement>(ICON_SELECTOR);
  const closeButtons = modal.querySelectorAll<HTMLButtonElement>(CLOSE_SELECTOR);

  const fallbackTitle = modal.dataset.fallbackTitle ?? "";
  const defaultPlan = modal.dataset.defaultPlan ?? "";
  const defaultBadge = modal.dataset.defaultBadge ?? "";
  const initialPlanContentEncoded = modal.dataset.initialPlanContent ?? "";
  const initialPlanContent = initialPlanContentEncoded
    ? decodeURIComponent(initialPlanContentEncoded)
    : "";

  let lastFocused: HTMLElement | null = null;
  let lastDetail: PlanDetailPayload | null = defaultPlan
    ? {
        slug: defaultPlan,
        badge: defaultBadge ? defaultBadge : null,
        moreInfoTitle: null,
        moreInfoContent: initialPlanContent || null,
      }
    : null;

  const render = (detail: PlanDetailPayload | null) => {
    if (titleEl) {
      titleEl.textContent = detail?.moreInfoTitle ?? fallbackTitle;
    }

    if (planContentEl) {
      const rawPlanContent = detail?.moreInfoContent ?? "";
      planContentEl.innerHTML = rawPlanContent.trim()
        ? rawPlanContent
        : EMPTY_PLAN_CONTENT;
    }

    if (iconEl) {
      if (detail?.slug) {
        iconEl.dataset.plan = detail.slug;
      } else {
        delete iconEl.dataset.plan;
      }

      const cloned = detail ? clonePlanIcon(detail.slug, iconEl) : false;
      if (!cloned) {
        const fallbackText =
          detail?.badge || detail?.slug || fallbackTitle || "";
        iconEl.innerHTML = "";
        iconEl.textContent = fallbackText;
        iconEl.removeAttribute("aria-hidden");
        iconEl.setAttribute("data-empty", "true");
      } else {
        iconEl.removeAttribute("data-empty");
      }
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    }
  };

  const openModal = (detail: PlanDetailPayload | null) => {
    if (detail) {
      lastDetail = detail;
    }

    render(lastDetail);

    modal.dataset.open = "true";
    modal.setAttribute("aria-hidden", "false");
    modal.addEventListener("keydown", handleKeydown, true);

    lastFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusTarget =
      modal.querySelector<HTMLElement>(CLOSE_SELECTOR) ?? iconEl ?? modal;
    focusTarget?.focus({ preventScroll: true });

  };

  const closeModal = () => {
    modal.dataset.open = "false";
    modal.setAttribute("aria-hidden", "true");
    modal.removeEventListener("keydown", handleKeydown, true);

    if (lastFocused) {
      lastFocused.focus({ preventScroll: true });
      lastFocused = null;
    }
  };

  document.addEventListener(PLAN_CHANGE_EVENT, (event) => {
    const custom = event as CustomEvent<PlanDetailPayload>;
    lastDetail = custom.detail;
    render(lastDetail);
  });

  document.addEventListener(MODAL_OPEN_EVENT, (event) => {
    const custom = event as CustomEvent<PlanDetailPayload>;
    openModal(custom.detail ?? lastDetail);
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => closeModal());
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  if (lastDetail) {
    render(lastDetail);
  } else {
    render(null);
  }
};

const initialiseAll = () => {
  document
    .querySelectorAll<HTMLElement>(MODAL_SELECTOR)
    .forEach(initialiseModal);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseAll, { once: true });
} else {
  initialiseAll();
}

export {};
