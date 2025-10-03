const TOGGLE_ATTR = 'data-card-open';
const DETAILS_SELECTOR = '[data-card-details]';
const CARD_SELECTOR = '[data-card]';
const TOGGLE_SELECTOR = '[data-card-toggle]';

type CardEntry = {
  card: HTMLElement;
  details: HTMLElement;
  toggles: HTMLElement[];
};

function updateDetailsState(entry: CardEntry, open: boolean) {
  const { card, details, toggles } = entry;

  card.setAttribute(TOGGLE_ATTR, String(open));
  details.hidden = !open;
  details.setAttribute('aria-hidden', String(!open));
  if (open) {
    details.removeAttribute('inert');
  } else {
    details.setAttribute('inert', '');
  }

  const showLabel = toggles[0]?.dataset.labelShow ?? 'Détails';
  const hideLabel = toggles[0]?.dataset.labelHide ?? 'Masquer';

  toggles.forEach((toggle) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? hideLabel : showLabel;
  });
}

function buildRegistry(root: Document | HTMLElement): Map<string, CardEntry> {
  const registry = new Map<string, CardEntry>();

  const cards = Array.from(root.querySelectorAll<HTMLElement>(CARD_SELECTOR));

  cards.forEach((card) => {
    const details = card.querySelector<HTMLElement>(DETAILS_SELECTOR);
    if (!details || !details.id) {
      return;
    }

    const toggles = Array.from(
      root.querySelectorAll<HTMLElement>(
        `${TOGGLE_SELECTOR}[data-card-target='${details.id}']`,
      ),
    );

    if (toggles.length === 0) {
      const internalToggles = Array.from(
        card.querySelectorAll<HTMLElement>(TOGGLE_SELECTOR),
      );
      toggles.push(...internalToggles);
    }

    if (toggles.length === 0) {
      return;
    }

    toggles.forEach((toggle) => {
      toggle.setAttribute('aria-controls', details.id);
    });

    registry.set(details.id, { card, details, toggles });
  });

  return registry;
}

function initialiseCatalogue(root: Document | HTMLElement = document) {
  const registry = buildRegistry(root);

  registry.forEach((entry) => {
    const isOpen = entry.card.getAttribute(TOGGLE_ATTR) === 'true';
    updateDetailsState(entry, isOpen);
  });

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const toggle = target.closest<HTMLElement>(TOGGLE_SELECTOR);
    if (!toggle) return;

    const targetId = toggle.dataset.cardTarget ?? toggle.getAttribute('aria-controls');
    if (!targetId) return;

    const entry = registry.get(targetId);
    if (!entry) return;

    const isOpen = entry.card.getAttribute(TOGGLE_ATTR) === 'true';

    registry.forEach((otherEntry, key) => {
      const shouldOpen = key === targetId ? !isOpen : false;
      updateDetailsState(otherEntry, shouldOpen);
    });
  });
}

if (typeof window !== 'undefined') {
  initialiseCatalogue();
}

export { initialiseCatalogue };
