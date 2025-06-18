const chalk = require("chalk");
const fs = require("fs");
const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");
const WebSocket = require("ws");
const readline = require("readline");

// ===== Logger & Prompt =====
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getTimestamp() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return `${dateStr} ${timeStr}`;
}

function logMessage({ accountNum = null, total = null, type = "INFO", message = "" }) {
  let prefix = `[${getTimestamp()}] `;
  if (accountNum && total) {
    prefix += `[${accountNum}/${total}] `;
  }
  prefix += `[${type}] `;
  console.log(`${prefix}${message}`);
}

// ===== Proxy Utils =====
let proxyList = [];
let axiosConfig = {};

function getProxyAgent(proxyUrl, index, total) {
  try {
    const isSocks = proxyUrl.toLowerCase().startsWith("socks");
    if (isSocks) {
      return new SocksProxyAgent(proxyUrl);
    }
    return new HttpsProxyAgent(
      proxyUrl.startsWith("http") ? proxyUrl : `http://${proxyUrl}`
    );
  } catch (error) {
    logMessage({ accountNum: index, total, type: "ERROR", message: `Error creating proxy agent: ${error.message}` });
    return undefined;
  }
}

function loadProxies() {
  try {
    const proxyFile = fs.readFileSync("proxies.txt", "utf8");
    proxyList = proxyFile
      .split("\n")
      .filter((line) => line.trim())
      .map((proxy) => {
        proxy = proxy.trim();
        if (!proxy.includes("://")) {
          return `http://${proxy}`;
        }
        return proxy;
      });
    if (proxyList.length === 0) {
      throw new Error("No proxies found in proxies.txt");
    }
    logMessage({ type: "SUCCESS", message: `Loaded ${proxyList.length} proxies from proxies.txt` });
    return true;
  } catch (error) {
    logMessage({ type: "ERROR", message: `Error loading proxies: ${error.message}` });
    return false;
  }
}

async function checkIP(index, total) {
  try {
    const response = await axios.get(
      "https://api.ipify.org?format=json",
      axiosConfig
    );
    const ip = response.data.ip;
    logMessage({ accountNum: index, total, type: "SUCCESS", message: `IP Using: ${ip}` });
    return { success: true, ip: ip };
  } catch (error) {
    logMessage({ accountNum: index, total, type: "ERROR", message: `Failed to get IP: ${error.message}` });
    return false;
  }
}

async function getRandomProxy(index, total) {
  if (proxyList.length === 0) {
    axiosConfig = {};
    await checkIP(index, total);
    return null;
  }

  let proxyAttempt = 0;
  while (proxyAttempt < proxyList.length) {
    const proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
    try {
      const agent = getProxyAgent(proxy, index, total);
      if (!agent) continue;

      axiosConfig.httpsAgent = agent;
      await checkIP(index, total);
      return proxy;
    } catch (error) {
      proxyAttempt++;
    }
  }

  logMessage({ type: "WARNING", message: "Using default IP" });
  axiosConfig = {};
  await checkIP(index, total);
  return null;
}

// ===== WebSocket Bot Class =====
class SocketStream {
  constructor(email, password, proxy = null, currentNum, total) {
    this.email = email;
    this.password = password;
    this.currentNum = currentNum;
    this.total = total;
    this.proxy = proxy;
    this.axiosConfig = {
      ...(this.proxy && { httpsAgent: getProxyAgent(this.proxy, this.currentNum, this.total) }),
      timeout: 60000,
    };
    this.ws = null;
    this.browserId = "";
    this.userId = "";
    this.accessToken = "";
  }

  async makeRequest(method, url, config = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios({
          method,
          url,
          ...this.axiosConfig,
          ...config,
        });
        return response;
      } catch (error) {
        if (i === retries - 1) {
          logMessage({ accountNum: this.currentNum, total: this.total, type: "ERROR", message: `Request failed: ${error.message}` });
          return null;
        }
        logMessage({ type: "WARNING", message: `Retrying... (${i + 1}/${retries})` });
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    return null;
  }

  async login() {
    const loginUrl = "https://api.allstream.ai/web/v1/auth/emailLogin";
    const data = {
      email: this.email,
      password: this.password,
    };

    try {
      const response = await this.makeRequest("POST", loginUrl, { data });
      if (response && response.data) {
        const { data } = response.data;
        this.userId = data.user.uuid;
        this.accessToken = data.token;
        this.browserId = this.generateBrowserId();
        logMessage({ accountNum: this.currentNum, total: this.total, type: "SUCCESS", message: `Login successfully for ${this.email}` });
        await this.connectWebSocket();
      }
    } catch (error) {
      logMessage({ accountNum: this.currentNum, total: this.total, type: "ERROR", message: `Login failed for ${this.email}: ${error.message}` });
    }
  }

