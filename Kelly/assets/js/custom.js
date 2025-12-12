/* assets/js/custom.js
   Minimal placeholder file created per request.
   No functions or runtime behavior added here.
   If you later want small helpers (preloader, audio controls), tell me and
   I will add them in this file only.
*/

// Form submit handling: collect form values, log object, and display at form bottom.
document.addEventListener('DOMContentLoaded', function () {
   'use strict';

   var form = document.querySelector('form.php-email-form');
   if (!form) return; // nothing to do when form not present

   // --- Validation setup ---
   ensureValidationStyle();

   var fieldsToValidate = [
      'first_name',
      'last_name',
      'email',
      'address',
      'q1',
      'q2',
      'q3',
      'phone'
   ];

   // attach real-time listeners
   fieldsToValidate.forEach(function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      if (!el) return;
      var ev = (el.type === 'range' || el.tagName.toLowerCase() === 'select') ? 'change' : 'input';
      el.addEventListener(ev, function () { validateField(el, true); updateSubmitState(); }, { passive: true });
      el.addEventListener('blur', function () { validateField(el, true); updateSubmitState(); }, { passive: true });
   });

   // --- Phone formatting: real-time numeric-only input and automatic formatting to +370 6xx xxxxx ---
   var phoneEl = form.querySelector('[name="phone"]');
   if (phoneEl) {
      phoneEl.setAttribute('inputmode', 'tel');
      phoneEl.setAttribute('maxlength', '20');

      phoneEl.addEventListener('input', function () { phoneFormatHandler(phoneEl); }, { passive: true });
      phoneEl.addEventListener('paste', function (ev) {
         // allow paste then reformat
         setTimeout(function () { phoneFormatHandler(phoneEl); }, 10);
      });

      phoneEl.addEventListener('keydown', function (ev) {
         // allow control keys, digits, navigation
         var allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
         if (allowed.indexOf(ev.key) !== -1) return;
         // allow ctrl/cmd combos
         if (ev.ctrlKey || ev.metaKey) return;
         // allow digits
         if (/^[0-9]$/.test(ev.key)) return;
         // otherwise block
         ev.preventDefault();
      });
   }

   function validateField(el, showErrors) {
      if (typeof showErrors === 'undefined') showErrors = true;
      if (!el) return true;
      var name = el.name;
      var val = (el.value || '').trim();

      // empty detection (all except sliders have this, sliders also validated separately)
      if (!val) {
         if (showErrors) showError(el, 'Laukas negali būti tuščias');
         else clearError(el);
         return false;
      }

      if (name === 'email') {
         var em = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!em.test(val)) {
            if (showErrors) showError(el, 'Įveskite galiojantį el. pašto adresą');
            else clearError(el);
            return false;
         }
      }

      if (name === 'first_name' || name === 'last_name') {
         // allow letters, spaces, hyphens, apostrophes (unicode letters)
         var letters = /^[\p{L}\s'\-]+$/u;
         if (!letters.test(val)) {
            if (showErrors) showError(el, 'Vardas ir pavardė turi būti sudaryti tik iš raidžių');
            else clearError(el);
            return false;
         }
      }

      if (name === 'address') {
         // address must be text — already checked non-empty; ensure not just punctuation
         if (/^[\s\W_]+$/.test(val)) {
            if (showErrors) showError(el, 'Įveskite adresą tekstu');
            else clearError(el);
            return false;
         }
      }

      if (name === 'q1' || name === 'q2' || name === 'q3') {
         var num = parseFloat(val);
         if (isNaN(num) || num < 1 || num > 10) {
            if (showErrors) showError(el, 'Įvertinimas turi būti nuo 1 iki 10');
            else clearError(el);
            return false;
         }
      }

      if (name === 'phone') {
         // extract digits and check Lithuanian mobile pattern: final NSN 8 digits starting with 6
         var digits = (val || '').replace(/\D/g, '');
         // if user pasted with country code (370...), take last 8 digits
         var nsn = digits.slice(-8);
         if (nsn.length !== 8 || nsn.charAt(0) !== '6') {
            if (showErrors) showError(el, 'Įveskite lietuvišką mobilų numerį (+370 6xx xxxxx)');
            else clearError(el);
            return false;
         }
      }

      clearError(el);
      return true;
   }

   // Validate all but optionally silently (no error messages)
   function validateAllSilent() {
      var ok = true;
      fieldsToValidate.forEach(function (name) {
         var el = form.querySelector('[name="' + name + '"]');
         if (el) {
            if (!validateField(el, false)) ok = false;
         }
      });
      return ok;
   }

   // Manage submit button enabled state
   var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
   function updateSubmitState() {
      if (!submitBtn) return;
      try {
         var ok = validateAllSilent();
         submitBtn.disabled = !ok;
      } catch (e) {
         submitBtn.disabled = false;
      }
   }

   // initialize submit button state
   if (submitBtn) submitBtn.disabled = true;

   function validateAll() {
      var ok = true;
      fieldsToValidate.forEach(function (name) {
         var el = form.querySelector('[name="' + name + '"]');
         if (el) {
            if (!validateField(el)) ok = false;
         }
      });
      return ok;
   }

   function showError(el, msg) {
      clearError(el);
      el.classList.add('input-error');
      // create small error message node
      var err = document.createElement('div');
      err.className = 'field-error-text';
      err.textContent = msg;
      // insert after element (for range put after the input)
      if (el.nextSibling) el.parentNode.insertBefore(err, el.nextSibling);
      else el.parentNode.appendChild(err);
   }

   function clearError(el) {
      el.classList.remove('input-error');
      var next = el.nextSibling;
      while (next && (next.nodeType === 3)) { next = next.nextSibling; }
      if (next && next.classList && next.classList.contains('field-error-text')) {
         next.parentNode.removeChild(next);
      }
   }

   function ensureValidationStyle() {
      if (document.getElementById('custom-validate-style')) return;
      var s = document.createElement('style');
      s.id = 'custom-validate-style';
      s.textContent = '\n.input-error{border:2px solid #dc3545 !important;box-shadow:0 4px 12px rgba(220,53,69,0.08) !important;border-radius:6px !important;}\n.field-error-text{color:#dc3545;margin-top:6px;font-size:0.9rem;}\n';
      document.head.appendChild(s);
   }

   // Phone formatter helper
   function phoneFormatHandler(el) {
      if (!el) return;
      var raw = (el.value || '').replace(/\D/g, '');
      // limit digits to country code + 8 = 11 digits
      if (raw.length > 11) raw = raw.slice(0, 11);

      // take last 8 digits as national subscriber number (NSN)
      var nsn = raw.slice(-8);

      // build formatted string: +370 6xx xxxxx (spaces as user types)
      var part1 = nsn.slice(0,3); // 3
      var part2 = nsn.slice(3);   // up to 5
      var formatted = '+370';
      if (part1.length) formatted += ' ' + part1;
      if (part2.length) formatted += ' ' + part2;

      el.value = formatted;
      // clear phone error if formatting produces plausible NSN
      if (nsn.length === 8 && nsn.charAt(0) === '6') clearError(el);
      else showError(el, 'Įveskite lietuvišką mobilų numerį (+370 6xx xxxxx)');
   }

   // Ensure an output container exists (appended to the form)
   var output = form.querySelector('.form-data-output');
   if (!output) {
      output = document.createElement('div');
      output.className = 'form-data-output mt-3 p-3 border rounded bg-light';
      output.style.whiteSpace = 'pre-wrap';
      form.appendChild(output);
   }

   form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var get = function (name) {
         var el = form.querySelector('[name="' + name + '"]');
         return el ? el.value : '';
      };

      var data = {
         vardas: get('first_name'),
         pavarde: get('last_name'),
         email: get('email'),
         telefonas: get('phone'),
         adresas: get('address'),
         klausimas1: get('q1'),
         klausimas2: get('q2'),
         klausimas3: get('q3')
      };

      // Validate all fields before proceeding
      if (!validateAll()) {
         // focus first invalid field
         var firstInvalid = form.querySelector('.input-error');
         if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
         // do not proceed with showing output or popup
         return;
      }

      // Console output
      console.log('Contact form data:', data);

      // Render readable output below the form
      // calculate average of the three questions (as numbers)
      var n1 = parseFloat(data.klausimas1) || 0;
      var n2 = parseFloat(data.klausimas2) || 0;
      var n3 = parseFloat(data.klausimas3) || 0;
      var avg = (n1 + n2 + n3) / 3;
      var avgFormatted = isNaN(avg) ? '' : (Math.round(avg * 10) / 10).toFixed(1);

      output.innerHTML = '<h5>Formos duomenys</h5>' +
         '<ul style="list-style:none;padding:0;margin:0;line-height:1.6">' +
         '<li><strong>Vardas:</strong> ' + escapeHtml(data.vardas) + '</li>' +
         '<li><strong>Pavardė:</strong> ' + escapeHtml(data.pavarde) + '</li>' +
         '<li><strong>El. paštas:</strong> ' + escapeHtml(data.email) + '</li>' +
         '<li><strong>Telefono numeris:</strong> ' + escapeHtml(data.telefonas) + '</li>' +
         '<li><strong>Adresas:</strong> ' + escapeHtml(data.adresas) + '</li>' +
         '<li><strong>Klausimas 1:</strong> ' + escapeHtml(data.klausimas1) + '</li>' +
         '<li><strong>Klausimas 2:</strong> ' + escapeHtml(data.klausimas2) + '</li>' +
         '<li><strong>Klausimas 3:</strong> ' + escapeHtml(data.klausimas3) + '</li>' +
         '</ul>';

      // Display average in the requested format: "Vardas Pavardė: vidurkis"
      if (avgFormatted !== '') {
         var nameLine = '<p class="mt-2"><strong>' + escapeHtml(data.vardas) + ' ' + escapeHtml(data.pavarde) + ':</strong> ' + escapeHtml(avgFormatted) + '</p>';
         output.insertAdjacentHTML('beforeend', nameLine);
      }

      // Show the built-in sent-message area if present
      var sent = form.querySelector('.sent-message');
      if (sent) {
         sent.style.display = 'block';
         sent.textContent = 'Duomenys užfiksuoti ir parodyti žemiau.';
      }

      // Show a styled popup message for successful submission
      showSuccessPopup('Duomenys pateikti sėkmingai!');
   }, false);

   // small helper to avoid HTML injection when rendering
   function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
   }

   // --- Success popup utilities ---
   function ensurePopupElements() {
      if (document.getElementById('custom-success-style')) return;

      // Inject minimal styles for the popup
      var style = document.createElement('style');
      style.id = 'custom-success-style';
      style.textContent = "\
         .custom-success-popup { position: fixed; right: 20px; bottom: 20px; background: #0f5132; color: #fff; padding: 14px 18px; border-radius: 10px; box-shadow: 0 8px 24px rgba(15,81,50,0.22); z-index: 100000; transform: translateY(12px); opacity: 0; transition: transform .28s ease, opacity .28s ease; font-weight:600; }\n\
         .custom-success-popup.show { transform: translateY(0); opacity: 1; }\n\
         .custom-success-popup .close-x { margin-left: 12px; background: transparent; border: 0; color: rgba(255,255,255,0.9); font-size: 16px; cursor: pointer; }\n\
         .custom-success-popup[role] { outline: none; }\n+    ";
      document.head.appendChild(style);

      var popup = document.createElement('div');
      popup.id = 'custom-success-popup';
      popup.className = 'custom-success-popup';
      popup.setAttribute('role', 'status');
      popup.setAttribute('aria-live', 'polite');
      popup.style.display = 'none';
      document.body.appendChild(popup);
   }

   function showSuccessPopup(message, timeout) {
      ensurePopupElements();
      var popup = document.getElementById('custom-success-popup');
      if (!popup) return;
      popup.innerHTML = '<span class="msg">' + escapeHtml(message) + '</span>' +
         '<button class="close-x" aria-label="Uždaryti">✕</button>';
      popup.style.display = 'block';
      // force reflow to enable transition
      void popup.offsetWidth;
      popup.classList.add('show');

      // close handler
      var btn = popup.querySelector('.close-x');
      var hide = function () {
         popup.classList.remove('show');
         window.setTimeout(function () { if (popup) popup.style.display = 'none'; }, 300);
      };
      if (btn) btn.addEventListener('click', hide, { once: true });

      // auto-hide after timeout (default 4s)
      timeout = typeof timeout === 'number' ? timeout : 4000;
      window.setTimeout(function () {
         hide();
      }, timeout);
   }

});

