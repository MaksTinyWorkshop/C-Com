import type { PlanDetailPayload } from "@app-types/tarifs";

const MODAL_SELECTOR = "[data-tarif-modal-root]";
const ICON_SELECTOR = "[data-modal-icon]";
const TITLE_SELECTOR = "[data-modal-title]";
const PLAN_CONTENT_SELECTOR = "[data-modal-body]";
const COMMON_CONTENT_SELECTOR = "[data-modal-common]";
const CLOSE_SELECTOR = "[data-modal-close]";

const PLAN_CHANGE_EVENT = "tarif:plan-change";
const MODAL_OPEN_EVENT = "tarif:modal-open";

const EMPTY_PLAN_CONTENT =
  "<p>Aucune information complémentaire pour le moment.</p>";

const DEFAULT_ICON_SIZE = 72;

const parseIconSize = (modal: HTMLElement): number => {
  const attr = modal.dataset.iconSize ?? "";
  const parsed = Number(attr);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_ICON_SIZE;
};

const applyIconSize = (iconContainer: HTMLElement, size: number) => {
  const svg = iconContainer.querySelector<SVGElement>("svg");
  if (!svg) {
    return;
  }

  const targetWidth = size;
  let targetHeight: number | null = null;
  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.trim().split(/\s+/).map(Number);
    if (parts.length >= 4 && Number.isFinite(parts[2]) && parts[2] > 0 && Number.isFinite(parts[3])) {
      const ratio = parts[3] / parts[2];
      if (Number.isFinite(ratio) && ratio > 0) {
        targetHeight = targetWidth * ratio;
      }
    }
  }

  svg.setAttribute("width", String(targetWidth));
  svg.style.width = `${targetWidth}px`;

  if (targetHeight && Number.isFinite(targetHeight)) {
    const roundedHeight = Math.round(targetHeight * 100) / 100;
    svg.setAttribute("height", String(roundedHeight));
    svg.style.height = `${roundedHeight}px`;
  } else {
    svg.removeAttribute("height");
    svg.style.height = "auto";
  }
};

const clonePlanIcon = (
  slug: string,
  iconContainer: HTMLElement,
  iconSize: number
) => {
  const planIcon =
    document.querySelector<HTMLElement>(
      `[data-plan-trigger][data-plan-slug="${slug}"] [data-plan-icon]`
    ) ??
    document.querySelector<HTMLElement>(
      `[data-plan-card][data-plan-slug="${slug}"] [data-plan-icon]`
    );

  if (planIcon) {
    const clone = planIcon.cloneNode(true) as HTMLElement;
    clone.removeAttribute("data-plan-icon");
    clone.setAttribute("aria-hidden", "true");
    iconContainer.innerHTML = "";
    iconContainer.appendChild(clone);
    applyIconSize(iconContainer, iconSize);
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
  const commonContentEl = modal.querySelector<HTMLElement>(COMMON_CONTENT_SELECTOR);
  const closeButtons = modal.querySelectorAll<HTMLButtonElement>(CLOSE_SELECTOR);

  const fallbackTitle = modal.dataset.fallbackTitle ?? "";
  const defaultPlan = modal.dataset.defaultPlan ?? "";
  const defaultBadge = modal.dataset.defaultBadge ?? "";
  const initialPlanContentEncoded = modal.dataset.initialPlanContent ?? "";
  const iconSize = parseIconSize(modal);
  const initialPlanContent = initialPlanContentEncoded
    ? decodeURIComponent(initialPlanContentEncoded)
    : "";

  let lastFocused: HTMLElement | null = null;
  let lastDetail: PlanDetailPayload | null = defaultPlan
    ? {
        slug: defaultPlan,
        badge: defaultBadge ? defaultBadge : null,
        subtitle: null,
        price: null,
        footnote: null,
        description: null,
        moreInfoTitle: null,
        moreInfoContent: initialPlanContent || null,
        availableOptions: null,
      }
    : null;

  const render = (detail: PlanDetailPayload | null) => {
    if (commonContentEl) {
      const fallbackContent = modal.dataset.fallbackContent ?? "";
      const trimmedFallback = fallbackContent.trim();
      commonContentEl.innerHTML = trimmedFallback ? fallbackContent : "";
      if (trimmedFallback) {
        commonContentEl.dataset.hasContent = "true";
        commonContentEl.hidden = false;
      } else {
        delete commonContentEl.dataset.hasContent;
        commonContentEl.hidden = true;
      }
    }

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

      const cloned = detail ? clonePlanIcon(detail.slug, iconEl, iconSize) : false;
      if (!cloned) {
        const fallbackText =
          detail?.badge || detail?.slug || fallbackTitle || "";
        iconEl.innerHTML = "";
        iconEl.textContent = fallbackText;
        iconEl.removeAttribute("aria-hidden");
        iconEl.setAttribute("data-empty", "true");
        applyIconSize(iconEl, iconSize);
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
