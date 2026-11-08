# CU Bank – Equivalence Class Table (ร่าง)

แนวทาง: **Weak Robust Equivalence Class Testing**
- Test case แรกของแต่ละฟังก์ชันใช้ valid class ทุกตัวพร้อมกัน
- Test case ที่เหลือมี invalid class **เพียงตัวเดียว** ส่วน input อื่นใช้ค่า valid (single-fault assumption)
- เลข EQ รันต่อเนื่องทั้งระบบ เพื่อใช้กรอกช่อง "EQ Class covered" ใน template

Pre-condition กลาง (ใช้กับฟังก์ชัน 3–6):
- Login ด้วยบัญชี A = `1111111111` / `1234`
- บัญชี B = `2222222222` / `5678` มีอยู่ในระบบแล้ว (ใช้เป็นบัญชีปลายทาง)

---

## 1. Register

| Input | EQ | Class | ประเภท | ตัวอย่างค่า | Expected (ตาม spec) |
|---|---|---|---|---|---|
| Account Number | EQ1 | ตัวเลข 10 หลัก และยังไม่มีในระบบ | Valid | `1234567890` | – |
| | EQ2 | มีอักขระที่ไม่ใช่ตัวเลข | Invalid | `12345abcde` | Your account ID should contain numbers only |
| | EQ3 | ตัวเลข < 10 หลัก | Invalid | `123456789` | Your account ID must be exactly 10 digits long |
| | EQ4 | ตัวเลข > 10 หลัก | Invalid | `12345678901` | Your account ID must be exactly 10 digits long |
| | EQ5 | 10 หลักแต่ซ้ำกับที่มีในระบบ | Invalid | `1111111111` | This account ID is already in use. Please choose another. |
| Password | EQ6 | ตัวเลข 4 หลัก | Valid | `1234` | – |
| | EQ7 | มีอักขระที่ไม่ใช่ตัวเลข | Invalid | `12ab` | Your password should contain numbers only |
| | EQ8 | ตัวเลข < 4 หลัก | Invalid | `123` | Your password must be exactly 4 digits long |
| | EQ9 | ตัวเลข > 4 หลัก | Invalid | `12345` | Your password must be exactly 4 digits long |
| Firstname + Lastname | EQ10 | ชื่อเต็ม (รวมช่องว่าง) ≤ 30 อักขระ | Valid | `Sam` + `Son` (7) | – |
| | EQ11 | ชื่อเต็ม (รวมช่องว่าง) > 30 อักขระ | Invalid | `Abcdefghijklmno` + `Pqrstuvwxyzabcd` (31) | Your fullname must be 30 characters or less, including spaces. |

**Test cases (Weak Robust):** ได้ทั้งหมด 9 TC

| TC | Inputs | EQ covered |
|---|---|---|
| TC1 | `1234567890` / `1234` / `Sam` `Son` | EQ1, EQ6, EQ10 → success แล้วไปหน้า Login |
| TC2 | `12345abcde` / `1234` / `Sam` `Son` | EQ2 |
| TC3 | `123456789` / … | EQ3 |
| TC4 | `12345678901` / … | EQ4 |
| TC5 | `1111111111` / … | EQ5 |
| TC6 | `1234567891` / `12ab` / … | EQ7 |
| TC7 | `1234567891` / `123` / … | EQ8 |
| TC8 | `1234567891` / `12345` / … | EQ9 |
| TC9 | `1234567891` / `1234` / ชื่อ 31 ตัวอักษร | EQ11 |

---

## 2. Login

