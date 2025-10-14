const MODAL_SELECTOR = "[data-tarif-modal-root]";
const ICON_SELECTOR = "[data-modal-icon]";
const TITLE_SELECTOR = "[data-modal-title]";
const PLAN_CONTENT_SELECTOR = "[data-modal-body]";
const COMMON_CONTENT_SELECTOR = "[data-modal-common]";
const CLOSE_SELECTOR = "[data-modal-close]";
const PLAN_CHANGE_EVENT = "tarif:plan-change";
const MODAL_OPEN_EVENT = "tarif:modal-open";
const EMPTY_PLAN_CONTENT = "<p>Aucune information complémentaire pour le moment.</p>";
const DEFAULT_ICON_SIZE = 72;
const parseIconSize = (modal) => {
    var _a;
    const attr = (_a = modal.dataset.iconSize) !== null && _a !== void 0 ? _a : "";
    const parsed = Number(attr);
    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }
    return DEFAULT_ICON_SIZE;
};
const applyIconSize = (iconContainer, size) => {
    const svg = iconContainer.querySelector("svg");
    if (!svg) {
        return;
    }
    const targetWidth = size;
    let targetHeight = null;
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
    }
    else {
        svg.removeAttribute("height");
        svg.style.height = "auto";
    }
};
const clonePlanIcon = (slug, iconContainer, iconSize) => {
    var _a;
    const planIcon = (_a = document.querySelector(`[data-plan-trigger][data-plan-slug="${slug}"] [data-plan-icon]`)) !== null && _a !== void 0 ? _a : document.querySelector(`[data-plan-card][data-plan-slug="${slug}"] [data-plan-icon]`);
    if (planIcon) {
        const clone = planIcon.cloneNode(true);
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
const initialiseModal = (modal) => {
    var _a, _b, _c, _d;
    const titleEl = modal.querySelector(TITLE_SELECTOR);
    const planContentEl = modal.querySelector(PLAN_CONTENT_SELECTOR);
    const iconEl = modal.querySelector(ICON_SELECTOR);
    const commonContentEl = modal.querySelector(COMMON_CONTENT_SELECTOR);
    const closeButtons = modal.querySelectorAll(CLOSE_SELECTOR);
    const fallbackTitle = (_a = modal.dataset.fallbackTitle) !== null && _a !== void 0 ? _a : "";
    const defaultPlan = (_b = modal.dataset.defaultPlan) !== null && _b !== void 0 ? _b : "";
    const defaultBadge = (_c = modal.dataset.defaultBadge) !== null && _c !== void 0 ? _c : "";
    const initialPlanContentEncoded = (_d = modal.dataset.initialPlanContent) !== null && _d !== void 0 ? _d : "";
    const iconSize = parseIconSize(modal);
    const initialPlanContent = initialPlanContentEncoded
        ? decodeURIComponent(initialPlanContentEncoded)
        : "";
    let lastFocused = null;
    let lastDetail = defaultPlan
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
    const render = (detail) => {
        var _a, _b, _c;
        if (commonContentEl) {
            const fallbackContent = (_a = modal.dataset.fallbackContent) !== null && _a !== void 0 ? _a : "";
            const trimmedFallback = fallbackContent.trim();
            commonContentEl.innerHTML = trimmedFallback ? fallbackContent : "";
            if (trimmedFallback) {
                commonContentEl.dataset.hasContent = "true";
                commonContentEl.hidden = false;
            }
            else {
                delete commonContentEl.dataset.hasContent;
                commonContentEl.hidden = true;
            }
        }
        if (titleEl) {
            titleEl.textContent = (_b = detail === null || detail === void 0 ? void 0 : detail.moreInfoTitle) !== null && _b !== void 0 ? _b : fallbackTitle;
        }
        if (planContentEl) {
            const rawPlanContent = (_c = detail === null || detail === void 0 ? void 0 : detail.moreInfoContent) !== null && _c !== void 0 ? _c : "";
            planContentEl.innerHTML = rawPlanContent.trim()
                ? rawPlanContent
                : EMPTY_PLAN_CONTENT;
        }
        if (iconEl) {
            if (detail === null || detail === void 0 ? void 0 : detail.slug) {
                iconEl.dataset.plan = detail.slug;
            }
            else {
                delete iconEl.dataset.plan;
            }
            const cloned = detail ? clonePlanIcon(detail.slug, iconEl, iconSize) : false;
            if (!cloned) {
                const fallbackText = (detail === null || detail === void 0 ? void 0 : detail.badge) || (detail === null || detail === void 0 ? void 0 : detail.slug) || fallbackTitle || "";
                iconEl.innerHTML = "";
                iconEl.textContent = fallbackText;
                iconEl.removeAttribute("aria-hidden");
                iconEl.setAttribute("data-empty", "true");
                applyIconSize(iconEl, iconSize);
            }
            else {
                iconEl.removeAttribute("data-empty");
            }
        }
    };
    const handleKeydown = (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            closeModal();
        }
    };
    const openModal = (detail) => {
        var _a, _b;
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
        const focusTarget = (_b = (_a = modal.querySelector(CLOSE_SELECTOR)) !== null && _a !== void 0 ? _a : iconEl) !== null && _b !== void 0 ? _b : modal;
        focusTarget === null || focusTarget === void 0 ? void 0 : focusTarget.focus({ preventScroll: true });
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
        const custom = event;
        lastDetail = custom.detail;
        render(lastDetail);
    });
    document.addEventListener(MODAL_OPEN_EVENT, (event) => {
        var _a;
        const custom = event;
        openModal((_a = custom.detail) !== null && _a !== void 0 ? _a : lastDetail);
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
    }
    else {
        render(null);
    }
};
const initialiseAll = () => {
    document
        .querySelectorAll(MODAL_SELECTOR)
        .forEach(initialiseModal);
};
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseAll, { once: true });
}
else {
    initialiseAll();
}
export {};
