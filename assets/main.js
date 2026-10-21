/* Content and navigation work without JavaScript. */
(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  let chosenTheme;
  try {
    const storedTheme = window.localStorage.getItem('portfolio-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') chosenTheme = storedTheme;
  } catch {
    // Storage may be blocked; theme switching still works for this visit.
  }
  function applyTheme() {
    const dark = chosenTheme ? chosenTheme === 'dark' : preference.matches;
    root.dataset.theme = dark ? 'dark' : 'light';
    themeButton?.setAttribute('aria-pressed', String(dark));
  }
  applyTheme();
  preference.addEventListener('change', applyTheme);
  if (themeButton) {
    themeButton.hidden = false;
    themeButton.addEventListener('click', () => {
      chosenTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      try {
        window.localStorage.setItem('portfolio-theme', chosenTheme);
      } catch {
        // Saving a preference is optional.
      }
    });
  }
  const printButton = document.querySelector('.print-button');
  if (printButton) {
    printButton.hidden = false;
    printButton.addEventListener('click', () => window.print());
  }
  const stages = {
    text: 'Text starts the task: a post, sentence or document becomes the input.',
    language: 'Language provides context: multilingual tasks must account for different vocabularies and scripts.',
    patterns: 'Patterns are representations learned or constructed from text to support the classification task.',
    classes: 'Classes are the defined output categories. Their usefulness depends on the task and its evaluation.',
  };
  const stageButtons = [...document.querySelectorAll('[data-stage]')];
  const languageDetail = document.querySelector('#language-detail');
  if (languageDetail) {
    function selectStage(button) {
      stageButtons.forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === button)));
      languageDetail.textContent = stages[button.dataset.stage];
    }
    stageButtons.forEach(button => {
      button.disabled = false;
      button.addEventListener('click', () => selectStage(button));
      button.addEventListener('focus', () => selectStage(button));
    });
  }
  const links = [...document.querySelectorAll('.section-nav a')];
  const sections = links.map(link => document.querySelector(link.hash));
  if (sections.length) {
    let pending = false;
    function updateSection() {
      let activeIndex = 0;
      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top <= window.innerHeight * 0.35) activeIndex = index;
      });
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) activeIndex = sections.length - 1;
      links.forEach((link, index) => {
        if (index === activeIndex) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      pending = false;
    }
    window.addEventListener('scroll', () => {
      if (!pending) {
        pending = true;
        window.requestAnimationFrame(updateSection);
      }
    }, { passive: true });
    window.addEventListener('resize', updateSection);
    updateSection();
  }
})();
