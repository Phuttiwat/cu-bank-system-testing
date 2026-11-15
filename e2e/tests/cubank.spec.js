// CU Bank system tests – TC1–TC48 from CU_Bank_Report_Draft.md (Weak Robust ECT).
// Expected values follow the spec, so a failing test = a deviation to report.
// Each test records what the UI actually showed as an "actual" annotation for the report.
const { test, expect } = require('@playwright/test');
const path = require('path');
const h = require('./helpers');

const A = { id: '1111111111', pw: '1234' };
const B = { id: '2222222222', pw: '5678' };

const MSG = {
  accNumOnly: 'Your account ID should contain numbers only',
  accLen: 'Your account ID must be exactly 10 digits long',
  accDup: 'This account ID is already in use. Please choose another.',
  pwNumOnly: 'Your password should contain numbers only',
  pwLen: 'Your password must be exactly 4 digits long',
  nameLen: 'Your fullname must be 30 characters or less, including spaces.',
  userNotFound: 'User not found. Please check your account ID.',
  wrongPw: 'Incorrect password. Please try again.',
  notNumber: 'Invalid balance amount. Please enter a valid number.',
  decimal: 'The balance amount must be a whole number with no decimals.',
  notPositive: 'The amount must be greater than 0. Please enter a positive number.',
  noFund: (what) => `Your balance is not enough to complete the ${what}.`,
  targetNotFound: "We couldn't find the recipient's account. Please double-check the account ID.",
  ownAccount: 'You cannot transfer to your own account.',
};

const ERR = {
  register: '[cid="register-error-mes"]',
  login: '[cid="login-error-mes"]',
  deposit: '[cid="deposite-error-mes"]',
  withdraw: '[cid="withdraw-error-mes"]',
  transfer: '[cid="transfer-error-mes"]',
  bill: '[cid="billpayment-error-mes"]',
};

// Snapshot of what the user sees after an action: app error label, native browser
// validation bubble, alert text, balance and URL. Stored for the report's Actual Output.
async function recordActual(page, errSel, extra = {}, inputCid = null) {
  await page.waitForTimeout(800);
  const parts = [];
  const errLoc = page.locator(errSel);
  if (await errLoc.count()) parts.push(`error: "${(await errLoc.innerText()).trim()}"`);
  // Only the form under test: other forms on the page also have empty required inputs
  const invalid = inputCid
    ? await page.locator(`[cid="${inputCid}"]`).evaluate((el) => el.form.querySelector('input:invalid')?.validationMessage || null)
    : null;
  if (invalid && !parts.length) parts.push(`browser validation: "${invalid}" (form ไม่ถูกส่ง)`);
  if (extra.alert) parts.push(`alert: "${extra.alert}"`);
  if (await h.balance(page).count()) parts.push(`balance = ${(await h.balance(page).innerText()).trim()}`);
  parts.push(`URL: ${new URL(page.url()).pathname}`);
  if (!parts.some((p) => p.startsWith('error') || p.startsWith('browser'))) parts.unshift('ไม่มี error message');
  const text = parts.join('; ');
  test.info().annotations.push({ type: 'actual', description: text });
  await screenshotActual(page, inputCid);
  return text;
}

// Evidence for the report: screenshot named after the TC, cropped to the balance and the form under test
async function screenshotActual(page, inputCid) {
  const file = path.join(__dirname, '..', 'screenshots', `${test.info().title.split(' ')[0]}.png`);
  // Without a form under test (login, account check, logout) show the whole page incl. the nav buttons
  if (!inputCid) {
    await page.screenshot({ path: file, fullPage: true });
    return;
  }
  const boxes = [];
  if (await h.balance(page).count()) boxes.push(await page.locator('article').first().boundingBox());
  const form = inputCid ? page.locator(`[cid="${inputCid}"]`).locator('xpath=ancestor::form') : null;
  if (form && await form.count()) boxes.push(await form.boundingBox());
  if (!boxes.length) {
    await page.screenshot({ path: file });
    return;
  }
  const scrollY = await page.evaluate(() => window.scrollY);
  const x = Math.min(...boxes.map((b) => b.x)) - 20;
  const y = Math.min(...boxes.map((b) => b.y)) + scrollY - 20;
  const bottom = Math.max(...boxes.map((b) => b.y + b.height)) + scrollY + 70; // room for the browser tooltip
  const right = Math.max(...boxes.map((b) => b.x + b.width)) + 20;
  await page.screenshot({ path: file, fullPage: true, clip: { x, y: Math.max(0, y), width: right - x, height: bottom - Math.max(0, y) } });
}

