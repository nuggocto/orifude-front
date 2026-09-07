if (navigator.clipboard?.writeText) {
  for (const command of document.querySelectorAll('[data-command]')) {
    const button = command.querySelector('button');
    const code = command.querySelector('code');
    const status = command.querySelector('[role="status"]');
    if (!button || !code || !status) continue;
    button.hidden = false;
    button.addEventListener('click', async () => {
      if (button.getAttribute('aria-disabled') === 'true') return;
      button.setAttribute('aria-disabled', 'true');
      status.textContent = '';
      try {
        await navigator.clipboard.writeText(code.textContent);
        status.textContent = 'Copied';
      } catch {
        status.textContent = 'Could not copy. Select the command and copy it manually.';
      } finally {
        button.removeAttribute('aria-disabled');
      }
    });
  }
}
