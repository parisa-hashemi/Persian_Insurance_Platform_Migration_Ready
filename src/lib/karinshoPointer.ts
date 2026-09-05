/**
 * KAR INSHO — centralized pointer interaction engine.
 *
 * فقط لایه‌ی بصری. هیچ state، route یا منطق محصولی را لمس نمی‌کند.
 * یک listener سراسری + یک حلقه‌ی rAF برای همه‌ی افکت‌ها:
 *   .krn-magnetic   دکمه‌های آهن‌ربایی
 *   .krn-parallax   لایه‌های عمق (data-krn-depth="0.2")
 *   .krn-spotlight  نور آبی زیر نشانگر
 *   .krn-proximity  واکنش به نزدیکی نشانگر
 *   .krn-reveal     ورود هنگام اسکرول (IntersectionObserver)
 *   کرسر سفارشی
 */

type Vec = { x: number; y: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

let tagQueued = false;

export function initKarinshoPointer(): () => void {
  if (typeof window === 'undefined') return () => {};

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // اسکرول-ریویل روی همه‌ی دستگاه‌ها کار می‌کند (به‌جز reduced motion)
  const io =
    'IntersectionObserver' in window && !reduced
      ? new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                (e.target as HTMLElement).dataset.krnIn = '1';
                io?.unobserve(e.target);
              }
            }
          },
          { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
        )
      : null;

  const revealMo = io
    ? new MutationObserver(() => {
        document.querySelectorAll<HTMLElement>('.krn-reveal:not([data-krn-obs])').forEach((el) => {
          el.dataset.krnObs = '1';
          io.observe(el);
        });
      })
    : null;

  if (io) {
    document.querySelectorAll<HTMLElement>('.krn-reveal').forEach((el) => {
      el.dataset.krnObs = '1';
      io.observe(el);
    });
    revealMo?.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * برچسب‌گذاری خودکار: کلاس‌های تعاملی روی الگوهای موجودِ رابط
   * اعمال می‌شود تا همه‌ی پنل‌ها بدون تغییر در سورس کامپوننت‌ها
   * رفتار یکسان بگیرند. صرفاً کلاس CSS اضافه می‌کند.
   */
  const CARD_SEL =
    'div[class*="rounded-3xl"][class*="bg-white"][class*="border"],' +
    'div[class*="rounded-2xl"][class*="bg-white"][class*="border"]';
  const CTA_SEL =
    'button[class*="bg-blue-600"], button[class*="bg-blue-700"], button[class*="bg-indigo-600"]';

  const tag = () => {
    document.querySelectorAll<HTMLElement>(CARD_SEL).forEach((el) => {
      if (el.dataset.krnTagged) return;
      el.dataset.krnTagged = '1';
      const r = el.getBoundingClientRect();
      if (r.width < 140 || r.height < 90) return; // چیپ‌ها و باکس‌های ریز کنار می‌مانند
      const cs = getComputedStyle(el);
      if (cs.position === 'absolute' || cs.position === 'fixed' || cs.position === 'sticky') return; // پاپ‌آورها معاف
      el.classList.add('krn-spotlight');
    });
    // حرکت آهن‌ربایی دکمه‌ها غیرفعال شد — دکمه‌ها ثابت می‌مانند
  };
  tag();
  const tagMo = new MutationObserver(() => {
    if (tagQueued) return;
    tagQueued = true;
    requestAnimationFrame(() => {
      tagQueued = false;
      tag();
    });
  });
  tagMo.observe(document.body, { childList: true, subtree: true });

  if (reduced || coarse) {
    return () => {
      io?.disconnect();
      revealMo?.disconnect();
      tagMo.disconnect();
    };
  }

  // نشانگر سفارشی (نقطه دنبال‌کننده ماوس) حذف شد — به درخواست کاربر

  const pointer: Vec = { x: innerWidth / 2, y: innerHeight / 2 };
  const smooth: Vec = { ...pointer };
  let hasMoved = false;
  let raf = 0;

  const onMove = (e: PointerEvent) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    if (!hasMoved) {
      hasMoved = true;
    }
  };
  const onLeave = () => {};

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  const MAGNET_RANGE = 130; // px
  const MAGNET_MAX = 7; // px
  const PROX_RANGE = 260; // px

  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!hasMoved) return;

    // parallax layers
    const nx = (pointer.x / innerWidth - 0.5) * 2;
    const ny = (pointer.y / innerHeight - 0.5) * 2;
    document.querySelectorAll<HTMLElement>('.krn-parallax').forEach((el) => {
      const depth = parseFloat(el.dataset.krnDepth || '0.3');
      el.style.setProperty('--krn-px', `${(-nx * 14 * depth).toFixed(2)}px`);
      el.style.setProperty('--krn-py', `${(-ny * 10 * depth).toFixed(2)}px`);
    });

    // spotlight
    document.querySelectorAll<HTMLElement>('.krn-spotlight').forEach((el) => {
      const r = el.getBoundingClientRect();
      const inside =
        pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
      if (inside) {
        el.style.setProperty('--krn-sx', `${((pointer.x - r.left) / r.width) * 100}%`);
        el.style.setProperty('--krn-sy', `${((pointer.y - r.top) / r.height) * 100}%`);
        el.dataset.krnActive = '1';
      } else if (el.dataset.krnActive === '1') {
        el.dataset.krnActive = '0';
      }
    });

  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onMove);
    document.removeEventListener('pointerleave', onLeave);
    io?.disconnect();
    revealMo?.disconnect();
    tagMo.disconnect();
  };
}
