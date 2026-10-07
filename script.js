/* =========================================================
   script.js — поведение лендинга вайбкодера
   1) Мобильное меню
   2) Плавная прокрутка по якорям
   3) Анимации появления блоков
   4) Валидация формы заявки
   5) Кнопки «Посмотреть проект»
   6) Год в подвале
   ========================================================= */

(function () {
  "use strict";

  /* ----- Утилиты ----- */
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  /* ----- 1. Мобильное меню ----- */
  var burger = qs("#burger");
  var nav = qs("#nav");

  function closeMenu() {
    if (!nav || !burger) return;
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
  }

  function toggleMenu() {
    if (!nav || !burger) return;
    var open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  }

  if (burger && nav) {
    burger.addEventListener("click", toggleMenu);

    // Закрываем меню после выбора пункта
    qsa(".nav__link", nav).forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    // Закрытие по Escape
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });
  }

  /* ----- 2. Плавная прокрутка к разделам ----- */
  // Учитываем высоту липкой шапки, чтобы заголовок не прятался под header
  function getHeaderOffset() {
    var header = qs(".header");
    return header ? header.offsetHeight + 8 : 80;
  }

  function scrollToTarget(hash) {
    if (!hash || hash === "#") return false;
    var target = qs(hash);
    if (!target) return false;

    var top = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();
    window.scrollTo({ top: top, behavior: "smooth" });
    return true;
  }

  qsa('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      var hash = anchor.getAttribute("href");
      if (scrollToTarget(hash)) {
        event.preventDefault();
        // Обновляем адрес без рывка страницы
        if (history.pushState) {
          history.pushState(null, "", hash);
        }
      }
    });
  });

  /* ----- 3. Появление блоков при прокрутке ----- */
  var revealItems = qsa(".reveal");

  if ("IntersectionObserver" in window && revealItems.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Старые браузеры — показываем сразу
    revealItems.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ----- Toast и кнопки проектов ----- */
  var toast = qs("#toast");
  var toastTimer;

  function showToast(text) {
    if (!toast) return;
    toast.hidden = false;
    toast.textContent = text;
    requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-visible");
      setTimeout(function () {
        toast.hidden = true;
      }, 350);
    }, 3200);
  }

  /* ----- 4. Валидация формы заявки ----- */
  var form = qs("#lead-form");
  var formStatus = qs("#form-status");

  function setError(input, errorEl, message) {
    input.classList.add("is-invalid");
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(input, errorEl) {
    input.classList.remove("is-invalid");
    if (errorEl) errorEl.textContent = "";
  }

  function validateField(input, errorEl, label) {
    var value = (input.value || "").trim();
    if (!value) {
      setError(input, errorEl, "Заполните поле «" + label + "»");
      return false;
    }
    clearError(input, errorEl);
    return true;
  }

  if (form) {
    var nameInput = qs("#name", form);
    var contactInput = qs("#contact-method", form);
    var contactDetailInput = qs("#contact-detail", form);
    var taskInput = qs("#task", form);
    var privacyInput = qs("#privacy", form);
    var nameError = qs("#name-error", form);
    var contactError = qs("#contact-error", form);
    var contactDetailError = qs("#contact-detail-error", form);
    var taskError = qs("#task-error", form);
    var privacyError = qs("#privacy-error", form);

    // Подсказки для поля «Ваш контакт» в зависимости от способа связи
    function updateContactPlaceholder() {
      if (!contactDetailInput || !contactInput) return;
      var method = contactInput.value;
      if (method === "Почта") {
        contactDetailInput.placeholder = "Ваш email для ответа";
        contactDetailInput.setAttribute("autocomplete", "email");
        contactDetailInput.setAttribute("type", "email");
      } else {
        contactDetailInput.placeholder = "Ник в Telegram или телефон";
        contactDetailInput.setAttribute("autocomplete", "username");
        contactDetailInput.setAttribute("type", "text");
      }
    }

    if (contactInput) {
      contactInput.addEventListener("change", function () {
        clearError(contactInput, contactError);
        updateContactPlaceholder();
      });
    }

    if (privacyInput) {
      privacyInput.addEventListener("change", function () {
        if (privacyInput.checked) clearError(privacyInput, privacyError);
      });
    }

    // Сбрасываем ошибку при вводе
    [
      [nameInput, nameError],
      [contactDetailInput, contactDetailError],
      [taskInput, taskError],
    ].forEach(function (pair) {
      if (!pair[0]) return;
      pair[0].addEventListener("input", function () {
        if (pair[0].value.trim()) clearError(pair[0], pair[1]);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var okName = validateField(nameInput, nameError, "Имя");
      var okContact = validateField(contactInput, contactError, "Способ связи");
      var okDetail = validateField(contactDetailInput, contactDetailError, "Ваш контакт");
      var okTask = validateField(taskInput, taskError, "Краткое описание задачи");
      var okPrivacy = true;
      if (privacyInput && !privacyInput.checked) {
        setError(privacyInput, privacyError, "Чтобы отправить заявку, нужно согласие на обработку персональных данных");
        okPrivacy = false;
      } else if (privacyInput) {
        clearError(privacyInput, privacyError);
      }

      if (!(okName && okContact && okDetail && okTask && okPrivacy)) {
        if (formStatus) {
          formStatus.textContent = "Проверьте обязательные поля.";
          formStatus.className = "form__hint is-error";
        }
        var firstInvalid = qs(".is-invalid", form);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var method = contactInput.value.trim();
      var detail = contactDetailInput.value.trim();
      var message =
        "Имя: " + nameInput.value.trim() +
        "\nСпособ связи: " + method +
        "\nКонтакт: " + detail +
        "\nОписание задачи: " + taskInput.value.trim();

      var mailUrl =
        "mailto:y-kopasova@inbox.ru" +
        "?subject=" + encodeURIComponent("Заявка с сайта Юлии Копасовой") +
        "&body=" + encodeURIComponent(message);

      if (formStatus) {
        formStatus.textContent =
          "Письмо подготовлено. Если почтовая программа не открылась, напишите мне в Telegram";
        formStatus.className = "form__hint is-success";
      }

      window.location.href = mailUrl;
    });
  }

  qsa(".project-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var title = btn.getAttribute("data-project") || "Проект";
      showToast(title + " ещё готовится. Напишите — расскажу детали или обсудим ваш кейс.");
    });
  });

  /* ----- 6. Год в подвале ----- */
  var yearEl = qs("#year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
