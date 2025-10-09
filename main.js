(() => {
  // ===== helpers =====
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // ===== boot =====
  $("#year").textContent = new Date().getFullYear();

  // sticky nav shadow
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 4);
  onScroll(); window.addEventListener("scroll", onScroll);

  // ghost button ripple
  const ghost = document.querySelector(".btn-ghost-anim");
  if (ghost) {
    ghost.addEventListener("mousemove", (e) => {
      const r = ghost.getBoundingClientRect();
      ghost.style.setProperty("--mx", `${e.clientX - r.left}px`);
      ghost.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }

  // smooth slide to aims
  const exploreBtn = $("#btn-explore");
  if (exploreBtn) {
    exploreBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = $("#aims");
      const start = window.scrollY;
      const end   = target.getBoundingClientRect().top + window.scrollY - 10;
      const dist  = end - start;
      const dur   = 750;
      const t0    = performance.now();
      const ease  = (t) => (t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2);
      const step  = (ts) => {
        const p = Math.min(1, (ts - t0) / dur);
        window.scrollTo(0, start + dist * ease(p));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // ===== tilt effect on aim cards =====
  function attachTilt(card) {
    const set = (rx=0, ry=0) => {
      card.style.setProperty("--rx", `${rx}deg`);
      card.style.setProperty("--ry", `${ry}deg`);
    };
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      set((y - 0.5) * 4, (0.5 - x) * 6);
    });
    card.addEventListener("mouseleave", () => set(0, 0));
    card.addEventListener("blur", () => set(0, 0));
  }
  $$(".tilt").forEach(attachTilt);

  // ===== modal (FLIP from card) =====
  const modal     = $("#modal");
  const panel     = $(".modal__panel", modal);
  const backdrop  = $(".modal__backdrop", modal);
  const xBtn      = $("#modal-x");
  const title     = $("#modal-title");
  const img       = $("#modal-img");
  const introP    = $(".intro");
  const bullets1  = $("#bullets-1");
  const methodP   = $("#method");
  const bullets2  = $("#bullets-2");

  let closing = false;

  function setFromCard(cardRect){
    const cx = cardRect.left + cardRect.width/2;
    const cy = cardRect.top + cardRect.height/2;
    const vx = window.innerWidth/2;
    const vy = window.innerHeight/2;
    const tx = (cx - vx);
    const ty = (cy - vy);
    const modalWidth = Math.min(window.innerWidth * 0.98, 1200);
    const s = Math.max(0.3, Math.min(0.95, cardRect.width / modalWidth));
    panel.style.setProperty("--tx", `${tx}px`);
    panel.style.setProperty("--ty", `${ty}px`);
    panel.style.setProperty("--s",  `${s}`);
  }

  function fillModalText(details){
    const lips = [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin hendrerit metus nec elit luctus, at aliquet neque cursus.",
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
    ];
    introP.textContent = `${details} ${lips[0]}`;

    const li1 = [
      "Curabitur placerat porta augue gravida, sapien mi vehicula lacus.",
      "Quisque sed nisl sed magna volutpat convallis in non urna.",
      "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices.",
      "Integer sit amet dui iaculis, lobortis turpis a, interdum lectus."
    ];
    bullets1.innerHTML = li1.map(s => `<li>${s}</li>`).join("");

    methodP.textContent = lips[1];

    const li2 = [
      "Nullam commodo, sapien non sodales posuere, lectus lorem posuere nunc.",
      "Donec varius nibh vitae elementum rhoncus.",
      "Morbi laoreet neque dolor congue lectus, id gravida urna justo nec est."
    ];
    bullets2.innerHTML = li2.map(s => `<li>${s}</li>`).join("");
  }

  function openModalFromCard(card){
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const { title: t, image, details } = card.dataset;
    // Fallbacks from DOM if dataset missing
    const fallbackTitle = card.querySelector(".h3")?.textContent?.trim() || "Details";
    const fallbackImage = card.querySelector("img")?.src || "";
    const payload = {
      title: t || fallbackTitle,
      image: image || fallbackImage,
      details: details || ""
    };

    // populate modal
    title.textContent = payload.title;
    img.src = payload.image;
    img.alt = payload.title;
    fillModalText(payload.details);

    setFromCard(rect);
    modal.classList.remove("closing");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
  }

  function closeModal(){
    if (!modal.classList.contains("open")) return;
    closing = true;
    modal.classList.add("closing");
    const done = () => {
      modal.classList.remove("open","closing");
      modal.setAttribute("aria-hidden","true");
      closing = false;
      panel.removeEventListener("animationend", done);
    };
    panel.addEventListener("animationend", done);
  }

  xBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  window.addEventListener("keydown", (e) => e.key === "Escape" && closeModal());

  // ----- DIRECT BIND on each card -----
  const cards = $$(".card-frame[data-title]");
  cards.forEach((card) => {
    // Prevent accidental form submission behavior
    if (card.tagName === "BUTTON" && !card.getAttribute("type")) card.setAttribute("type","button");
    // Click open
    card.addEventListener("click", () => openModalFromCard(card));
    // Keyboard accessibility (Enter/Space)
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModalFromCard(card);
      }
    });
  });

  // ----- PLUS: container-level delegation as fallback -----
  const aimsGrid = $("#aims-grid");
  aimsGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".card-frame[data-title]");
    if (!card) return;
    openModalFromCard(card);
  });

  // Debug nav clicks (optional)
  document.addEventListener("click", (e) => {
    const navBtn = e.target.closest("button[data-nav]");
    if (!navBtn) return;
    const dest = navBtn.dataset.nav;
    if (dest === "team")   { window.location.href = "teams.html"; return; }
    if (dest === "updates"){ window.location.href = "updates.html"; return; }
    if (dest === "tmed") {
      console.log('hmmmmmmm')
      e.preventDefault(); // stop default <a> if present
      window.open("https://tmed.cs.tufts.edu/tmed_v2.html", "_blank", "noopener");
      return;
    }
    if (dest === "connect") { 
      // your existing openContactModal() from the contact form section
      openContactModal(); 
      return; 
    }
  });

  // ===== Contact Modal (small form) =====
  const contactModal   = $("#contact-modal");
  const contactPanel   = $(".modal__panel", contactModal);
  const contactBackdrop= $(".modal__backdrop", contactModal);
  const contactClose   = $("#contact-x");
  const contactForm    = $("#contact-form");
  const contactSubmit  = $("#contact-submit");
  const contactStatus  = $("#contact-status");

  function openContactModal() {
    if (!contactModal) return;
    contactModal.classList.remove("closing");
    contactModal.classList.add("open");
    contactModal.setAttribute("aria-hidden","false");
  }

  function closeContactModal() {
    if (!contactModal.classList.contains("open")) return;
    contactModal.classList.add("closing");
    const done = () => {
      contactModal.classList.remove("open","closing");
      contactModal.setAttribute("aria-hidden","true");
      contactPanel.removeEventListener("animationend", done);
    };
    contactPanel.addEventListener("animationend", done);
  }

  contactClose?.addEventListener("click", closeContactModal);
  contactBackdrop?.addEventListener("click", closeContactModal);
  window.addEventListener("keydown", (e) => e.key === "Escape" && closeContactModal());

  // Open when any [data-nav="connect"] is clicked
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-nav="connect"]');
    if (btn) {
      e.preventDefault();
      openContactModal();
    }
  });

  // Submit handler
  contactForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    contactStatus.textContent = "";
    contactStatus.className = "status";
    contactSubmit.disabled = true;
    const original = contactSubmit.textContent;
    contactSubmit.textContent = "Sending…";

    // honeypot
    const hp = contactForm.website?.value?.trim();
    if (hp) { // likely a bot; pretend success
      contactSubmit.disabled = false;
      contactSubmit.textContent = original;
      contactStatus.textContent = "Thanks!";
      contactStatus.classList.add("ok");
      contactForm.reset();
      return;
    }

    const payload = {
      name: contactForm.name.value.trim(),
      email: contactForm.email.value.trim(),
      affiliation: contactForm.affiliation.value.trim(),
      message: contactForm.message.value.trim(),
    };

    // basic front-end validation
    if (!payload.name || !payload.email || !payload.message) {
      contactStatus.textContent = "Please fill out name, email, and message.";
      contactStatus.classList.add("err");
      contactSubmit.disabled = false;
      contactSubmit.textContent = original;
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      contactStatus.textContent = "Sent! We’ll get back to you shortly.";
      contactStatus.classList.add("ok");
      contactForm.reset();
      // optionally close after a moment:
      setTimeout(closeContactModal, 1200);
    } catch (err) {
      console.error(err);
      contactStatus.textContent = "Sorry—couldn’t send. Please try again.";
      contactStatus.classList.add("err");
    } finally {
      contactSubmit.disabled = false;
      contactSubmit.textContent = original;
    }
});

