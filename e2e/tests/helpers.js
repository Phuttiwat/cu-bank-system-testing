const API = 'http://localhost:4000/api/v1';

// Unique 10-digit account per run so tests can be re-run against the same DB
let seq = 0;
const newAccountId = () =>
  (String(Date.now()).slice(-8) + String(seq++ % 100).padStart(2, '0'));

async function apiRegister(request, accountId, password, name = 'Test User') {
  const res = await request.post(`${API}/auth/register`, { data: { accountId, password, name } });
  if (!res.ok()) throw new Error(`register ${accountId} failed: ${await res.text()}`);
}

async function register(page, { accountId, password, firstName, lastName }) {
  await page.goto('/register');
  await page.locator('[cid="r1"]').fill(accountId);
  await page.locator('[cid="r2"]').fill(password);
  await page.locator('[cid="r3"]').fill(firstName);
  await page.locator('[cid="r4"]').fill(lastName);
  await page.locator('[cid="rc"]').click();
}

async function login(page, accountId, password) {
  await page.goto('/');
  await page.locator('[cid="l1"]').fill(accountId);
  await page.locator('[cid="l2"]').fill(password);
  await page.locator('[cid="lc"]').click();
}

// Balance is the third <h1> inside the account <article>
const balance = (page) => page.locator('article h1').nth(2);

async function deposit(page, amount) {
  await page.locator('[cid="d1"]').fill(String(amount));
  await page.locator('[cid="dc"]').click();
}
async function withdraw(page, amount) {
  await page.locator('[cid="w1"]').fill(String(amount));
  await page.locator('[cid="wc"]').click();
}
async function transfer(page, target, amount) {
  await page.locator('[cid="t1"]').fill(target);
  await page.locator('[cid="t2"]').fill(String(amount));
  await page.locator('[cid="tc"]').click();
}
async function payBill(page, target, amount) {
  const cid = { water: 'b1', electric: 'b2', phone: 'b3' }[target];
  if (cid) await page.locator(`[cid="${cid}"]`).check();
  await page.locator('[cid="b4"]').fill(String(amount));
  await page.locator('[cid="bc"]').click();
}

module.exports = { API, newAccountId, apiRegister, register, login, balance, deposit, withdraw, transfer, payBill };
