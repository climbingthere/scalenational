/* ===== Scale National — Contractor Onboarding JS ===== */

(function () {
  'use strict';

  // ── Helpers ──
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // ── Progress bar fill ──
  function initProgress() {
    const fill = $('.line-fill');
    if (!fill) return;
    const page = document.body.dataset.page;
    const pct = page === 'intake' ? 0 : page === 'contract' ? 50 : 100;
    requestAnimationFrame(() => {
      fill.style.width = pct + '%';
    });
  }

  // ── LocalStorage helpers ──
  const STORAGE_KEY = 'sn_onboarding';

  function saveData(obj) {
    const existing = loadData();
    const merged = { ...existing, ...obj };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }

  function loadData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  // ── Validation ──
  function validateField(input) {
    const wrap = input.closest('.field') || input.parentElement;
    const errEl = wrap ? wrap.querySelector('.error-msg') : null;
    let valid = true;
    let msg = '';

    if (input.hasAttribute('required') && !input.value.trim()) {
      valid = false;
      msg = 'This field is required';
    } else if (input.type === 'email' && input.value.trim()) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(input.value.trim())) { valid = false; msg = 'Enter a valid email'; }
    } else if (input.type === 'tel' && input.value.trim()) {
      const digits = input.value.replace(/\D/g, '');
      if (digits.length < 10) { valid = false; msg = 'Enter a valid phone number'; }
    }

    if (!valid) {
      input.classList.add('error');
      if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
    } else {
      input.classList.remove('error');
      if (errEl) { errEl.classList.remove('show'); }
    }
    return valid;
  }

  function validateForm(form) {
    let firstBad = null;
    const inputs = $$('input[required], select[required], textarea[required]', form);
    inputs.forEach(inp => {
      if (!validateField(inp) && !firstBad) firstBad = inp;
    });

    // Package selection
    const pkgInputs = $$('input[name="package"]', form);
    if (pkgInputs.length && !pkgInputs.some(r => r.checked)) {
      const section = pkgInputs[0].closest('.form-section');
      if (section && !firstBad) firstBad = section;
      pkgInputs.forEach(r => {
        r.closest('.package-card').style.borderColor = 'var(--danger)';
      });
    }

    if (firstBad) {
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (firstBad.focus) firstBad.focus();
      return false;
    }
    return true;
  }

  // ── Intake form ──
  function initIntake() {
    const form = $('#intakeForm');
    if (!form) return;

    // Live validation on blur
    $$('input, select, textarea', form).forEach(inp => {
      inp.addEventListener('blur', () => validateField(inp));
    });

    // Package card selection
    $$('.package-card', form).forEach(card => {
      card.addEventListener('click', () => {
        $$('.package-card', form).forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        card.querySelector('input[type="radio"]').checked = true;
        // clear error style
        $$('.package-card', form).forEach(c => c.style.borderColor = '');
      });
    });

    // Other service toggle
    const otherCb = $('#service-other');
    const otherField = $('.other-field');
    if (otherCb && otherField) {
      otherCb.addEventListener('change', () => {
        otherField.classList.toggle('show', otherCb.checked);
      });
    }

    // Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;

      // Gather data
      const fd = new FormData(form);
      const data = {};
      fd.forEach((v, k) => {
        if (data[k]) {
          if (!Array.isArray(data[k])) data[k] = [data[k]];
          data[k].push(v);
        } else {
          data[k] = v;
        }
      });

      // Package details
      const pkgMap = {
        starter: { name: 'Starter', price: '$297/mo' },
        growth: { name: 'Growth', price: '$397/mo' },
        scale: { name: 'Scale', price: '$597/mo' }
      };
      const pkg = pkgMap[data.package] || {};
      data.packageName = pkg.name || '';
      data.packagePrice = pkg.price || '';

      saveData(data);
      window.location.href = 'contract.html';
    });
  }

  // ── Contract page ──
  function initContract() {
    if (document.body.dataset.page !== 'contract') return;

    const data = loadData();

    // Summary
    const bizEl = $('#summaryBiz');
    const pkgEl = $('#summaryPkg');
    if (bizEl) bizEl.textContent = data.businessName || 'Your Business';
    if (pkgEl) pkgEl.textContent = (data.packageName || 'Selected Package') + ' at ' + (data.packagePrice || '$—/mo');

    // Date auto-fill
    const dateInput = $('#sigDate');
    if (dateInput) {
      const now = new Date();
      dateInput.value = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // Agree checkbox
    const agreeCb = $('#agreeTerms');
    const agreeRow = agreeCb ? agreeCb.closest('.agree-row') : null;
    if (agreeRow) {
      agreeRow.addEventListener('click', (e) => {
        if (e.target !== agreeCb) agreeCb.checked = !agreeCb.checked;
      });
    }

    // Submit
    const form = $('#contractForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate agree
      if (!agreeCb.checked) {
        agreeCb.style.borderColor = 'var(--danger)';
        agreeCb.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const sigName = $('#sigName');
      if (!sigName || !sigName.value.trim()) {
        sigName.classList.add('error');
        sigName.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Save signature data
      saveData({
        signatureName: sigName.value.trim(),
        signedDate: $('#sigDate').value,
        signedTimestamp: new Date().toISOString()
      });

      window.location.href = 'confirmation.html';
    });
  }

  // ── Confirmation page ──
  function initConfirmation() {
    if (document.body.dataset.page !== 'confirmation') return;

    const data = loadData();

    const heading = $('#confirmHeading');
    if (heading) heading.textContent = "You're All Set, " + (data.businessName || 'Partner') + '!';

    const els = {
      '#sumBiz': data.businessName,
      '#sumPkg': data.packageName,
      '#sumPrice': data.packagePrice,
      '#sumDate': data.signedDate
    };

    Object.entries(els).forEach(([sel, val]) => {
      const el = $(sel);
      if (el) el.textContent = val || '—';
    });
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    initProgress();
    initIntake();
    initContract();
    initConfirmation();
  });
})();
