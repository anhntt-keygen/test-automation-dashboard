const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock Database lưu trữ trong bộ nhớ tạm thời
let testSuites = [
  {
    id: "suite-1",
    name: "E2E Authentication Flow",
    type: "E2E",
    targetUrl: "https://app.com/login",
    cases: [
      { id: "tc-1", name: "Login successfully with valid credentials", status: "passed", duration: 1240, lastRun: "2024-10-24 14:30" },
      { id: "tc-2", name: "Show error on invalid password", status: "passed", duration: 980, lastRun: "2024-10-24 14:31" },
      { id: "tc-3", name: "Show validation error on empty email", status: "failed", duration: 450, lastRun: "2024-10-24 14:32", error: "expect(toBeVisible) failed: Element not found" }
    ]
  },
  {
    id: "suite-2",
    name: "User Management REST API",
    type: "API",
    targetUrl: "https://api.app.com/v1/users",
    cases: [
      { id: "tc-4", name: "GET /api/users returns 200 OK", status: "passed", duration: 180, lastRun: "2024-10-24 14:35" },
      { id: "tc-5", name: "POST /api/users returns 201 Created", status: "passed", duration: 250, lastRun: "2024-10-24 14:36" },
      { id: "tc-6", name: "POST /api/users returns 400 Bad Request on missing email", status: "passed", duration: 120, lastRun: "2024-10-24 14:37" },
      { id: "tc-7", name: "GET /api/users/999 returns 404 Not Found", status: "failed", duration: 95, lastRun: "2024-10-24 14:38", error: "Expected status 404, received 500 Internal Server Error" }
    ]
  }
];

// Trình mô phỏng trạng thái phiên Playwright CLI
let activeSessions = {};

// API: Lấy danh sách Test Suites
app.get('/api/suites', (req, res) => {
  res.json(testSuites);
});

// API: Thêm mới Test Suite
app.post('/api/suites', (req, res) => {
  const { name, type, targetUrl } = req.body;
  if (!name || !type || !targetUrl) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const newSuite = {
    id: `suite-${Date.now()}`,
    name,
    type,
    targetUrl,
    cases: []
  };
  testSuites.push(newSuite);
  res.status(201).json(newSuite);
});

// API: Thêm mới Test Case vào Suite
app.post('/api/suites/:suiteId/cases', (req, res) => {
  const { suiteId } = req.params;
  const { name } = req.body;
  const suite = testSuites.find(s => s.id === suiteId);
  if (!suite) {
    return res.status(404).json({ error: "Suite not found" });
  }
  const newCase = {
    id: `tc-${Date.now()}`,
    name,
    status: "idle",
    duration: 0,
    lastRun: "Never"
  };
  suite.cases.push(newCase);
  res.status(201).json(newCase);
});

// API: Chạy toàn bộ Test Suite (Giả lập thực thi)
app.post('/api/suites/:suiteId/run', (req, res) => {
  const { suiteId } = req.params;
  const suite = testSuites.find(s => s.id === suiteId);
  if (!suite) {
    return res.status(404).json({ error: "Suite not found" });
  }

  suite.cases = suite.cases.map(tc => {
    const isSuccess = Math.random() > 0.2; // 80% cơ hội thành công
    const duration = Math.floor(Math.random() * 1500) + 50;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    
    if (isSuccess) {
      return { ...tc, status: "passed", duration, lastRun: now, error: undefined };
    } else {
      const errorMsg = suite.type === "E2E" 
        ? "expect(toBeVisible) failed: Timeout 30000ms waiting for locator('button[name=\"Submit\"]')"
        : `Expected status 200, received ${[400, 403, 404, 500][Math.floor(Math.random() * 4)]} Server Error`;
      return { ...tc, status: "failed", duration, lastRun: now, error: errorMsg };
    }
  });

  res.json(suite);
});

// API: Playwright CLI Simulator Endpoint
app.post('/api/playwright-cli', (req, res) => {
  const { command, session, args } = req.body;
  const sessionId = session || 'default-session';
  
  if (!activeSessions[sessionId]) {
    activeSessions[sessionId] = {
      currentUrl: 'about:blank',
      history: [],
      elements: [],
      tracing: false
    };
  }

  const sess = activeSessions[sessionId];
  let output = '';
  let status = 'success';

  switch (command) {
    case 'open':
      const url = args[0] || 'https://example.com';
      sess.currentUrl = url;
      sess.history.push(`navigate(${url})`);
      sess.elements = [
        { ref: "e15", role: "textbox", name: "Email" },
        { ref: "e21", role: "textbox", name: "Password" },
        { ref: "e33", role: "button", name: "Sign In" }
      ];
      output = `Successfully opened ${url}`;
      break;

    case 'snapshot':
      if (sess.currentUrl === 'about:blank') {
        output = 'No page is currently open. Run "open <url>" first.';
        status = 'error';
      } else {
        output = JSON.stringify(sess.elements, null, 2);
      }
      break;

    case 'click':
      const refClick = args[0];
      const foundClick = sess.elements.find(e => e.ref === refClick);
      if (foundClick) {
        sess.history.push(`click(${refClick} - "${foundClick.name}")`);
        output = `Clicked element ${refClick} (${foundClick.name})`;
      } else {
        output = `Element reference "${refClick}" not found.`;
        status = 'error';
      }
      break;

    case 'fill':
      const refFill = args[0];
      const textVal = args.slice(1).join(' ');
      const foundFill = sess.elements.find(e => e.ref === refFill);
      if (foundFill) {
        sess.history.push(`fill(${refFill}, "${textVal}")`);
        output = `Filled "${textVal}" into ${refFill} (${foundFill.name})`;
      } else {
        output = `Element reference "${refFill}" not found.`;
        status = 'error';
      }
      break;

    case 'screenshot':
      const filename = args[0] || 'screenshot.png';
      sess.history.push(`screenshot(${filename})`);
      output = `Screenshot saved successfully as: ${filename}`;
      break;

    case 'tracing-start':
      sess.tracing = true;
      output = 'Playwright tracing session started.';
      break;

    case 'tracing-stop':
      if (sess.tracing) {
        sess.tracing = false;
        output = 'Tracing stopped. Trace artifact saved to: test-results/trace.zip';
      } else {
        output = 'No active tracing session to stop.';
        status = 'error';
      }
      break;

    case 'close':
      delete activeSessions[sessionId];
      output = `Session "${sessionId}" closed. Resources released.`;
      break;

    default:
      output = `Unknown command: "${command}". Type "help" for available commands.`;
      status = 'error';
  }

  res.json({
    status,
    output,
    sessionState: activeSessions[sessionId] || null
  });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 BMad & TEA Test Automation Dashboard is running`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
```

---