async function loginA(page) {
  await h.login(page, A.id, A.pw);
  await expect(page).toHaveURL(/\/account/);
  await expect(h.balance(page)).toBeVisible();
}

// Brings A's balance to exactly `target` (pre-condition setup, not under test)
async function setBalance(page, target) {
  const current = Number(await h.balance(page).innerText());
  if (current < target) await h.deposit(page, target - current);
  else if (current > target) await h.withdraw(page, current - target);
  await expect(h.balance(page)).toHaveText(String(target));
}

const errHas = (page, sel, msg) => expect(page.locator(sel)).toHaveText(new RegExp(msg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

test.describe('Scenario 1: Register ไม่ผ่าน', () => {
  const ok = { accountId: '1234567891', password: '1234', firstName: 'Sam', lastName: 'Son' };

  test('TC1 Register (valid ทั้งหมด)', async ({ page }) => {
    let alertText = null;
    page.once('dialog', (d) => { alertText = d.message(); d.accept(); });
    await h.register(page, { ...ok, accountId: '1234567890' });
    await page.waitForURL((u) => u.pathname === '/');
    await recordActual(page, ERR.register, { alert: alertText }, 'l1');
    expect(alertText).toBe('success');
  });

  const cases = [
    ['TC2', { accountId: '12345abcde' }, MSG.accNumOnly],
    ['TC3', { accountId: '123456789' }, MSG.accLen],
    ['TC4', { accountId: '12345678901' }, MSG.accLen],
    ['TC5', { accountId: A.id }, MSG.accDup],
    ['TC6', { password: '12ab' }, MSG.pwNumOnly],
    ['TC7', { password: '123' }, MSG.pwLen],
    ['TC8', { password: '12345' }, MSG.pwLen],
    ['TC9', { firstName: 'Abcdefghijklmno', lastName: 'Pqrstuvwxyzabcd' }, MSG.nameLen],
  ];
  for (const [id, override, msg] of cases) {
    test(`${id} Register ไม่ผ่าน`, async ({ page }) => {
      await h.register(page, { ...ok, ...override });
      await recordActual(page, ERR.register, {}, 'r1');
      await errHas(page, ERR.register, msg);
      await expect(page).toHaveURL(/\/register/);
    });
  }
});

test.describe('Scenario 2: Login ไม่ผ่าน', () => {
  test('TC10 Login (valid ทั้งหมด)', async ({ page }) => {
    await h.login(page, A.id, A.pw);
    await expect(page).toHaveURL(/\/account/);
    await recordActual(page, ERR.login);
    await expect(page.getByText('LOG OUT')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'LOG IN' })).toHaveCount(0);
  });

  const cases = [
    ['TC11', '11111abcde', A.pw, MSG.accNumOnly],
    ['TC12', '111111111', A.pw, MSG.accLen],
    ['TC13', '11111111111', A.pw, MSG.accLen],
    ['TC14', '9999999998', A.pw, MSG.userNotFound],
    ['TC15', A.id, '12ab', MSG.pwNumOnly],
    ['TC16', A.id, '123', MSG.pwLen],
    ['TC17', A.id, '12345', MSG.pwLen],
    ['TC18', A.id, '4321', MSG.wrongPw],
  ];
  for (const [id, acc, pw, msg] of cases) {
    test(`${id} Login ไม่ผ่าน`, async ({ page }) => {
      await h.login(page, acc, pw);
      await recordActual(page, ERR.login, {}, 'l1');
      await errHas(page, ERR.login, msg);
      await expect(page).not.toHaveURL(/\/account/);
    });
  }
});

