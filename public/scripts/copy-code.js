const resetDelay = 1800;

function copyWithSelection(value) {
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  return copied;
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Some browsers expose the API while denying clipboard permission.
    }
  }

  return copyWithSelection(value);
}

document.querySelectorAll("[data-copy-button]").forEach((button) => {
  button.addEventListener("click", async () => {
    const container = button.closest(".copyable-code");
    const code = container?.querySelector("code");
    const status = container?.querySelector("[data-copy-status]");
    const value = code?.textContent ?? "";
    const originalLabel = button.getAttribute("aria-label") ?? "Copy text";

    try {
      if (!(await copyText(value))) {
        throw new Error("Clipboard unavailable");
      }

      button.textContent = "Copied";
      if (status) status.textContent = `${originalLabel.replace(/^Copy /, "")} copied.`;
    } catch {
      button.textContent = "Failed";
      if (status) status.textContent = "Copy failed. Select the text and copy it manually.";
    }

    window.setTimeout(() => {
      button.textContent = "Copy";
      if (status) status.textContent = "";
    }, resetDelay);
  });
});
