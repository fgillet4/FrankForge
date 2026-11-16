/**
 * The FrankStation login gate: sign in with a FrankStation account, then redeem an invite code
 * if the account doesn't have FrankForge access yet. Resolves once the player may play.
 */

import './menu.css';
import { el } from './menu';

const API = 'https://frankstation.org/api/auth';
const TOKEN_KEY = 'fs_token';

function token(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function setToken(t: string | null) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable */ }
}

/** Whether the signed-in account has access; null when the token is missing or no longer valid. */
async function checkAccess(t: string): Promise<boolean | null> {
  const r = await fetch(`${API}/frankforge-access`, {
    headers: { Authorization: `Bearer ${t}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return null;
  return !!(await r.json()).hasAccess;
}

export async function authGate(): Promise<void> {
  const t = token();
  if (t) {
    try {
      const access = await checkAccess(t);
      if (access) return;
      if (access === null) setToken(null);
      else return showForm('redeem');
    } catch {
      return showForm('login', 'Could not reach FrankStation. Check your connection and try again.');
    }
  }
  return showForm('login');
}

function showForm(start: 'login' | 'redeem', initialError = ''): Promise<void> {
  return new Promise(resolve => {
    const root = el('div', 'mm');
    const card = el('form', 'mm-gate');
    root.append(card);
    document.body.append(root);

    const render = (mode: 'login' | 'redeem', error = '') => {
      card.innerHTML = mode === 'login' ? `
        <h1 class="mm-logo">FRANK<span>FORGE</span></h1>
        <div class="mm-stripe"></div>
        <p>Sign in with your FrankStation account.</p>
        <label>Username<input name="username" autocomplete="username" required></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
        <p class="mm-warn"></p>
        <button class="mm-big" type="submit">Sign in</button>` : `
        <h1 class="mm-logo">FRANK<span>FORGE</span></h1>
        <div class="mm-stripe"></div>
        <p>Your account doesn't have FrankForge yet. Enter an invite code to unlock it.</p>
        <label>Invite code<input name="code" class="mm-code" autocomplete="off" spellcheck="false" maxlength="16" required></label>
        <p class="mm-warn"></p>
        <button class="mm-big" type="submit">Unlock</button>
        <button class="mm-link" type="button">Use a different account</button>`;
      const warn = card.querySelector<HTMLElement>('.mm-warn')!;
      warn.textContent = error;
      card.querySelector<HTMLInputElement>('input')?.focus();
      card.querySelector<HTMLButtonElement>('.mm-link')?.addEventListener('click', () => { setToken(null); render('login'); });
      const code = card.querySelector<HTMLInputElement>('.mm-code');
      code?.addEventListener('input', () => { code.value = code.value.toUpperCase(); });

      card.onsubmit = async e => {
        e.preventDefault();
        const submit = card.querySelector<HTMLButtonElement>('.mm-big')!;
        submit.disabled = true;
        warn.textContent = '';
        const data = new FormData(card);
        try {
          if (mode === 'login') {
            const r = await fetch(`${API}/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: data.get('username'), password: data.get('password') }),
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok || !d.token) throw new Error(d.error || 'Sign-in failed.');
            setToken(d.token);
            if (await checkAccess(d.token)) return done();
            render('redeem');
          } else {
            const r = await fetch(`${API}/frankforge-redeem`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
              body: JSON.stringify({ code: String(data.get('code')).trim().toUpperCase() }),
            });
            const d = await r.json().catch(() => ({}));
            if (r.status === 401) { setToken(null); render('login', 'Your session expired. Sign in again.'); return; }
            if (!r.ok) throw new Error(d.error || 'That code did not work.');
            return done();
          }
        } catch (err) {
          warn.textContent = err instanceof TypeError ? 'Could not reach FrankStation.' : (err as Error).message;
          submit.disabled = false;
        }
      };
    };

    const done = () => { root.remove(); resolve(); };
    render(start, initialError);
  });
}
