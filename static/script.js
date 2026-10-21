/* ============================================================
   EventSphere — Frontend Logic
   Handles search, category filtering, event details modal,
   ticket booking flow, and My Bookings.
   ============================================================ */

(function () {
  'use strict';

  // ---- Global Cache ----
  window.eventsMap = {};
  var currentCategory = '';
  var searchTimeout = null;

  // ---- DOM References ----
  var navbar          = document.querySelector('.navbar');
  var mobileToggle    = document.querySelector('.nav-mobile-toggle');
  var navLinks        = document.querySelector('.nav-links');
  var heroSearchInput = document.getElementById('hero-search-input');
  var heroSearchBtn   = document.getElementById('hero-search-btn');
  var eventsGrid      = document.getElementById('events-grid');
  var filterInfo      = document.getElementById('filter-info');
  var clearFilterBtn  = document.getElementById('clear-filter');
  var categoryTiles   = document.querySelectorAll('.category-tile');

  // ---- Navbar scroll effect ----
  function handleScroll() {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('nav-scrolled');
    } else {
      navbar.classList.remove('nav-scrolled');
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ---- Mobile nav toggle ----
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', function () {
      navbar.classList.toggle('nav-mobile-open');
      var expanded = navbar.classList.contains('nav-mobile-open');
      mobileToggle.setAttribute('aria-expanded', expanded);
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navbar.classList.remove('nav-mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Category icon map ----
  var categoryIcons = {
    'Music':      '🎵',
    'Concert':    '🎤',
    'Movie':      '🎬',
    'Theatre':    '🎭',
    'Drama':      '🎭',
    'Workshop':   '🛠️',
    'Sports':     '⚽',
    'Technology': '💻',
    'Tech':       '💻',
    'Food':       '🍽️',
    'Art':        '🎨',
    'Comedy':     '😂',
    'Dance':      '💃',
    'Festival':   '🎪',
    'Education':  '📚',
    'Health':     '🏥',
    'Networking': '🤝',
    'Business':   '💼',
    'Gaming':     '🎮',
    'Photography':'📷',
    'Film':       '🎬',
    'Literature': '📖',
    'Charity':    '❤️',
    'Other':      '🎯'
  };

  function getCategoryIcon(cat) {
    if (!cat) return '🎯';
    if (categoryIcons[cat]) return categoryIcons[cat];
    var lower = cat.toLowerCase();
    for (var key in categoryIcons) {
      if (key.toLowerCase() === lower) return categoryIcons[key];
    }
    return '🎯';
  }

  // ---- HTML Escape Utility ----
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  // ---- Format Currency / Price ----
  function getEventPriceNumber(event) {
    if (event.price) {
      var num = parseInt(String(event.price).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num) && num > 0) return num;
    }
    var cat = (event.category || '').toLowerCase();
    if (cat.indexOf('concert') !== -1 || cat.indexOf('music') !== -1) return 2500;
    if (cat.indexOf('sports') !== -1) return 1500;
    if (cat.indexOf('theatre') !== -1) return 800;
    return 450;
  }

  // ---- Build an event card HTML string ----
  function buildCardHTML(event, idx) {
    var eid = event.event_id || (idx + 1);
    window.eventsMap[eid] = event;

    var title    = event.title || event.name || 'Untitled Event';
    var category = event.category || 'Other';
    var language = event.language || '';
    var organizer = event.organizer || '';
    var description = event.description || '';
    var imageUrl = event.image || event.poster || event.image_url || event.poster_url || '';
    var date     = event.date || event.event_date || '';
    var venue    = event.venue || event.location || '';
    var price    = '₹' + getEventPriceNumber(event);

    var imageContent = '';
    if (imageUrl) {
      imageContent = '<img src="' + escapeHTML(imageUrl) + '" alt="' + escapeHTML(title) + '" loading="lazy" onerror="this.parentElement.innerHTML=\'<div class=event-card-placeholder>' + getCategoryIcon(category) + '</div>\'">';
    } else {
      imageContent = '<div class="event-card-placeholder">' + getCategoryIcon(category) + '</div>';
    }

    var metaItems = '';
    if (organizer) {
      metaItems += '<div class="event-card-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' + escapeHTML(organizer) + '</div>';
    }
    if (language) {
      metaItems += '<div class="event-card-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' + escapeHTML(language) + '</div>';
    }
    if (date) {
      metaItems += '<div class="event-card-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' + escapeHTML(String(date)) + '</div>';
    }
    if (venue) {
      metaItems += '<div class="event-card-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' + escapeHTML(venue) + '</div>';
    }
    metaItems += '<div class="event-card-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' + escapeHTML(price) + '</div>';

    var descHTML = '';
    if (description) {
      descHTML = '<p class="event-card-desc">' + escapeHTML(description) + '</p>';
    }

    return '<div class="event-card fade-in" data-category="' + escapeHTML(category) + '">' +
      '<div class="event-card-image" data-cat="' + escapeHTML(category) + '">' +
        '<span class="event-card-category">' + escapeHTML(category) + '</span>' +
        imageContent +
      '</div>' +
      '<div class="event-card-body">' +
        '<h3 class="event-card-title">' + escapeHTML(title) + '</h3>' +
        descHTML +
        '<div class="event-card-meta">' + metaItems + '</div>' +
        '<div class="event-card-actions">' +
          '<button class="btn btn-outline btn-sm" onclick="openDetailsModal(' + eid + ')">View Details</button>' +
          '<button class="btn btn-primary btn-sm" onclick="openBookingModal(' + eid + ')">Book Now</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ---- Render events into the grid ----
  function renderEvents(events) {
    if (!eventsGrid) return;

    if (!events || events.length === 0) {
      eventsGrid.innerHTML =
        '<div class="events-empty">' +
          '<div class="events-empty-icon">🔍</div>' +
          '<h3>No events found</h3>' +
          '<p>Try adjusting your search or browse a different category.</p>' +
        '</div>';
      updateFilterInfo(0);
      return;
    }

    var html = '';
    for (var i = 0; i < events.length; i++) {
      html += buildCardHTML(events[i], i);
    }
    eventsGrid.innerHTML = html;
    updateFilterInfo(events.length);

    requestAnimationFrame(function () {
      var cards = eventsGrid.querySelectorAll('.fade-in');
      cards.forEach(function (card, idx) {
        card.style.transitionDelay = (idx * 0.05) + 's';
        setTimeout(function () { card.classList.add('visible'); }, 20);
      });
    });
  }

  // ---- Update filter info bar ----
  function updateFilterInfo(count) {
    if (!filterInfo) return;
    var text = '<strong>' + count + '</strong> event' + (count !== 1 ? 's' : '');
    if (currentCategory) {
      text += ' in <strong>' + escapeHTML(currentCategory) + '</strong>';
    }
    var searchVal = heroSearchInput ? heroSearchInput.value.trim() : '';
    if (searchVal) {
      text += ' matching "<strong>' + escapeHTML(searchVal) + '</strong>"';
    }
    filterInfo.innerHTML = text;
  }

  // ---- Fetch events from API ----
  function fetchEvents(query, category) {
    if (!eventsGrid) return;

    var params = [];
    if (query) params.push('q=' + encodeURIComponent(query));
    if (category) params.push('category=' + encodeURIComponent(category));
    var url = '/api/events' + (params.length ? '?' + params.join('&') : '');

    eventsGrid.innerHTML =
      '<div class="events-loading"><div class="spinner"></div></div>';

    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (events) {
        renderEvents(events);
      })
      .catch(function () {
        eventsGrid.innerHTML =
          '<div class="events-empty">' +
            '<div class="events-empty-icon">⚠️</div>' +
            '<h3>Something went wrong</h3>' +
            '<p>Could not load events. Please try again later.</p>' +
          '</div>';
      });
  }

  // ---- Hero search ----
  if (heroSearchInput) {
    heroSearchInput.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      var query = this.value.trim();
      searchTimeout = setTimeout(function () {
        fetchEvents(query, currentCategory);
      }, 300);
    });

    heroSearchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(searchTimeout);
        fetchEvents(this.value.trim(), currentCategory);
        var section = document.getElementById('events');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (heroSearchBtn) {
    heroSearchBtn.addEventListener('click', function () {
      clearTimeout(searchTimeout);
      var query = heroSearchInput ? heroSearchInput.value.trim() : '';
      fetchEvents(query, currentCategory);
      var section = document.getElementById('events');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ---- Category filter ----
  categoryTiles.forEach(function (tile) {
    tile.addEventListener('click', function () {
      var cat = this.getAttribute('data-category') || '';

      if (currentCategory === cat) {
        currentCategory = '';
        this.classList.remove('active');
      } else {
        categoryTiles.forEach(function (t) { t.classList.remove('active'); });
        currentCategory = cat;
        this.classList.add('active');
      }

      if (clearFilterBtn) {
        if (currentCategory) {
          clearFilterBtn.classList.add('visible');
        } else {
          clearFilterBtn.classList.remove('visible');
        }
      }

      var query = heroSearchInput ? heroSearchInput.value.trim() : '';
      fetchEvents(query, currentCategory);

      var section = document.getElementById('events');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ---- Clear filter ----
  if (clearFilterBtn) {
    clearFilterBtn.addEventListener('click', function () {
      currentCategory = '';
      categoryTiles.forEach(function (t) { t.classList.remove('active'); });
      this.classList.remove('visible');
      var query = heroSearchInput ? heroSearchInput.value.trim() : '';
      fetchEvents(query, '');
    });
  }

  // ---- Scroll animations ----
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-in').forEach(function (el) {
      observer.observe(el);
    });
  } else {
    document.querySelectorAll('.fade-in').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ---- Initial Data Caching & Bookings Count ----
  function initData() {
    fetch('/api/events')
      .then(function (res) { return res.json(); })
      .then(function (events) {
        events.forEach(function (ev, i) {
          var eid = ev.event_id || (i + 1);
          window.eventsMap[eid] = ev;
        });
      })
      .catch(function () {});

    refreshBookingsCount();
  }

  function refreshBookingsCount() {
    fetch('/api/bookings')
      .then(function (res) { return res.json(); })
      .then(function (bookings) {
        var badge = document.getElementById('bookings-count-badge');
        if (badge) {
          badge.textContent = bookings.length || 0;
        }
      })
      .catch(function () {});
  }

  // ============================================================
  // MODALS & BOOKING SYSTEM (Exposed to window)
  // ============================================================

  window.closeModal = function (modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  };

  // Close modals on backdrop click or ESC
  document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) {
        backdrop.classList.remove('active');
      }
    });
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(function (m) {
        m.classList.remove('active');
      });
    }
  });

  // ---- 1. Event Details Modal ----
  window.openDetailsModal = function (eventId) {
    var event = window.eventsMap[eventId];
    if (!event) {
      fetch('/api/events')
        .then(function (res) { return res.json(); })
        .then(function (events) {
          events.forEach(function (ev, i) {
            var eid = ev.event_id || (i + 1);
            window.eventsMap[eid] = ev;
          });
          if (window.eventsMap[eventId]) {
            openDetailsModal(eventId);
          }
        });
      return;
    }

    var cat = event.category || 'Event';
    var title = event.title || event.name || 'Untitled Event';
    var price = getEventPriceNumber(event);

    document.getElementById('detail-category').textContent = cat;
    document.getElementById('detail-title').textContent = title;
    document.getElementById('detail-banner').textContent = getCategoryIcon(cat);
    document.getElementById('detail-desc').textContent = event.description || 'Join us for this exciting ' + cat + ' experience with live audiences and top-tier presentation.';
    document.getElementById('detail-price').textContent = '₹' + price;

    // Detailed metadata grid
    var gridHTML = '';
    if (event.organizer) {
      gridHTML += '<div class="detail-item"><div class="detail-item-label">Organizer</div><div class="detail-item-value">' + escapeHTML(event.organizer) + '</div></div>';
    }
    if (event.language) {
      gridHTML += '<div class="detail-item"><div class="detail-item-label">Language</div><div class="detail-item-value">' + escapeHTML(event.language) + '</div></div>';
    }

    // Unpack event.details dictionary
    if (event.details && typeof event.details === 'object') {
      for (var key in event.details) {
        var label = key.replace(/_/g, ' ');
        var val = event.details[key];
        if (key === 'duration_min') val = val + ' mins';
        gridHTML += '<div class="detail-item"><div class="detail-item-label">' + escapeHTML(label) + '</div><div class="detail-item-value">' + escapeHTML(String(val)) + '</div></div>';
      }
    }

    document.getElementById('detail-grid').innerHTML = gridHTML;

    // Configure the "Book Tickets" CTA inside Details Modal
    var bookBtn = document.getElementById('detail-book-btn');
    bookBtn.onclick = function () {
      window.closeModal('details-modal');
      window.openBookingModal(eventId);
    };

    document.getElementById('details-modal').classList.add('active');
  };

  // ---- 2. Booking Modal Flow ----
  var currentBookingQty = 1;

  window.openBookingModal = function (eventId) {
    window.closeModal('details-modal');

    var event = window.eventsMap[eventId];
    var title = event ? (event.title || event.name) : ('Event #' + eventId);
    var rate = event ? getEventPriceNumber(event) : 500;

    document.getElementById('book-event-id').value = eventId;
    document.getElementById('book-ticket-rate').value = rate;
    document.getElementById('booking-event-title').textContent = 'Book: ' + title;

    currentBookingQty = 1;
    updateBookingSummary();

    // Reset views: show form, hide success view
    document.getElementById('dummy-booking-form').style.display = 'block';
    document.getElementById('booking-success-view').style.display = 'none';

    document.getElementById('booking-modal').classList.add('active');
  };

  window.adjustTicketQty = function (delta) {
    var newQty = currentBookingQty + delta;
    if (newQty >= 1 && newQty <= 5) {
      currentBookingQty = newQty;
      updateBookingSummary();
    }
  };

  function updateBookingSummary() {
    var rate = parseInt(document.getElementById('book-ticket-rate').value, 10) || 500;
    var total = currentBookingQty * rate;

    document.getElementById('ticket-qty').textContent = currentBookingQty;
    document.getElementById('summary-rate').textContent = '₹' + rate;
    document.getElementById('summary-qty').textContent = currentBookingQty + (currentBookingQty === 1 ? ' ticket' : ' tickets');
    document.getElementById('summary-total').textContent = '₹' + total;

    // Generate seat labels (e.g. A1, A2...)
    var seatsHtml = '';
    for (var i = 1; i <= currentBookingQty; i++) {
      seatsHtml += '<span class="seat-chip">Seat S' + i + '</span>';
    }
    document.getElementById('allocated-seats-chips').innerHTML = seatsHtml;
  }

  window.handleBookingSubmit = function (e) {
    e.preventDefault();

    var eventId = parseInt(document.getElementById('book-event-id').value, 10);
    var rate = parseInt(document.getElementById('book-ticket-rate').value, 10);
    var name = document.getElementById('book-user-name').value.trim();
    var email = document.getElementById('book-user-email').value.trim();
    var submitBtn = document.getElementById('confirm-booking-btn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Securing Tickets in MongoDB...';

    var payload = {
      event_id: eventId,
      name: name,
      email: email,
      tickets: currentBookingQty,
      price_per_ticket: rate
    };

    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm & Book Tickets';

        if (data.success && data.booking) {
          var b = data.booking;
          document.getElementById('dummy-booking-form').style.display = 'none';
          document.getElementById('booking-success-view').style.display = 'block';

          document.getElementById('success-event-name').textContent = b.event_title || 'Your Event';
          document.getElementById('success-booking-id').textContent = 'Booking Ref: #ES-00' + b.booking_id;
          document.getElementById('success-seats').textContent = (b.seats || []).join(', ');
          document.getElementById('success-amount').textContent = '₹' + b.total_amount;
          document.getElementById('success-name').textContent = b.customer_name || name;

          refreshBookingsCount();
        } else {
          alert('Could not complete booking: ' + (data.error || 'Server error'));
        }
      })
      .catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm & Book Tickets';
        alert('Network or server error while connecting to MongoDB.');
      });
  };

  // ---- 3. My Bookings Modal ----
  window.openMyBookingsModal = function () {
    var content = document.getElementById('bookings-modal-content');
    content.innerHTML = '<div class="events-loading"><div class="spinner"></div></div>';
    document.getElementById('my-bookings-modal').classList.add('active');

    fetch('/api/bookings')
      .then(function (res) { return res.json(); })
      .then(function (bookings) {
        var badge = document.getElementById('bookings-count-badge');
        if (badge) badge.textContent = bookings.length;

        if (!bookings || bookings.length === 0) {
          content.innerHTML =
            '<div class="events-empty" style="padding: 30px 0;">' +
              '<div class="events-empty-icon">🎟️</div>' +
              '<h3>No Bookings Yet</h3>' +
              '<p>You have not booked any tickets yet. Explore our events and reserve your seats!</p>' +
              '<button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="closeModal(\'my-bookings-modal\'); document.getElementById(\'events\').scrollIntoView({behavior:\'smooth\'})">Explore Events Now</button>' +
            '</div>';
          return;
        }

        var html = '<div class="bookings-list">';
        bookings.forEach(function (b) {
          var statusClass = (b.status || 'Confirmed').toLowerCase();
          var seatsList = (b.seats && b.seats.length) ? b.seats.join(', ') : 'General Admission';
          var title = b.event_title || ('Event #' + b.event_id);
          var category = b.event_category || 'Event';

          html +=
            '<div class="ticket-card" id="ticket-booking-' + b.booking_id + '">' +
              '<div class="ticket-info">' +
                '<div class="ticket-header">' +
                  '<span class="ticket-id">#' + b.booking_id + '</span>' +
                  '<span class="ticket-status ' + statusClass + '">' + escapeHTML(b.status || 'Confirmed') + '</span>' +
                  '<span style="font-size: 0.75rem; color: var(--text-muted);">&bull; ' + escapeHTML(category) + '</span>' +
                '</div>' +
                '<h4 class="ticket-title">' + escapeHTML(title) + '</h4>' +
                '<div class="ticket-meta">' +
                  '<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> ' + escapeHTML(b.booking_date || 'Recent') + '</span>' +
                  '<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Seats: ' + escapeHTML(seatsList) + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="ticket-action">' +
                '<div class="ticket-amount">₹' + escapeHTML(String(b.total_amount || 0)) + '</div>' +
                '<button class="ticket-cancel-btn" onclick="cancelBooking(' + b.booking_id + ')">Cancel Ticket</button>' +
              '</div>' +
            '</div>';
        });
        html += '</div>';

        content.innerHTML = html;
      })
      .catch(function () {
        content.innerHTML =
          '<div class="events-empty">' +
            '<div class="events-empty-icon">⚠️</div>' +
            '<h3>Error Loading Bookings</h3>' +
            '<p>Unable to retrieve booking records from MongoDB.</p>' +
          '</div>';
      });
  };

  window.cancelBooking = function (bookingId) {
    if (!confirm('Are you sure you want to cancel booking #' + bookingId + '?')) {
      return;
    }

    fetch('/api/bookings/' + bookingId, { method: 'DELETE' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          window.openMyBookingsModal();
          refreshBookingsCount();
        } else {
          alert('Could not cancel booking: ' + (data.error || 'Server error'));
        }
      })
      .catch(function () {
        alert('Network error while canceling booking.');
      });
  };

  // Run on start
  initData();

})();
