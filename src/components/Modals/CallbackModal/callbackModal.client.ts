const MODAL_ROOT_SELECTOR = "[data-callback-modal-root]";
const TRIGGER_SELECTOR = "[data-callback-trigger]";
const CALLBACK_ENDPOINT = import.meta.env.PUBLIC_CALLBACK_ENDPOINT;

interface CallbackPayload {
  name: string;
  phone: string;
}

let openModalHandler: (() => void) | null = null;
let closeModalHandler: (() => void) | null = null;
let keydownBound = false;

const focusFirstInput = (form: HTMLFormElement | null) => {
  const firstInput = form?.querySelector<HTMLElement>("input, textarea, select");
  firstInput?.focus({ preventScroll: true });
};

const submitCallbackForm = async (
  event: SubmitEvent,
  form: HTMLFormElement,
  submitButton: HTMLButtonElement | null,
  successMessage: HTMLElement | null,
  errorMessage: HTMLElement | null
) => {
  event.preventDefault();

  successMessage?.setAttribute("hidden", "");
  errorMessage?.setAttribute("hidden", "");

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.dataset.loading = "true";
  }

  const formData = new FormData(form);
 const payload: CallbackPayload = {
    name: (formData.get("name") ?? "").toString().trim(),
    phone: (formData.get("phone") ?? "").toString().trim(),
  };

  if (!CALLBACK_ENDPOINT) {
    console.error('PUBLIC_CALLBACK_ENDPOINT is not set; cannot submit callback form.');
    errorMessage?.removeAttribute("hidden");
    if (submitButton) {
      submitButton.disabled = false;
      delete submitButton.dataset.loading;
    }
    return;
  }

  try {
    const endpointUrl = new URL(CALLBACK_ENDPOINT, window.location.href);
    const isCrossOrigin = endpointUrl.origin !== window.location.origin;

    const requestInit: RequestInit = {
      method: "POST",
    };

    if (isCrossOrigin) {
      const searchParams = new URLSearchParams({
        name: payload.name,
        phone: payload.phone,
        timestamp: new Date().toISOString(),
      });
      requestInit.body = searchParams.toString();
      requestInit.headers = {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      };
      requestInit.mode = "no-cors";
    } else {
      requestInit.body = JSON.stringify(payload);
      requestInit.headers = {
        "Content-Type": "application/json",
      };
    }

    const response = await fetch(CALLBACK_ENDPOINT, requestInit);

    if (!requestInit.mode && !response.ok) {
      throw new Error(await response.text());
    }

    form.reset();
    form.setAttribute("hidden", "");
    successMessage?.removeAttribute("hidden");
  } catch (error) {
    console.error("callback request failed", error);
    errorMessage?.removeAttribute("hidden");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      delete submitButton.dataset.loading;
    }
  }
};

const setupModal = () => {
  const root = document.querySelector<HTMLElement>(MODAL_ROOT_SELECTOR);
  if (!root) {
    openModalHandler = null;
    closeModalHandler = null;
    return;
  }

  if (root.dataset.callbackModalInitialised === "true") {
    return;
  }

  const form = root.querySelector<HTMLFormElement>("[data-modal-form]");
  const successMessage = root.querySelector<HTMLElement>("[data-modal-success]");
  const errorMessage = root.querySelector<HTMLElement>("[data-modal-error]");
  const closeButtons = root.querySelectorAll<HTMLButtonElement>("[data-modal-close]");
  const submitButton = form?.querySelector<HTMLButtonElement>("[type='submit']");
  const burgerToggle = document.getElementById("burger") as HTMLInputElement | null;

  let lastActiveElement: HTMLElement | null = null;

  const openModal = () => {
    lastActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (burgerToggle?.checked) {
      burgerToggle.checked = false;
      burgerToggle.dispatchEvent(new Event("change", { bubbles: true }));
    }

    form?.removeAttribute("hidden");
    successMessage?.setAttribute("hidden", "");
    errorMessage?.setAttribute("hidden", "");

    root.setAttribute("data-open", "true");
    root.setAttribute("aria-hidden", "false");

    focusFirstInput(form ?? null);
  };

  const closeModal = () => {
    root.setAttribute("data-open", "false");
    root.setAttribute("aria-hidden", "true");

    const target = lastActiveElement;
    lastActiveElement = null;

    if (target) {
      target.focus({ preventScroll: true });
    } else {
      const triggers = document.querySelectorAll<HTMLElement>(TRIGGER_SELECTOR);
      triggers[0]?.focus({ preventScroll: true });
    }
  };

  openModalHandler = openModal;
  closeModalHandler = closeModal;

  root.addEventListener("click", (event) => {
    if (event.target === root) {
      closeModalHandler?.();
    }
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => closeModalHandler?.());
  });

  form?.addEventListener(("submit" as const), (event) =>
    submitCallbackForm(event, form, submitButton ?? null, successMessage ?? null, errorMessage ?? null)
  );

  root.dataset.callbackModalInitialised = "true";
};

const bindTriggers = () => {
  if (!openModalHandler) {
    return;
  }

  document.querySelectorAll<HTMLElement>(TRIGGER_SELECTOR).forEach((trigger) => {
    if (trigger.dataset.callbackTriggerBound === "true") {
      return;
    }

    trigger.dataset.callbackTriggerBound = "true";
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModalHandler?.();
    });
  });
};

const initialise = () => {
  setupModal();
  bindTriggers();

  if (!keydownBound) {
    keydownBound = true;
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        const root = document.querySelector<HTMLElement>(MODAL_ROOT_SELECTOR);
        if (root?.getAttribute("data-open") === "true") {
          closeModalHandler?.();
        }
      }
    });
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialise);
} else {
  initialise();
}

document.addEventListener("astro:after-swap", () => {
  setupModal();
  bindTriggers();
});

export default initialise;
