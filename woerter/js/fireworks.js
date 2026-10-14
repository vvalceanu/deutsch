/**
 * Fireworks over the orchard — a handful of shells of falling sparks.
 *
 * Plain canvas, no library. The one piece of motion in the game that nobody
 * asked for, so it is also the one that reduced-motion turns off entirely.
 */

const SPARK_COLORS = ['#FFC43D', '#FFF7E8', '#C3153F', '#2E8B57', '#FF8A3D'];
const GRAVITY = 0.018;
const DRAG = 0.991;

export function createFireworks(canvas, { reducedMotion = prefersReducedMotion } = {}) {
  const ctx = canvas.getContext('2d');
  let sparks = [];
  let running = false;

  function fitToScreen() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  window.addEventListener('resize', fitToScreen);
  fitToScreen();

  function shell(x, y, count, speed) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const velocity = speed * (0.55 + Math.random() * 0.7);
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        fade: 0.0037 + Math.random() * 0.0043,
        size: 2.4 + Math.random() * 3.6,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
      });
    }
  }

  function frame() {
    const { clientWidth: w, clientHeight: h } = canvas;
    ctx.clearRect(0, 0, w, h);

    sparks = sparks.filter((s) => s.life > 0);
    for (const s of sparks) {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += GRAVITY;
      s.vx *= DRAG;
      s.vy *= DRAG;
      s.life -= s.fade;

      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (sparks.length > 0) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      ctx.clearRect(0, 0, w, h);
    }
  }

  return {
    /** `big` is the cherry celebration: more shells, wider spread. */
    burst({ big = false } = {}) {
      if (reducedMotion()) return;

      const shells = big ? 8 : 4;
      for (let i = 0; i < shells; i++) {
        window.setTimeout(() => {
          shell(
            canvas.clientWidth * (0.18 + Math.random() * 0.64),
            canvas.clientHeight * (0.12 + Math.random() * 0.4),
            big ? 72 : 50,
            big ? 7 : 5.5,
          );
          if (!running) {
            running = true;
            requestAnimationFrame(frame);
          }
        }, i * 260);
      }
    },
  };
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
