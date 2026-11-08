# CU Bank – System Testing (2110724 Team Project 2)

Automated system tests (Playwright) for the CU Bank web application, designed with
**Weak Robust Equivalence Class Testing**: 37 equivalence classes (EQ1–EQ37) and 48 test cases (TC1–TC48)
in 8 scenarios.

| Path | Content |
|---|---|
| `CU_Bank/` | The system under test (React frontend, Node.js backend), as given by the instructor |
| `e2e/tests/cubank.spec.js` | Playwright tests – each test is named after its TC ID |
| `e2e/tests/global-setup.js` | Resets the test accounts before every run |
| `e2e/screenshots/` | Screenshot of the actual output of every TC (latest run) |
| `e2e/actual.json` | Pass/fail and recorded actual output per TC (latest run) |
| `CU_Bank_EC_Table.md` | Draft of the equivalence class table |

## 1. Run the system
Requires Node.js 20+ and Docker.

```bash
# MongoDB (used instead of MongoDB Atlas from the setup guide)
docker run -d --name cubank-mongo -p 27017:27017 mongo:7

# backend – http://localhost:4000
cd CU_Bank/backend && npm install && npm run start

# frontend – http://localhost:3000 (in another terminal)
cd CU_Bank/frontend && npm install && npm run start
```

`CU_Bank/backend/config/config.env` already points `MONGO_URI` to `mongodb://localhost:27017/cubank`.
To use MongoDB Atlas instead, put your own connection string there (do not commit it).

## 2. Run the tests
With MongoDB, backend and frontend running:

```bash
cd e2e
npm install
npx playwright install chromium
npx playwright test          # all 48 TCs
npx playwright test -g "TC25 "   # one TC
npx playwright show-report
```

Before every run, `global-setup.js` deletes four account numbers from the database
(`1111111111`, `2222222222`, `1234567890`, `1234567891`) and re-creates two of them as test accounts:

| Account | Password | Role |
|---|---|---|
| `1111111111` | `1234` | A – the user under test |
| `2222222222` | `5678` | B – transfer recipient |

`1234567890` is created by TC1 (successful register) and `1234567891` must not exist for TC2–TC9.
The setup uses `docker exec cubank-mongo ...`, so the MongoDB container must have that name.
Do not run two test runs at the same time – they share the same accounts.

## 3. Latest result: 37 passed, 11 failed
Every failure is a difference between the system and the specification (the tests are not wrong).
We report them; we do not fix the system.

| Bug | TC | Spec | Actual |
|---|---|---|---|
| BUG-01 | TC25 | Amount must be **less than** the balance | Withdrawing exactly the balance succeeds (balance becomes 0) |
| BUG-02 | TC21, 27, 35, 40 | "The balance amount must be a whole number with no decimals." | Browser blocks `10.5` first; the spec message never appears |
| BUG-03 | TC20, 26, 34, 39 | "Invalid balance amount. Please enter a valid number." | Number input drops `abc`; browser shows "Please fill out this field." |
| BUG-04 | TC5 | "...Please choose another." | "...Please use a different account ID." |
| BUG-05 | TC9 | "Your fullname must be 30 characters or less, including spaces." | "The combined length of your first and last name must not exceed 30 characters." |
| BUG-06 | TC10 (observed) | Account ID is shown on the Account page | Value under "Account ID:" is empty |