// Typing letters into <input type="number"> is how a user would enter "abc"
async function typeAmount(page, cid, value) {
  const input = page.locator(`[cid="${cid}"]`);
  await input.clear();
  await input.pressSequentially(String(value));
}

test.describe('Scenario 3: Login ผ่าน → ฝากเงินไม่ผ่าน', () => {
  test.beforeEach(async ({ page }) => { await loginA(page); await setBalance(page, 0); });

  test('TC19 Deposit 500 (valid)', async ({ page }) => {
    await h.deposit(page, 500);
    await expect(h.balance(page)).toHaveText('500');
    await recordActual(page, ERR.deposit, {}, 'd1');
    await expect(page.locator('.history-list')).toContainText('amount: 500');
  });
  for (const [id, amount, msg] of [['TC20', 'abc', MSG.notNumber], ['TC21', '10.5', MSG.decimal], ['TC22', '0', MSG.notPositive]]) {
    test(`${id} Deposit ${amount}`, async ({ page }) => {
      await typeAmount(page, 'd1', amount);
      await page.locator('[cid="dc"]').click();
      await recordActual(page, ERR.deposit, {}, 'd1');
      await errHas(page, ERR.deposit, msg);
      await expect(h.balance(page)).toHaveText('0');
    });
  }
});

test.describe('Scenario 4: Login ผ่าน → ฝากผ่าน → ถอนไม่ผ่าน', () => {
  test.beforeEach(async ({ page }) => {
    await loginA(page);
    await setBalance(page, 0);
    await h.deposit(page, 1000);
    await expect(h.balance(page)).toHaveText('1000');
  });

  test('TC23 Withdraw 300 (valid)', async ({ page }) => {
    await h.withdraw(page, 300);
    await expect(h.balance(page)).toHaveText('700');
    await recordActual(page, ERR.withdraw, {}, 'w1');
  });
  const cases = [
    ['TC24', '1500', MSG.noFund('withdrawal')],
    ['TC25', '1000', MSG.noFund('withdrawal')],
    ['TC26', 'abc', MSG.notNumber],
    ['TC27', '10.5', MSG.decimal],
    ['TC28', '0', MSG.notPositive],
  ];
  for (const [id, amount, msg] of cases) {
    test(`${id} Withdraw ${amount}`, async ({ page }) => {
      await typeAmount(page, 'w1', amount);
      await page.locator('[cid="wc"]').click();
      await recordActual(page, ERR.withdraw, {}, 'w1');
      await errHas(page, ERR.withdraw, msg);
      await expect(h.balance(page)).toHaveText('1000');
    });
  }
});

test.describe('Scenario 5: ฝากผ่าน → ถอนผ่าน → โอนไม่ผ่าน', () => {
  test.beforeEach(async ({ page }) => {
    await loginA(page);
    await setBalance(page, 0);
    await h.deposit(page, 1000);
    await expect(h.balance(page)).toHaveText('1000');
    await h.withdraw(page, 100);
    await expect(h.balance(page)).toHaveText('900');
  });

  const cases = [
    ['TC29', '22222abcde', '300', MSG.accNumOnly],
    ['TC30', '222222222', '300', MSG.accLen],
    ['TC31', '22222222222', '300', MSG.accLen],
    ['TC32', '9999999998', '300', MSG.targetNotFound],
    ['TC33', A.id, '300', MSG.ownAccount],
    ['TC34', B.id, 'abc', MSG.notNumber],
    ['TC35', B.id, '10.5', MSG.decimal],
    ['TC36', B.id, '0', MSG.notPositive],
    ['TC37', B.id, '1500', MSG.noFund('transfer')],
  ];
  for (const [id, target, amount, msg] of cases) {
    test(`${id} Transfer ${target} ${amount}`, async ({ page }) => {
      await page.locator('[cid="t1"]').fill(target);
      await typeAmount(page, 't2', amount);
      await page.locator('[cid="tc"]').click();
      await recordActual(page, ERR.transfer, {}, 't2');
      await errHas(page, ERR.transfer, msg);
      await expect(h.balance(page)).toHaveText('900');
    });
  }
});