| Input | EQ | Class | ประเภท | ตัวอย่างค่า | Expected |
|---|---|---|---|---|---|
| Account Number | EQ12 | ตัวเลข 10 หลัก และมีในระบบ | Valid | `1111111111` | – |
| | EQ13 | มีอักขระที่ไม่ใช่ตัวเลข | Invalid | `11111abcde` | Your account ID should contain numbers only. |
| | EQ14 | ตัวเลข < 10 หลัก | Invalid | `111111111` | Your account ID must be exactly 10 digits long. |
| | EQ15 | ตัวเลข > 10 หลัก | Invalid | `11111111111` | Your account ID must be exactly 10 digits long. |
| | EQ16 | 10 หลักแต่ไม่มีในระบบ | Invalid | `9999999998` | User not found. Please check your account ID. |
| Password | EQ17 | ตัวเลข 4 หลัก และตรงกับที่ลงทะเบียน | Valid | `1234` | – |
| | EQ18 | มีอักขระที่ไม่ใช่ตัวเลข | Invalid | `12ab` | Your password should contain numbers only. |
| | EQ19 | ตัวเลข < 4 หลัก | Invalid | `123` | Your password must be exactly 4 digits long. |
| | EQ20 | ตัวเลข > 4 หลัก | Invalid | `12345` | Your password must be exactly 4 digits long. |
| | EQ21 | ตัวเลข 4 หลักแต่ไม่ตรงกับที่ลงทะเบียน | Invalid | `4321` | Incorrect password. Please try again. |

**Test cases:** ได้ทั้งหมด 10 TC
- TC10: ใช้ EQ12 + EQ17 → เข้าหน้า Account, ปุ่ม Register และ Login หายไป, มีปุ่ม Logout
- TC11–TC19: ใช้ invalid ทีละตัว คือ EQ13, EQ14, EQ15, EQ16, EQ18, EQ19, EQ20, EQ21

---

## 3. Deposit / 4. Withdrawal / 6. Bill Payment – Amount

ทั้งสามฟังก์ชันใช้ class ของ Amount ชุดเดียวกัน ต่างกันที่ Deposit ไม่มีเงื่อนไขเรื่องยอดคงเหลือ
- EQ ที่ระบุว่า "W/T/B" ใช้กับ Withdraw, Transfer และ Bill Payment
- กำหนดยอดคงเหลือ (balance) ก่อนทดสอบ = **1000**

| EQ | Class ของ Amount | ประเภท | ตัวอย่างค่า | Expected |
|---|---|---|---|---|
| EQ22 | จำนวนเต็ม > 0 (Deposit ไม่จำกัดค่าสูงสุด) | Valid | `500` | ยอดคงเหลือและประวัติรายการถูกอัปเดต |
| EQ23 | ไม่ใช่ตัวเลข | Invalid | `abc` หรือช่องว่าง | Invalid balance amount. Please enter a valid number. |
| EQ24 | ทศนิยม | Invalid | `10.5` | The balance amount must be a whole number with no decimals. |
| EQ25 | ≤ 0 | Invalid | `0` | The amount must be greater than 0. Please enter a positive number. |
| EQ26 *(W/T/B)* | 0 < amount < balance | Valid | `300` | ยอดคงเหลือและประวัติรายการถูกอัปเดต |
| EQ27 *(W/T/B)* | amount ≥ balance | Invalid | `1500` และ `1000` (ค่าขอบ) | Your balance is not enough to complete the withdrawal / transfer / bill payment. |

**Deposit:** ได้ 4 TC คือ EQ22, EQ23, EQ24, EQ25

**Withdrawal:** ได้ 5 TC คือ EQ26, EQ23, EQ24, EQ25, EQ27

---

## 5. Transfer

| Input | EQ | Class | ประเภท | ตัวอย่างค่า | Expected |
|---|---|---|---|---|---|
| target Account | EQ28 | ตัวเลข 10 หลัก, มีในระบบ, ไม่ใช่บัญชีตัวเอง | Valid | `2222222222` | – |
| | EQ29 | มีอักขระที่ไม่ใช่ตัวเลข | Invalid | `22222abcde` | Your account ID should contain numbers only. |
| | EQ30 | ตัวเลข < 10 หลัก | Invalid | `222222222` | Your account ID must be exactly 10 digits long. |
| | EQ31 | ตัวเลข > 10 หลัก | Invalid | `22222222222` | Your account ID must be exactly 10 digits long. |
| | EQ32 | 10 หลักแต่ไม่มีในระบบ | Invalid | `9999999998` | We couldn't find the recipient's account. Please double-check the account ID. |
| | EQ33 | เป็นเลขบัญชีของตัวเอง | Invalid | `1111111111` | You cannot transfer to your own account. |
| Amount | EQ26, 23, 24, 25, 27 | ใช้ class ชุดเดียวกับข้อ 3/4/6 | | | ข้อความ "…complete the transfer." |

