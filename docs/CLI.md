<!-- Clean Code -->

npx prettier --write .


<!-- Test -->

# Run test

## ✅ Run Test - Auth Module

### 🧪 Command
```bash
yarn test test/auth/tests
```

### 📋 Result (example)
```bash
$ yarn test test/auth/tests
  PASS  auth/test/auth.service.spec.ts (7.54 s)
  PASS  auth/test/auth.controller.spec.ts (7.723 s)

Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        9.698 s
Ran all test suites matching /src\\modules\\auth\\tests/i.
Done in 17.07s.
```

---

### 📝 Ghi chú
- ✅ Tất cả test case của module `auth` đã **pass 100%**.
- 🛡️ Bao gồm test controller + service → đủ cho unit & logic chính.
- 🧰 Có thể tích hợp thêm `--coverage` để kiểm tra phần code chưa được test.


## ✅ Run Test - CORS Middleware (Preflight)

### 🧪 Command
```bash
yarn test test/cors/cors.e2e-spec.ts
```

### 📋 Result (example)
```bash
$ yarn test test/cors/cors.e2e-spec.ts
  PASS  test/cors/cors.e2e-spec.ts (8.417 s)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        9.681 s
Ran all test suites matching /test\/cors\/cors.e2e-spec.ts/i.
Done in 10.21s.
```

---

### 📝 Ghi chú
- ✅ Test kiểm tra middleware CORS có xử lý đúng request **OPTIONS (preflight)** hay không.
- 🧪 Bao gồm 2 case:
  - ✔️ Origin hợp lệ (`localhost:3000`) → được phép truy cập
  - ❌ Origin không hợp lệ (`unauthorized.com`) → bị chặn
- 🧰 Phù hợp để test cơ bản middleware trước khi đưa vào production.

---

Nếu muốn clean log hơn, có thể chạy với:
```bash
yarn test test/cors/cors.e2e-spec.ts --silent
```

