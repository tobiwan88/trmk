class I18n {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.init();
  }

  detectLanguage() {
    // Priority: localStorage > browser setting > default
    const stored = localStorage.getItem('preferredLanguage');
    if (stored && ['en', 'de'].includes(stored)) {
      return stored;
    }

    const browserLang = navigator.language.slice(0, 2);
    return ['en', 'de'].includes(browserLang) ? browserLang : 'en';
  }

  init() {
    this.applyTranslations();
    this.updateHtmlLang();
    this.updateMetaTags();
    this.setupLanguageSelector();
  }

  applyTranslations() {
    // Handle text content
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getNestedTranslation(key);
      if (translation) {
        element.textContent = translation;
      }
    });

    // Handle placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translation = this.getNestedTranslation(key);
      if (translation) {
        element.placeholder = translation;
      }
    });

    // Handle aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      const translation = this.getNestedTranslation(key);
      if (translation) {
        element.setAttribute('aria-label', translation);
      }
    });

    // Handle meta content
    document.querySelectorAll('[data-i18n-content]').forEach(element => {
      const key = element.getAttribute('data-i18n-content');
      const translation = this.getNestedTranslation(key);
      if (translation) {
        element.setAttribute('content', translation);
      }
    });
  }

  getNestedTranslation(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], translations[this.currentLang]);
  }

  updateHtmlLang() {
    document.documentElement.lang = this.currentLang;
  }

  updateMetaTags() {
    // Update meta description
    const descMeta = document.querySelector('meta[name="description"]');
    const descKey = descMeta?.getAttribute('data-i18n-content');
    if (descKey) {
      const translation = this.getNestedTranslation(descKey);
      if (translation) {
        descMeta.content = translation;
      }
    }

    // Update page title
    const titleElement = document.querySelector('title');
    const titleKey = titleElement?.getAttribute('data-i18n');
    if (titleKey) {
      const translation = this.getNestedTranslation(titleKey);
      if (translation) {
        titleElement.textContent = translation;
      }
    }

    // Update Open Graph locale
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) {
      ogLocale.content = this.currentLang === 'de' ? 'de_DE' : 'en_US';
    }
  }

  setupLanguageSelector() {
    // Setup desktop language selector
    const selector = document.getElementById('language-selector');
    if (selector) {
      selector.value = this.currentLang;
      selector.addEventListener('change', (e) => {
        this.switchLanguage(e.target.value);
      });
    }

    // Setup mobile language selector
    const mobileSelector = document.getElementById('language-selector-mobile');
    if (mobileSelector) {
      mobileSelector.value = this.currentLang;
      mobileSelector.addEventListener('change', (e) => {
        this.switchLanguage(e.target.value);
      });
    }
  }

  switchLanguage(lang) {
    if (!['en', 'de'].includes(lang)) return;

    this.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
    this.applyTranslations();
    this.updateHtmlLang();
    this.updateMetaTags();

    // Update both desktop and mobile language selector values
    const selector = document.getElementById('language-selector');
    if (selector) {
      selector.value = lang;
    }

    const mobileSelector = document.getElementById('language-selector-mobile');
    if (mobileSelector) {
      mobileSelector.value = lang;
    }

    // Announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = lang === 'en'
      ? 'Language changed to English'
      : 'Sprache geändert zu Deutsch';
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }
}

// Initialize i18n when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.i18n = new I18n();
});