**Test cases:** ได้ 10 TC
- TC แรก: EQ28 + EQ26 ผ่าน แล้วตรวจว่าประวัติรายการและยอดคงเหลือถูกอัปเดตทั้งบัญชีต้นทางและบัญชีปลายทาง
- ที่เหลือใช้ invalid ทีละตัว คือ EQ29–EQ33 และ EQ23, EQ24, EQ25, EQ27

---

## 6. Bill Payment

| Input | EQ | Class | ประเภท | ตัวอย่างค่า |
|---|---|---|---|---|
| Target payment | EQ34 | ค่าน้ำ | Valid | water |
| | EQ35 | ค่าไฟฟ้า | Valid | electric |
| | EQ36 | ค่าโทรศัพท์ | Valid | phone |
| | EQ37 | ไม่ได้เลือกรายการใดเลย | Invalid | (spec ระบุว่า N/A จึงต้องสังเกตพฤติกรรมจริงของระบบ) |
| Amount | EQ26, 23, 24, 25, 27 | ใช้ class ชุดเดียวกับข้อ 3/4/6 | | ข้อความ "…complete the bill payment." |

**Test cases:** ได้ 8 TC
- Valid 3 TC: EQ34+EQ26, EQ35+EQ26, EQ36+EQ26 (ให้ครอบคลุม target ครบทั้ง 3 ค่า)
- Invalid 5 TC: EQ37, EQ23, EQ24, EQ25, EQ27

---

## ⚠️ จุดที่โค้ดน่าจะไม่ตรงกับ spec (ควรรันยืนยัน แล้วแคปหน้าจอเก็บไว้เป็น bug)

1. **ค่าขอบ amount = balance (EQ27):** spec กำหนดว่าต้อง "น้อยกว่า" ยอดคงเหลือ แต่โค้ดทั้งฝั่ง frontend และ backend ใช้เงื่อนไข `balance < amount` จึงยอมให้ถอน/โอน/จ่ายเท่ากับยอดคงเหลือพอดีได้
2. **ทศนิยม (EQ24):** frontend ใช้ `parseInt()` ทำให้ `10.5` กลายเป็น `10` แล้วทำรายการสำเร็จ ข้อความ "whole number" จึงไม่ขึ้นเลยเมื่อทดสอบผ่าน UI
3. **ข้อความกรณีบัญชีซ้ำ (EQ5):** ระบบแสดง "...Please use a different account ID." แต่ spec กำหนดเป็น "Please choose another."
4. **ข้อความกรณีชื่อยาวเกิน (EQ11):** ระบบแสดง "The combined length of your first and last name must not exceed 30 characters." ซึ่งต่างจาก spec
5. **ไม่ได้เลือก bill target (EQ37):** ไม่พบ validation ฝั่ง frontend ต้องลองดูว่าระบบบันทึกรายการโดย target ว่างหรือไม่
6. **ลำดับการเช็กของ Transfer ที่ backend:** เช็กยอดคงเหลือก่อนเช็กว่ามีบัญชีปลายทางหรือไม่ ถ้าใส่ทั้งบัญชีผิดและจำนวนเงินเกิน จะได้ error เรื่องยอดเงินแทน (เป็นข้อสังเกต ไม่กระทบ TC แบบ single-fault)

> ตัวอย่างค่าทั้งหมดยังเป็นร่าง ควรตรวจกับข้อความ error ที่หน้าจอแสดงจริงก่อนนำไปใส่ในช่อง Expected ของรายงาน
