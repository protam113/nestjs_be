### 📄 `logger-levels.md`

```md
# 🧾 Logger Levels in NestJS

NestJS provides a built-in `Logger` class that supports various log levels to help developers track, debug, and monitor application behavior.

---

## 🔹 `log(message: string)`
- **Level:** `log` (normal level)
- **Purpose:** Used for general information that is useful but not critical.
- **Example Use Case:** Successful actions, routine app flow, initialization messages.

```ts
this.logger.log('User registration process started');
```

---

## 🔸 `error(message: string, trace?: string)`
- **Level:** `error`
- **Purpose:** Used when something goes wrong in the system – failed operations, exceptions, etc.
- **Example Use Case:** API failures, exceptions caught in a try-catch block, database errors.

```ts
this.logger.error('Failed to connect to the database', error.stack);
```

---

## ⚠️ `warn(message: string)`
- **Level:** `warn`
- **Purpose:** Used to log non-critical warnings that should be looked into.
- **Example Use Case:** Deprecated features, misconfigurations, suspicious user input.

```ts
this.logger.warn('User attempted to access a restricted route');
```

---

## 🛠 `debug(message: string)`
- **Level:** `debug`
- **Purpose:** Useful for developers to understand application internals during development or troubleshooting.
- **Example Use Case:** Variable values, function executions, intermediate states.

```ts
this.logger.debug(`User object before save: ${JSON.stringify(user)}`);
```

---

## 📚 `verbose(message: string)`
- **Level:** `verbose`
- **Purpose:** Highly detailed logs for very fine-grained tracing and monitoring.
- **Example Use Case:** Log every step in a pipeline, data flow, or internal module operation.

```ts
this.logger.verbose('Authentication middleware triggered for /profile route');
```

---

## 🧠 Best Practices

- 🔧 Use `debug` and `verbose` only in development unless you have performance monitoring set up.
- 📁 Log errors with stack traces when possible to aid in debugging.
- 🚫 Avoid overlogging – too much noise reduces signal clarity.
- 📊 Consider integrating a real logger like **Winston** or **Pino** if you need custom log levels, formats, or outputs (files, cloud).

---

## 📝 Summary Table

| Method        | Level     | Description                                 |
|---------------|-----------|---------------------------------------------|
| `log()`       | Normal    | General-purpose logging                     |
| `error()`     | Error     | Errors and exceptions                      |
| `warn()`      | Warning   | Potential issues or non-critical problems |
| `debug()`     | Debug     | Developer-level insights                   |
| `verbose()`   | Verbose   | Super detailed logs                        |

