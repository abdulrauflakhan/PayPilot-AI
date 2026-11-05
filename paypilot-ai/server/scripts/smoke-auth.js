// Black-box smoke test for the auth API. Start the server first, then:
//   npm run test:auth            (or BASE_URL=https://... npm run test:auth)
const BASE = process.env.BASE_URL || 'http://localhost:5000/api';
const email = `smoke_${Date.now()}@example.com`;
const password = 'Passw0rdTest';
let failures = 0;

async function call(method, path, { body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, json };
}

function check(name, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`);
  if (!cond) failures++;
}

const h = await call('GET', '/health');
check('health returns 200', h.status === 200, JSON.stringify(h));

const weak = await call('POST', '/auth/register', { body: { name: 'Test', email, password: 'short' } });
check('weak password rejected (400)', weak.status === 400, JSON.stringify(weak));

const reg = await call('POST', '/auth/register', { body: { name: 'Smoke Test', email, password } });
check('register returns 201 + token', reg.status === 201 && !!reg.json?.token, JSON.stringify(reg));
check('register response has no password', reg.json && !('password' in (reg.json.user || {})));

const dup = await call('POST', '/auth/register', { body: { name: 'Smoke Test', email: email.toUpperCase(), password } });
check('duplicate email (any case) rejected (409)', dup.status === 409, JSON.stringify(dup));

const login = await call('POST', '/auth/login', { body: { email, password } });
check('login succeeds (200)', login.status === 200 && !!login.json?.token, JSON.stringify(login));

const bad = await call('POST', '/auth/login', { body: { email, password: 'WrongPass1' } });
check('wrong password rejected (401)', bad.status === 401, JSON.stringify(bad));

const ghost = await call('POST', '/auth/login', { body: { email: 'nobody@example.com', password } });
check('unknown email gives same 401 + message', ghost.status === 401 && ghost.json?.message === bad.json?.message, JSON.stringify(ghost));

const token = login.json?.token;
const me = await call('GET', '/auth/me', { token });
check('/me with valid token (200)', me.status === 200 && me.json?.user?.email === email, JSON.stringify(me));

const noTok = await call('GET', '/auth/me');
check('/me without token (401)', noTok.status === 401, JSON.stringify(noTok));

const tampered = await call('GET', '/auth/me', { token: token.slice(0, -2) + 'xx' });
check('/me with tampered token (401)', tampered.status === 401, JSON.stringify(tampered));

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
