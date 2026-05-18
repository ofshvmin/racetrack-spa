/* =====================================================================
   Tickets info popover
   Any element with [data-tickets] opens the popover on click.
   Cash and check only at the door — no online ordering.
   ===================================================================== */
(function () {
  const POP_HTML = `
    <div class="tickets-pop-backdrop" id="tickets-pop-bd" role="dialog" aria-modal="true" aria-labelledby="tickets-pop-h">
      <div class="tickets-pop" role="document">
        <button class="close" aria-label="Close" data-close>×</button>
        <div class="eyebrow">Tickets</div>
        <h2 id="tickets-pop-h">Pay at the <span class="hot">gate.</span></h2>

        <div class="price-list" aria-label="Admission prices">
          <div class="pr"><span class="lbl">Adult</span><span class="val">$12<small>typ.</small></span></div>
          <div class="pr"><span class="lbl">Senior 62+ / Military</span><span class="val">$10</span></div>
          <div class="pr"><span class="lbl">Kids 12 &amp; Under</span><span class="val">FREE</span></div>
          <div class="pr"><span class="lbl">Family (2 adults + kids)</span><span class="val">$25</span></div>
        </div>

        <div class="payment">
          <div class="icon">$</div>
          <div>
            <div class="head">Cash &amp; checks only</div>
            <p>No online sales. No cards at the gate. Bring cash or a check made out to <em>Chemung Speedrome</em>.</p>
          </div>
        </div>

        <div class="gate-info">
          <div class="cell">
            <div class="k">Gates Open</div>
            <div class="v">5:00<small>PM Fri</small></div>
          </div>
          <div class="cell">
            <div class="k">Green Flag</div>
            <div class="v">7:00<small>PM Fri</small></div>
          </div>
        </div>

        <p class="note">Special-event nights (Season Opener, Independence 100, Championship) carry premium pricing — posted on each schedule entry. Rain checks are honored at the rescheduled date.</p>
      </div>
    </div>
  `;

  function ensurePopover() {
    let bd = document.getElementById('tickets-pop-bd');
    if (bd) return bd;
    const wrap = document.createElement('div');
    wrap.innerHTML = POP_HTML.trim();
    bd = wrap.firstElementChild;
    document.body.appendChild(bd);

    bd.addEventListener('click', e => {
      if (e.target === bd || e.target.hasAttribute('data-close')) close(bd);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && bd.classList.contains('is-open')) close(bd);
    });
    return bd;
  }
  function open(bd) {
    bd.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function close(bd) {
    bd.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-tickets]');
    if (!t) return;
    e.preventDefault();
    const bd = ensurePopover();
    open(bd);
  });
})();