  async waitUntilReady() {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          logMessage({ accountNum: this.currentNum, total: this.total, type: "SUCCESS", message: `Account ${this.currentNum} is fully ready` });
          resolve();
        } else {
          setTimeout(checkReady, 1000);
        }
      };
      checkReady();
    });
  }

  generateBrowserId() {
    const characters = 'abcdef0123456789';
    let browserId = '';
    for (let i = 0; i < 32; i++) {
      browserId += characters[Math.floor(Math.random() * characters.length)];
    }
    return browserId;
  }

  async connectWebSocket() {
    const url = "wss://gw0.streamapp365.com/connect";
    const wsOptions = this.proxy ? { agent: getProxyAgent(this.proxy, this.currentNum, this.total) } : undefined;
    this.ws = new WebSocket(url, wsOptions);
    this.ws.onopen = () => {
      logMessage({ accountNum: this.currentNum, total: this.total, type: "SUCCESS", message: `WebSocket connected for account ${this.currentNum}` });
      this.sendRegisterMessage();
    };

    this.ws.onmessage = (event) => {
      let rawData = event.data.toString();
      if (rawData.startsWith("{") && rawData.endsWith("}")) {
        try {
          const message = JSON.parse(rawData);
          this.handleMessage(message);
        } catch (error) {
          logMessage({ accountNum: this.currentNum, total: this.total, type: "ERROR", message: `Error parsing JSON: ${error.message}` });
        }
      }
    };

    this.ws.onclose = () => {
      logMessage({ accountNum: this.currentNum, total: this.total, type: "WARNING", message: `WebSocket disconnected for account ${this.currentNum}` });
      this.reconnectWebSocket();
    };

    this.ws.onerror = (error) => {
      logMessage({ accountNum: this.currentNum, total: this.total, type: "ERROR", message: `WebSocket error for account ${this.currentNum}: ${error.message}` });
    };
  }

  sendRegisterMessage() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: "register",
        user: this.userId,
        dev: this.browserId,
      };
      this.ws.send(JSON.stringify(message));
      logMessage({ accountNum: this.currentNum, total: this.total, type: "SUCCESS", message: `Registered browser for account ${this.currentNum}` });
    }
  }

  async handleMessage(message) {
    if (message.type === "request") {
      // Not implemented: You can implement request handlers here if needed
    } else {
      logMessage({ accountNum: this.currentNum, total: this.total, type: "WARNING", message: `Unhandled message type: ${message.type}` });
    }
  }

  startPinging() {
    const pingServer = async () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
        await this.realTime();
      }
      setTimeout(pingServer, 60000);
    };
    pingServer();
  }

  async realTime() {
    const pointUrl = `https://api.allstream.ai/web/v1/dashBoard/info`;
    try {
      const response = await this.makeRequest("GET", pointUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response && response.data) {
        const { data } = response.data;
        logMessage({ accountNum: this.currentNum, total: this.total, type: "SUCCESS", message: `Successfully retrieved data for account ${this.currentNum}` });
        logMessage({ accountNum: this.currentNum, total: this.total, type: "SUCCESS", message: `Total Points = ${data.totalScore ?? 0}` });
        logMessage({ accountNum: this.currentNum, total: this.total, type: "SUCCESS", message: `Today Points = ${data.todayScore ?? 0}` });
      }
    } catch (error) {
      logMessage({ accountNum: this.currentNum, total: this.total, type: "ERROR", message: `Error retrieving points for ${this.email}: ${error.message}` });
    }
  }

  reconnectWebSocket() {
    setTimeout(() => {
      this.connectWebSocket();
    }, 5000);
  }
}

// ===== Main =====

async function main() {
  console.log(chalk.cyan(`
╔═════════════════════════════════════════════╗
║         MinionLab Node - AmoureuxID         ║
╚═════════════════════════════════════════════╝
`));

  const accounts = fs
    .readFileSync("reff_accounts.txt", "utf8")
    .split("\n")
    .filter(Boolean);
  const count = accounts.length;

  const proxiesLoaded = loadProxies();
  if (!proxiesLoaded) {
    logMessage({ type: "WARNING", message: "No Proxy. Using default IP" });
  }

  let successful = 0;
  const socketStreams = [];

  for (let i = 0; i < count; i++) {
    logMessage({ accountNum: i + 1, total: count, type: "INFO", message: "Process" });
    const [email, password] = accounts[i].split(":");
    const currentProxy = await getRandomProxy(i + 1, count);
    const socketStream = new SocketStream(email, password, currentProxy, i + 1, count);
    socketStreams.push(socketStream);

    try {
      await socketStream.login();
      await socketStream.waitUntilReady();
      successful++;
    } catch (err) {
      logMessage({ accountNum: i + 1, total: count, type: "ERROR", message: `Error: ${err.message}` });
    }
  }

  logMessage({ type: "SUCCESS", message: "All accounts are ready. Starting real-time point checking..." });

  socketStreams.forEach((stream) => {
    stream.startPinging();
  });

  rl.close();
}

main().catch((err) => {
  logMessage({ type: "ERROR", message: `Error occurred: ${err}` });
  process.exit(1);
});
