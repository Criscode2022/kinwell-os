#!/usr/bin/env node
const base = (process.argv[2] || 'http://127.0.0.1:8080').replace(/\/$/, '');

async function req(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data)}`);
  return data;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log('Smoke testing', base);

  const health = await req('/api/health');
  assert(health.ok === true, 'health not ok');
  console.log('✓ health', health.db);

  const login = await req('/api/auth/login', {
    method: 'POST',
    body: { email: 'demo@kinwell.app', password: 'demo1234' },
  });
  assert(login.accessToken, 'no token');
  assert(login.user?.email === 'demo@kinwell.app', 'wrong user');
  const token = login.accessToken;
  console.log('✓ login');

  const dash = await req('/api/dashboard', { token });
  assert(dash.kpis.people >= 2, 'expected seeded people');
  assert(Array.isArray(dash.today), 'today doses missing');
  console.log('✓ dashboard', dash.kpis);

  const people = await req('/api/people', { token });
  assert(people.length >= 2, 'people empty');
  console.log('✓ people', people.length);

  const created = await req('/api/people', {
    method: 'POST',
    token,
    body: { name: 'Smoke Test Elder', relationship: 'Aunt', city: 'Sevilla' },
  });
  assert(created.id, 'person create failed');
  console.log('✓ create person');

  const meds = await req('/api/medications', { token });
  assert(meds.length >= 1, 'medications empty');
  console.log('✓ medications', meds.length);

  const today = await req('/api/doses/today', { token });
  assert(typeof today.adherence7d === 'number', 'adherence missing');
  console.log('✓ today doses', today.slots.length, 'adherence', today.adherence7d);

  if (today.slots[0]) {
    await req('/api/doses', {
      method: 'POST',
      token,
      body: { medicationId: today.slots[0].medicationId, status: 'taken', scheduledFor: today.slots[0].scheduledFor },
    });
    console.log('✓ log dose');
  }

  const appts = await req('/api/appointments', { token });
  assert(appts.length >= 1, 'appointments empty');
  console.log('✓ appointments', appts.length);

  const tasks = await req('/api/tasks', { token });
  assert(tasks.length >= 1, 'tasks empty');
  console.log('✓ tasks', tasks.length);

  const journal = await req('/api/journal', { token });
  assert(journal.length >= 1, 'journal empty');
  console.log('✓ journal', journal.length);

  const card = await req(`/api/people/${people[0].id}/card`, { token });
  assert(Array.isArray(card.medications), 'emergency card missing meds');
  console.log('✓ emergency card');

  await req(`/api/people/${created.id}`, { method: 'DELETE', token });
  console.log('✓ delete person');

  const home = await fetch(`${base}/`);
  console.log('✓ GET / status', home.status);

  console.log('\nAll API smoke checks passed.');
}

main().catch((err) => {
  console.error('SMOKE FAILED:', err.message);
  process.exit(1);
});