// Freeze caption width to pre-hover column size
// function setCaptionBaseWidth(){
//   const row = document.querySelector('.aims-row');
//   if(!row) return;
//   const gap = parseFloat(getComputedStyle(row).gap) || 16;
//   const base = (row.clientWidth - 2*gap) / 3;   // width of one column
//   row.style.setProperty('--caption-w', `${base}px`);
// }
// window.addEventListener('resize', setCaptionBaseWidth);
// window.addEventListener('load', setCaptionBaseWidth);
// Parallax inputs for CSS vars
(() => {
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const setScroll = () => {
  root.style.setProperty('--scrollY', `${window.scrollY}`);
};

const setMouse = (e) => {
  // -0.5..0.5 normalized
  const mx = (e.clientX / window.innerWidth) - 0.5;
  const my = (e.clientY / window.innerHeight) - 0.5;
  root.style.setProperty('--mx', mx.toFixed(3));
  root.style.setProperty('--my', my.toFixed(3));
};

setScroll();
window.addEventListener('scroll', setScroll, { passive: true });

// mouse parallax only if not reduced motion
if (!reduce) window.addEventListener('mousemove', setMouse, { passive: true });
})();

})();

// Single mobile-nav toggler (minimal & robust)
(() => {
  const header = document.getElementById("nav");
  const btn    = document.querySelector(".nav__toggle");
  const drawer = document.getElementById("nav-drawer");
  if (!header || !btn || !drawer) return;

  const setOpen = (open) => {
    btn.setAttribute("aria-expanded", String(open));
    drawer.hidden = !open; // keep a11y in sync
  };

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") !== "true";
    console.log("hmmmmmmmm")
    setOpen(open);
  });

  drawer.addEventListener("click", (e) => {
    console.log("hmmmmmmmm")
    if (e.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
})();