test.describe('Scenario 6: Login ผ่าน → จ่ายบิลไม่ผ่าน', () => {
  test.beforeEach(async ({ page }) => { await loginA(page); await setBalance(page, 1000); });

  test('TC38 ไม่เลือก Target payment', async ({ page }) => {
    await typeAmount(page, 'b4', '300');
    await page.locator('[cid="bc"]').click();
    await recordActual(page, ERR.bill, {}, 'b4');
    await expect(h.balance(page)).toHaveText('1000');
  });
  const cases = [
    ['TC39', 'water', 'abc', MSG.notNumber],
    ['TC40', 'water', '10.5', MSG.decimal],
    ['TC41', 'water', '0', MSG.notPositive],
    ['TC42', 'electric', '1500', MSG.noFund('bill payment')],
  ];
  for (const [id, target, amount, msg] of cases) {
    test(`${id} Bill ${target} ${amount}`, async ({ page }) => {
      await page.locator(`[cid="${{ water: 'b1', electric: 'b2' }[target]}"]`).check();
      await typeAmount(page, 'b4', amount);
      await page.locator('[cid="bc"]').click();
      await recordActual(page, ERR.bill, {}, 'b4');
      await errHas(page, ERR.bill, msg);
      await expect(h.balance(page)).toHaveText('1000');
    });
  }
});

test.describe('Scenario 7: Login ผ่าน → จ่ายบิลผ่าน', () => {
  for (const [id, target, start] of [['TC43', 'water', 1000], ['TC44', 'electric', 700], ['TC45', 'phone', 400]]) {
    test(`${id} Bill ${target} 300`, async ({ page }) => {
      await loginA(page);
      await setBalance(page, start);
      await h.payBill(page, target, 300);
      await expect(h.balance(page)).toHaveText(String(start - 300));
      await recordActual(page, ERR.bill, {}, 'b4');
      await expect(page.locator('.history-list')).toContainText(`target: ${target}`);
    });
  }
});

test.describe.serial('Scenario 8: ฝาก → โอนผ่าน → ตรวจบัญชีปลายทาง → Logout', () => {
  test('TC46 Transfer 300 ไป B (valid)', async ({ page }) => {
    await loginA(page);
    await setBalance(page, 0);
    await h.deposit(page, 1000);
    await expect(h.balance(page)).toHaveText('1000');
    await h.transfer(page, B.id, 300);
    await expect(h.balance(page)).toHaveText('700');
    await recordActual(page, ERR.transfer, {}, 't2');
    await expect(page.locator('.history-list')).toContainText(`target: ${B.id}`);
  });

  test('TC47 ตรวจบัญชี B หลังรับโอน', async ({ page }) => {
    await h.login(page, B.id, B.pw);
    await expect(h.balance(page)).toBeVisible();
    await recordActual(page, ERR.login);
    await expect(h.balance(page)).toHaveText('300');
    await expect(page.locator('.history-list')).toContainText(`target: ${A.id}`);
  });

  test('TC48 Logout', async ({ page }) => {
    await h.login(page, B.id, B.pw);
    await expect(h.balance(page)).toBeVisible();
    await page.getByText('LOG OUT').click();
    await expect(page.getByRole('link', { name: 'LOG IN' })).toBeVisible();
    await recordActual(page, ERR.login);
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(page.getByText('LOG OUT')).toHaveCount(0);
  });
});
