(function($) {
  "use strict"; // Start of use strict
  var languageData = null;
  var currentLang = "hu";
  var LANG_STORAGE_KEY = "cserevarLang";
  var SUPPORTED_LANGS = ["hu", "ro", "en"];

  function loadJSON(file, onSuccess, onFail) {
    var finished = false;
    function doneOk(text) {
      if (finished) {
        return;
      }
      finished = true;
      onSuccess(text);
    }
    function doneFail() {
      if (finished) {
        return;
      }
      finished = true;
      if (typeof onFail === "function") {
        onFail();
      }
    }
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.onreadystatechange = function() {
      if (xobj.readyState !== 4) {
        return;
      }
      var text = xobj.responseText;
      // file:// often yields status 0 on success; HTTP uses 200
      if (text && (xobj.status === 200 || xobj.status === 0)) {
        doneOk(text);
      } else {
        doneFail();
      }
    };
    xobj.onerror = doneFail;
    xobj.open("GET", file, true);
    try {
      xobj.send(null);
    } catch (err) {
      doneFail();
    }
  }

  function normalizeLang(lang) {
    if (typeof lang !== "string") {
      return "hu";
    }
    var lower = lang.toLowerCase();
    if (SUPPORTED_LANGS.indexOf(lower) !== -1) {
      return lower;
    }
    return "hu";
  }

  function setDocumentLang(lang) {
    var map = { hu: "hu", ro: "ro", en: "en" };
    document.documentElement.setAttribute("lang", map[lang] || "hu");
  }

  function getI18nKey($el) {
    var node = $el[0];
    if (!node || typeof node.getAttribute !== "function") {
      return "";
    }
    var k = node.getAttribute("data-i18n");
    if (k) {
      return k;
    }
    k = node.getAttribute("key");
    return k || "";
  }

  function applyLanguage(lang) {
    if (!languageData || typeof languageData !== "object" || !languageData.hu) {
      return;
    }
    lang = normalizeLang(lang);
    currentLang = lang;

    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (err) {
      // ignore quota / private mode
    }

    setDocumentLang(lang);

    $(".lang").each(function() {
      var $el = $(this);
      var key = getI18nKey($el);
      if (!key) {
        return;
      }
      var val = getTranslatedValue(lang, key);
      if ($el.attr("data-i18n-html") === "true") {
        $el.html(val);
      } else {
        $el.text(val);
      }
    });

    $(".placeholder").each(function() {
      var $el = $(this);
      var key = getI18nKey($el);
      if (!key) {
        return;
      }
      $el.attr("placeholder", getTranslatedValue(lang, key));
    });

    $("[data-i18n-aria]").each(function() {
      var $el = $(this);
      var key = $el.attr("data-i18n-aria");
      if (!key) {
        return;
      }
      $el.attr("aria-label", getTranslatedValue(lang, key));
    });

    $(".js-lang-select").each(function() {
      var $btn = $(this);
      var isActive = $btn.attr("data-lang") === lang;
      $btn.toggleClass("active", isActive);
      $btn.attr("aria-pressed", isActive ? "true" : "false");
    });

    updateActivityReadMoreButtons();

    try {
      if (typeof $.fn.scrollspy === "function") {
        $("body").scrollspy("refresh");
      }
    } catch (err) {
      /* ignore */
    }
  }

  function load() {
    loadJSON(
      "./js/language.json",
      function(response) {
        try {
          languageData = JSON.parse(response);
        } catch (err) {
          languageData = null;
          initActivityTimelineExpanders();
          updateActivityReadMoreButtons();
          return;
        }
        if (!languageData || !languageData.hu) {
          languageData = null;
          initActivityTimelineExpanders();
          updateActivityReadMoreButtons();
          return;
        }
        var stored = "hu";
        try {
          stored = normalizeLang(localStorage.getItem(LANG_STORAGE_KEY));
        } catch (err) {
          stored = "hu";
        }
        applyLanguage(stored);
        initActivityTimelineExpanders();
        updateActivityReadMoreButtons();
      },
      function() {
        languageData = null;
        initActivityTimelineExpanders();
        updateActivityReadMoreButtons();
      }
    );
  }

  load();

  function isPlaceholderValue(value) {
    if (typeof value !== 'string') {
      return false;
    }

    var normalizedValue = value.trim().toLowerCase();
    return (
      normalizedValue === '' ||
      normalizedValue === 'text here' ||
      normalizedValue.indexOf('text ') === 0 ||
      normalizedValue.indexOf('itt irj') === 0
    );
  }

  function getTranslatedValue(lang, key) {
    if (!languageData || typeof languageData !== "object") {
      return "";
    }
    var selectedLanguage = languageData[lang] || {};
    var fallbackLanguage = languageData.hu || {};
    var selectedValue = selectedLanguage[key];
    var fallbackValue = fallbackLanguage[key];

    if (typeof selectedValue === 'string' && !isPlaceholderValue(selectedValue)) {
      return selectedValue;
    }

    if (typeof fallbackValue === 'string') {
      return fallbackValue;
    }

    return selectedValue || '';
  }

  // Smooth scrolling using jQuery easing
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html, body').animate({
          scrollTop: (target.offset().top - 54)
        }, 1000, "easeInOutExpo");
        return false;
      }
    }
  });

  // Closes responsive menu when a scroll trigger link is clicked
  $('.js-scroll-trigger').click(function() {
    $('.navbar-collapse').collapse('hide');
  });

  // Explicit mobile menu toggle fallback (in case data attributes are obstructed)
  $('.navbar-toggler').on('click', function(event) {
    event.preventDefault();
    $('#navbarResponsive').collapse('toggle');
  });

  // Activate scrollspy to add active class to navbar items on scroll
  $('body').scrollspy({
    target: '#mainNav',
    offset: 56
  });

  // Collapse Navbar
  var navbarCollapse = function() {
    if ($("#mainNav").offset().top > 100) {
      $("#mainNav").addClass("navbar-shrink");
    } else {
      $("#mainNav").removeClass("navbar-shrink");
    }
  };
  // Collapse now if page is not at top
  navbarCollapse();
  // Collapse the navbar when page is scrolled
  $(window).scroll(navbarCollapse);

  // Hide navbar when modals trigger
  $('.portfolio-modal').on('show.bs.modal', function(e) {
    $('.navbar').addClass('d-none');
  });
  $('.portfolio-modal').on('hidden.bs.modal', function(e) {
    $('.navbar').removeClass('d-none');
  });

  $(document).on("click", ".js-lang-select", function(e) {
    e.preventDefault();
    var lang = $(this).attr("data-lang");
    applyLanguage(lang);
    if (window.innerWidth < 992) {
      $("#navbarResponsive").collapse("hide");
    }
  });

  function getActivityExpandLabels() {
    var more = getTranslatedValue(currentLang, "activity_expand_more");
    var less = getTranslatedValue(currentLang, "activity_expand_less");
    if (!more) {
      more =
        (languageData && languageData.hu && languageData.hu.activity_expand_more) ||
        "Tudj meg többet";
    }
    if (!less) {
      less =
        (languageData && languageData.hu && languageData.hu.activity_expand_less) || "Bezár";
    }
    return { more: more, less: less };
  }

  function updateActivityReadMoreButtons() {
    var labels = getActivityExpandLabels();
    $("#activity .timeline-read-more").each(function() {
      var $btn = $(this);
      var $tb = $btn.closest(".timeline-body");
      var collapsed = $tb.hasClass("is-collapsed");
      $btn.text(collapsed ? labels.more : labels.less);
      $btn.attr("aria-expanded", collapsed ? "false" : "true");
    });
  }

  function initActivityTimelineExpanders() {
    var maxCollapsedPx = 132;

    $("#activity .activity-timeline .timeline-body").each(function() {
      var $tb = $(this);

      if ($tb.data("timelineExpandProcessed")) {
        return;
      }
      $tb.data("timelineExpandProcessed", true);

      if ($tb.find(".activity-embed").length) {
        return;
      }

      var $children = $tb.children();
      if (!$children.length) {
        return;
      }

      $children.wrapAll('<div class="timeline-body-expandable-inner"></div>');
      var $inner = $tb.children(".timeline-body-expandable-inner").first();

      if (!$inner.length || $inner[0].scrollHeight <= maxCollapsedPx) {
        $inner.replaceWith($inner.contents());
        return;
      }

      $tb.addClass("timeline-body--collapsible is-collapsed");
      var labels = getActivityExpandLabels();
      var $btn = $('<button type="button" class="btn btn-link timeline-read-more p-0"></button>')
        .text(labels.more)
        .attr("aria-expanded", "false");

      $btn.on("click", function(e) {
        e.preventDefault();
        var $body = $(this).closest(".timeline-body");
        $body.toggleClass("is-collapsed");
        var L = getActivityExpandLabels();
        $(this).text($body.hasClass("is-collapsed") ? L.more : L.less);
        $(this).attr("aria-expanded", $body.hasClass("is-collapsed") ? "false" : "true");
      });

      $tb.append($btn);
    });
  }

  function initModernGallery() {
    var $gallery = $('.popup-gallery');

    if (!$gallery.length || typeof Swiper === 'undefined') {
      return;
    }

    $gallery.removeClass('row no-gutters').addClass('swiper-wrapper');

    $gallery.children('div').each(function() {
      $(this)
        .removeClass('col-lg-2 col-md-4 col-sm-6')
        .addClass('swiper-slide');
    });

    $gallery.wrap('<div class="swiper gallery-swiper"></div>');
    var $swiperContainer = $gallery.parent();

    $swiperContainer.append('<div class="swiper-button-prev gallery-swiper-prev" aria-label="Previous slide"></div>');
    $swiperContainer.append('<div class="swiper-button-next gallery-swiper-next" aria-label="Next slide"></div>');
    $swiperContainer.append('<div class="swiper-pagination gallery-swiper-pagination"></div>');

    var gallerySwiper = new Swiper('.gallery-swiper', {
      loop: true,
      speed: 700,
      spaceBetween: 10,
      grabCursor: true,
      watchSlidesProgress: true,
      centeredSlides: false,
      effect: 'slide',
      touchStartPreventDefault: false,
      touchReleaseOnEdges: true,
      keyboard: {
        enabled: true
      },
      autoplay: {
        delay: 2800,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      navigation: {
        nextEl: '.gallery-swiper-next',
        prevEl: '.gallery-swiper-prev'
      },
      pagination: {
        el: '.gallery-swiper-pagination',
        clickable: true,
        dynamicBullets: true,
        dynamicMainBullets: 3
      },
      breakpoints: {
        0: {
          slidesPerView: 1,
          spaceBetween: 10,
          centeredSlides: false,
          effect: 'slide'
        },
        420: {
          slidesPerView: 1.1,
          spaceBetween: 12,
          centeredSlides: false,
          effect: 'slide'
        },
        576: {
          slidesPerView: 1.6,
          spaceBetween: 14,
          centeredSlides: true,
          effect: 'coverflow',
          coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 70,
            modifier: 1.05,
            slideShadows: false
          }
        },
        992: {
          slidesPerView: 3.2,
          spaceBetween: 16,
          centeredSlides: true,
          effect: 'coverflow',
          coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 120,
            modifier: 1.15,
            slideShadows: false
          }
        },
        1400: {
          slidesPerView: 4.2,
          spaceBetween: 16,
          centeredSlides: true,
          effect: 'coverflow',
          coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 120,
            modifier: 1.15,
            slideShadows: false
          }
        }
      }
    });

    // Keep slide geometry stable when phones rotate.
    window.addEventListener('orientationchange', function() {
      gallerySwiper.update();
    });
    window.addEventListener('resize', function() {
      gallerySwiper.update();
    });
  }

  function initFutureEffects() {
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      var revealTargets = document.querySelectorAll(
        '#about .row, #activity .timeline > li, #team .team-member, #progress .progress-section__card, #contact .row.address, .sponsors .row'
      );

      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      });

      revealTargets.forEach(function(target, index) {
        target.classList.add('reveal-up');
        target.style.transitionDelay = (Math.min(index % 6, 5) * 60) + 'ms';
        observer.observe(target);
      });
    }

    if (!prefersReducedMotion) {
      var ticking = false;
      var masthead = document.querySelector('header.masthead');

      if (masthead) {
        window.addEventListener('scroll', function() {
          if (ticking) {
            return;
          }

          window.requestAnimationFrame(function() {
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            var offset = Math.min(scrollTop * 0.2, 140);
            masthead.style.backgroundPosition = 'center calc(50% + ' + offset + 'px)';
            ticking = false;
          });

          ticking = true;
        });
      }
    }
  }

  initModernGallery();
  initFutureEffects();

  // Magnific popup calls
  $('.popup-gallery').magnificPopup({
    delegate: 'a',
    type: 'image',
    tLoading: 'Loading image #%curr%...',
    mainClass: 'mfp-img-mobile',
    gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0, 1]
    },
    image: {
      tError: '<a href="%url%">The image #%curr%</a> could not be loaded.'
    }
  });

})(jQuery); // End of use strict
