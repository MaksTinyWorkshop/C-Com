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
const clampQuantity = (value, min, max) => {
    const upper = typeof max === "number" ? max : Number.POSITIVE_INFINITY;
    if (!Number.isFinite(value)) {
        return min;
    }
    return Math.min(Math.max(value, min), upper);
};
const decodeConfig = (value) => {
    if (!value)
        return null;
    try {
        return JSON.parse(decodeURIComponent(value));
    }
    catch (error) {
        console.warn("Impossible d'analyser la configuration des tarifs", error);
        return null;
    }
};
const updateDisplayedPrice = (card, quantity) => {
    var _a, _b, _c, _d;
    const priceNode = card.querySelector("[data-option-price]");
    if (!priceNode)
        return;
    const unitAttr = priceNode.dataset.unitPrice;
    const fallback = (_b = (_a = priceNode.dataset.priceFallback) !== null && _a !== void 0 ? _a : priceNode.textContent) !== null && _b !== void 0 ? _b : "";
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
        const suffix = (_c = priceNode.dataset.priceSuffix) !== null && _c !== void 0 ? _c : "";
        priceNode.textContent = suffix ? `0${suffix}` : fallback;
        return;
    }
    const suffix = (_d = priceNode.dataset.priceSuffix) !== null && _d !== void 0 ? _d : "";
    const total = unit * quantity;
    priceNode.textContent = `${total}${suffix}`;
};
const applyQuantityState = (card, quantity, constraint) => {
    const clamped = clampQuantity(quantity, constraint.min, constraint.max);
    const isDisabled = card.dataset.disabled === "true";
    card.dataset.quantity = String(clamped);
    card.dataset.selected = clamped > 0 ? "true" : "false";
    const valueNode = card.querySelector(OPTION_VALUE_SELECTOR);
    if (valueNode) {
        valueNode.textContent = String(clamped);
    }
    const decrement = card.querySelector(OPTION_DECREMENT_SELECTOR);
    const increment = card.querySelector(OPTION_INCREMENT_SELECTOR);
    const maxValue = constraint.max === null ? Number.POSITIVE_INFINITY : constraint.max;
    if (decrement) {
        decrement.disabled = isDisabled || clamped <= constraint.min;
    }
    if (increment) {
        if (isDisabled) {
            increment.disabled = true;
        }
        else if (maxValue === Number.POSITIVE_INFINITY) {
            increment.disabled = false;
        }
        else {
            increment.disabled = clamped >= maxValue;
        }
    }
    updateDisplayedPrice(card, clamped);
};
const initialiseRoot = (root) => {
    var _a, _b, _c, _d;
    if (root.dataset.initialised === "true") {
        return;
    }
    // Synchroniser la modale globale (dans BaseLayout) avec la section tarifs
    const globalModal = document.querySelector('#global-tarif-modal');
    if (globalModal) {
        globalModal.dataset.fallbackTitle = (_a = root.dataset.fallbackTitle) !== null && _a !== void 0 ? _a : '';
        globalModal.dataset.fallbackContent = (_b = root.dataset.fallbackContent) !== null && _b !== void 0 ? _b : '';
        globalModal.dataset.defaultPlan = (_c = root.dataset.defaultPlan) !== null && _c !== void 0 ? _c : '';
        globalModal.dataset.initialPlanContent = (_d = root.dataset.initialContent) !== null && _d !== void 0 ? _d : '';
    }
    const config = decodeConfig(root.dataset.config);
    if (!config) {
        return;
    }
    const planCard = root.querySelector(PLAN_CARD_SELECTOR);
    const planTriggers = Array.from(root.querySelectorAll(PLAN_TRIGGER_SELECTOR));
    const planTitleEl = planCard === null || planCard === void 0 ? void 0 : planCard.querySelector(PLAN_TITLE_SELECTOR);
    const planSubtitleEl = planCard === null || planCard === void 0 ? void 0 : planCard.querySelector(PLAN_SUBTITLE_SELECTOR);
    const planPriceEl = planCard === null || planCard === void 0 ? void 0 : planCard.querySelector(PLAN_PRICE_SELECTOR);
    const planFootnoteEl = planCard === null || planCard === void 0 ? void 0 : planCard.querySelector(PLAN_FOOTNOTE_SELECTOR);
    const planDiffusionEl = planCard === null || planCard === void 0 ? void 0 : planCard.querySelector(PLAN_DIFFUSION_SELECTOR);
    const planBadgeEl = planCard === null || planCard === void 0 ? void 0 : planCard.querySelector(PLAN_BADGE_SELECTOR);
    const planBadgeTextEl = planBadgeEl === null || planBadgeEl === void 0 ? void 0 : planBadgeEl.querySelector(PLAN_BADGE_TEXT_SELECTOR);
    const optionCards = Array.from(root.querySelectorAll(OPTION_CARD_SELECTOR));
    const contactLink = root.querySelector(CONTACT_LINK_SELECTOR);
    const baseContactHref = (contactLink === null || contactLink === void 0 ? void 0 : contactLink.dataset.baseHref) || (contactLink === null || contactLink === void 0 ? void 0 : contactLink.getAttribute("href")) || "/contact";
    const planDetails = new Map((config.plans || []).map((plan) => [plan.slug, plan]));
    const constraintsCache = new Map();
    const optionSelections = new Map();
    const formatPlanLabel = (plan, slug) => {
        if ((plan === null || plan === void 0 ? void 0 : plan.badge) && plan.badge.trim()) {
            return plan.badge.trim();
        }
        const normalized = slug.replace(/[-_]/g, " ").toUpperCase();
        if (normalized.startsWith("C") && normalized.length > 1 && normalized.charAt(1) !== "'") {
            return `C'${normalized.slice(1)}`;
        }
        return normalized;
    };
    const setOptionQuantity = (card, quantity, constraint, persist = true) => {
        var _a;
        const nextQuantity = clampQuantity(quantity, constraint.min, constraint.max);
        applyQuantityState(card, nextQuantity, constraint);
        if (!persist) {
            return;
        }
        const optionId = (_a = card.dataset.optionId) !== null && _a !== void 0 ? _a : "";
        if (optionId) {
            optionSelections.set(optionId, nextQuantity);
        }
    };
    optionCards.forEach((card) => {
        var _a, _b, _c, _d;
        const optionId = (_a = card.dataset.optionId) !== null && _a !== void 0 ? _a : "";
        const min = Number((_b = card.dataset.min) !== null && _b !== void 0 ? _b : "0") || 0;
        const maxAttr = card.dataset.max;
        const max = typeof maxAttr === "string" ? Number(maxAttr) : null;
        const step = Number((_c = card.dataset.step) !== null && _c !== void 0 ? _c : "1") || 1;
        const constraint = {
            min,
            max: Number.isFinite(max !== null && max !== void 0 ? max : NaN) ? max : null,
            step: step > 0 ? step : 1,
        };
        constraintsCache.set(optionId, constraint);
        const defaultQuantity = (_d = config.optionQuantities) === null || _d === void 0 ? void 0 : _d[optionId];
        const initialQuantity = clampQuantity(typeof defaultQuantity === "number" ? defaultQuantity : constraint.min, constraint.min, constraint.max);
        setOptionQuantity(card, initialQuantity, constraint);
    });
    const quantityForCard = (card) => { var _a; return Number((_a = card.dataset.quantity) !== null && _a !== void 0 ? _a : "0") || 0; };
    const countByType = (type) => optionCards
        .filter((card) => card.dataset.optionType === type)
        .reduce((total, card) => total + quantityForCard(card), 0);
    const updateContactLink = (slug) => {
        if (!contactLink)
            return;
        const url = new URL(baseContactHref, window.location.origin);
        const params = new URLSearchParams(url.search);
        if (slug) {
            params.set("formula", slug);
        }
        else {
            params.delete("formula");
        }
        const visuals = countByType("base");
        const videos = countByType("video");
        if (visuals > 0) {
            params.set("visuals", String(visuals));
        }
        else {
            params.delete("visuals");
        }
        if (videos > 0) {
            params.set("videos", String(videos));
        }
        else {
            params.delete("videos");
        }
        url.search = params.toString();
        contactLink.href = `${url.pathname}${url.search}`;
    };
    const getPlanDetail = (slug) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const plan = planDetails.get(slug);
        return {
            slug,
            badge: (_a = plan === null || plan === void 0 ? void 0 : plan.badge) !== null && _a !== void 0 ? _a : null,
            subtitle: (_b = plan === null || plan === void 0 ? void 0 : plan.subtitle) !== null && _b !== void 0 ? _b : null,
            price: (_c = plan === null || plan === void 0 ? void 0 : plan.price) !== null && _c !== void 0 ? _c : null,
            footnote: (_d = plan === null || plan === void 0 ? void 0 : plan.footnote) !== null && _d !== void 0 ? _d : null,
            description: (_e = plan === null || plan === void 0 ? void 0 : plan.description) !== null && _e !== void 0 ? _e : null,
            moreInfoTitle: (_f = plan === null || plan === void 0 ? void 0 : plan.moreInfoTitle) !== null && _f !== void 0 ? _f : null,
            moreInfoContent: (_g = plan === null || plan === void 0 ? void 0 : plan.moreInfoContent) !== null && _g !== void 0 ? _g : null,
            availableOptions: (_h = plan === null || plan === void 0 ? void 0 : plan.availableOptions) !== null && _h !== void 0 ? _h : null,
        };
    };
    let lastPlanDetail = null;
    const dispatchPlanChange = (slug) => {
        const detail = getPlanDetail(slug);
        lastPlanDetail = detail;
        document.dispatchEvent(new CustomEvent(PLAN_CHANGE_EVENT, {
            detail,
        }));
        return detail;
    };
    const resolveInitialPlan = () => {
        var _a, _b, _c;
        if (planDetails.has(config.defaultPlan)) {
            return config.defaultPlan;
        }
        return (_c = (_b = (_a = config.plans) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.slug) !== null && _c !== void 0 ? _c : "";
    };
    let currentPlanSlug = resolveInitialPlan();
    const updatePlanTriggersState = (activeSlug) => {
        planTriggers.forEach((trigger) => {
            const isActive = trigger.dataset.planSlug === activeSlug;
            trigger.dataset.active = isActive ? "true" : "false";
            trigger.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    };
    const updatePlanDisplay = (slug) => {
        var _a, _b, _c;
        if (!planCard) {
            return;
        }
        const plan = planDetails.get(slug);
        planCard.dataset.activePlan = slug;
        if (planTitleEl) {
            const label = formatPlanLabel(plan !== null && plan !== void 0 ? plan : null, slug);
            planTitleEl.textContent = label;
        }
        if (planBadgeEl && planBadgeTextEl) {
            if (plan === null || plan === void 0 ? void 0 : plan.badge) {
                planBadgeTextEl.textContent = plan.badge;
                planBadgeEl.hidden = false;
            }
            else {
                planBadgeTextEl.textContent = "";
                planBadgeEl.hidden = true;
            }
        }
        if (planSubtitleEl) {
            planSubtitleEl.textContent = (_a = plan === null || plan === void 0 ? void 0 : plan.subtitle) !== null && _a !== void 0 ? _a : "";
        }
        if (planPriceEl) {
            planPriceEl.textContent = (_b = plan === null || plan === void 0 ? void 0 : plan.price) !== null && _b !== void 0 ? _b : "";
        }
        if (planFootnoteEl) {
            if (plan === null || plan === void 0 ? void 0 : plan.footnote) {
                planFootnoteEl.textContent = plan.footnote;
                planFootnoteEl.hidden = false;
            }
            else {
                planFootnoteEl.textContent = "";
                planFootnoteEl.hidden = true;
            }
        }
        if (planDiffusionEl) {
            planDiffusionEl.textContent = (_c = plan === null || plan === void 0 ? void 0 : plan.description) !== null && _c !== void 0 ? _c : "";
        }
    };
    const applyPlanPermissions = (slug) => {
        var _a;
        const plan = planDetails.get(slug);
        const allowedList = Array.isArray(plan === null || plan === void 0 ? void 0 : plan.availableOptions)
            ? (_a = plan === null || plan === void 0 ? void 0 : plan.availableOptions) !== null && _a !== void 0 ? _a : []
            : null;
        const allowedSet = allowedList ? new Set(allowedList) : null;
        optionCards.forEach((card) => {
            var _a;
            const optionId = (_a = card.dataset.optionId) !== null && _a !== void 0 ? _a : "";
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
            }
            else {
                const stored = optionSelections.get(optionId);
                const nextValue = typeof stored === "number"
                    ? stored
                    : quantityForCard(card);
                setOptionQuantity(card, nextValue, constraint);
            }
        });
    };
    const applyPlanState = (slug) => {
        updatePlanTriggersState(slug);
        updatePlanDisplay(slug);
        applyPlanPermissions(slug);
        updateContactLink(slug);
    };
    const setActivePlan = (slug) => {
        if (!slug || !planDetails.has(slug)) {
            return null;
        }
        currentPlanSlug = slug;
        applyPlanState(slug);
        return dispatchPlanChange(slug);
    };
    optionCards.forEach((card) => {
        var _a;
        if (card.dataset.counterEnabled === "false") {
            return;
        }
        const optionId = (_a = card.dataset.optionId) !== null && _a !== void 0 ? _a : "";
        const constraint = constraintsCache.get(optionId);
        if (!constraint) {
            return;
        }
        const step = Math.abs(constraint.step) || 1;
        const changeQuantity = (delta) => {
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
        const decrement = card.querySelector(OPTION_DECREMENT_SELECTOR);
        const increment = card.querySelector(OPTION_INCREMENT_SELECTOR);
        decrement === null || decrement === void 0 ? void 0 : decrement.addEventListener("click", () => changeQuantity(-step));
        increment === null || increment === void 0 ? void 0 : increment.addEventListener("click", () => changeQuantity(step));
    });
    const triggers = root.querySelectorAll(MODAL_TRIGGER_SELECTOR);
    triggers.forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            const detail = lastPlanDetail !== null && lastPlanDetail !== void 0 ? lastPlanDetail : getPlanDetail(currentPlanSlug);
            document.dispatchEvent(new CustomEvent(MODAL_OPEN_EVENT, {
                detail,
            }));
        });
    });
    planTriggers.forEach((trigger) => {
        var _a;
        const slug = (_a = trigger.dataset.planSlug) !== null && _a !== void 0 ? _a : "";
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
        .querySelectorAll(ROOT_SELECTOR)
        .forEach(initialiseRoot);
};
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseAll, { once: true });
}
else {
    initialiseAll();
}
export {};
