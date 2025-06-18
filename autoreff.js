const axios = require('axios');
const fs = require('fs');
const { SocksProxyAgent } = require('socks-proxy-agent');
const HttpsProxyAgent = require('https-proxy-agent');

const CONFIG = {
    MINIONLAB_GET_CODE_URL: "https://api.minionlab.ai/web/v1/auth/getEmailCode",
    MINIONLAB_EMAIL_LOGIN_URL: "https://api.minionlab.ai/web/v1/auth/emailLogin",
    GUERRILLA_API_URL: "https://api.guerrillamail.com/ajax.php",
    DELAY_SECONDS: 15,
    DEBUG_MODE: false
};

const LOG_ICON = {
    email: "✉️",
    send: "📤",
    inbox: "📬",
    code: "🔑",
    success: "🟢",
    fail: "🔴"
};

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function randomPassword(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function extractVerificationCode(html) {
    const matches = [...html.matchAll(/<span[^>]*>([A-Za-z0-9])<\/span>/g)];
    return matches.map(m => m[1]).join('');
}

function printStatus(icon, message, color = 'reset') {
    const colors = {
        reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', blue: '\x1b[34m', yellow: '\x1b[33m'
    };
    let colorCode = colors[color] || colors.reset;
    console.log(`${colorCode}${icon} ${message}${colors.reset}`);
}

function loadProxies() {
    if (!fs.existsSync('proxies.txt')) return [];
    const lines = fs.readFileSync('proxies.txt', 'utf8').split('\n').map(l => l.trim()).filter(Boolean);
    return lines;
}
function getAxiosProxyAgent(proxyStr) {
    if (!proxyStr) return undefined;
    try {
        if (proxyStr.startsWith('socks5://')) {
            return new SocksProxyAgent(proxyStr);
        } else if (proxyStr.startsWith('http://') || proxyStr.startsWith('https://')) {
            return new HttpsProxyAgent.HttpsProxyAgent(proxyStr);
        }
    } catch (e) {
        printStatus(LOG_ICON.fail, `Proxy parse error: ${e.message}`, 'red');
    }
    return undefined;
}

async function getGuerrillaSession(agent) {
    for (let i = 0; i < 3; i++) {
        try {
            const { data } = await axios.get(CONFIG.GUERRILLA_API_URL, { params: { f: "get_email_address" }, timeout: 15000, httpsAgent: agent, httpAgent: agent });
            return { sidToken: data.sid_token, emailAddr: data.email_addr };
        } catch (err) {
            printStatus(LOG_ICON.fail, `GuerrillaMail error (attempt ${i+1}/3): ${err.code || err.message}`, 'red');
            await sleep(2000);
        }
    }
    return null;
}

async function requestMinionlabCode(email, agent) {
    try {
        const res = await axios.post(CONFIG.MINIONLAB_GET_CODE_URL, { email }, {
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
                "Origin": "https://app.minionlab.ai",
                "Referer": "https://app.minionlab.ai/"
            },
            timeout: 15000,
            httpsAgent: agent,
            httpAgent: agent
        });
        if (CONFIG.DEBUG_MODE) console.log("[DEBUG] Minionlab code req:", res.data);
        return res.data;
    } catch (e) {
        printStatus(LOG_ICON.fail, `MinionLab get code error: ${e.code || e.message}`, 'red');
        return null;
    }
}

async function fetchLatestGuerrillaEmail(sidToken, agent) {
    for (let i=0; i<10; i++) { // polling up to 10x with delay
        try {
            const listResp = await axios.get(CONFIG.GUERRILLA_API_URL, {
                params: { f: "get_email_list", offset: 0, sid_token: sidToken },
                timeout: 10000, httpsAgent: agent, httpAgent: agent
            });
            const emails = listResp.data.list;
            if (emails && emails.length) {
                const mail_id = emails[0].mail_id;
                const mailResp = await axios.get(CONFIG.GUERRILLA_API_URL, {
                    params: { f: "fetch_email", email_id: mail_id, sid_token: sidToken },
                    timeout: 10000, httpsAgent: agent, httpAgent: agent
                });
                return mailResp.data.mail_body;
            }
            await sleep(3000);
        } catch (e) {
            printStatus(LOG_ICON.fail, `Fetch email error: ${e.code || e.message}`, 'red');
            await sleep(2000);
        }
    }
    return null;
}

async function registerMinionlab(email, code, password, referralCode, agent) {
    try {
        const res = await axios.post(CONFIG.MINIONLAB_EMAIL_LOGIN_URL,
            { email, code, password, referralCode },
            {
                headers: {
                    "Content-Type": "application/json; charset=UTF-8",
                    "Origin": "https://app.minionlab.ai",
                    "Referer": "https://app.minionlab.ai/"
                },
                timeout: 20000,
                httpsAgent: agent, httpAgent: agent
            }
        );
        if (CONFIG.DEBUG_MODE) console.log("[DEBUG] Email login response:", res.data);
        return res.data;
    } catch (e) {
        printStatus(LOG_ICON.fail, `Register error: ${e?.response?.data?.message || e.code || e.message}`, 'red');
        return { error: true, message: e?.response?.data?.message || e.message };
    }
}

async function autoreffOne(referralCode, proxyStr, idx, total) {
    const agent = getAxiosProxyAgent(proxyStr);

    // Step banner
    let pad = (n, len) => n.toString().padStart(len, ' ');
    let idxStr = pad(idx, total.toString().length);
    let totalStr = total;
    let banner = `========================  [ ${idxStr} / ${totalStr} ]  =======================`;
    console.log(banner);

    printStatus(LOG_ICON.send, `Proxy: ${proxyStr ? proxyStr : "default/no proxy"}`, 'blue');
    // 1. Generate random email
    const guerrilla = await getGuerrillaSession(agent);
    if (!guerrilla) { printStatus(LOG_ICON.fail, "Failed to generate email.", 'red'); return false; }
    printStatus(LOG_ICON.email, `Email generated [${guerrilla.emailAddr}]`, 'green');

    // 2. Request verification code
    const reqRes = await requestMinionlabCode(guerrilla.emailAddr, agent);
    if (!reqRes) { printStatus(LOG_ICON.fail, "Failed to request code from MinionLab.", 'red'); return false; }
    printStatus(LOG_ICON.send, 'Verification code requested', 'blue');

    // 3. Wait for email
    printStatus(LOG_ICON.inbox, `Waiting for email (${CONFIG.DELAY_SECONDS}s)...`, 'yellow');
    await sleep(CONFIG.DELAY_SECONDS * 1000);

    // 4. Fetch email inbox
    const emailBody = await fetchLatestGuerrillaEmail(guerrilla.sidToken, agent);
    if (!emailBody) { printStatus(LOG_ICON.fail, "No email received!", 'red'); return false; }
    printStatus(LOG_ICON.inbox, 'Email received', 'green');

    // 5. Extract verification code
    const code = extractVerificationCode(emailBody);
    if (!code) { printStatus(LOG_ICON.fail, "Verification code not found!", 'red'); return false; }
    printStatus(LOG_ICON.code, `Verification code: ${code}`, 'yellow');

    // 6. Register minionlab account
    const password = randomPassword(12);
    const result = await registerMinionlab(guerrilla.emailAddr, code, password, referralCode, agent);
    if (result.error) {
        printStatus(LOG_ICON.fail, `Registration failed: ${result.message}`, 'red');
        return false;
    }
    if (result.data && result.data.user && result.data.token) {
        printStatus(LOG_ICON.success, `Registered! [${guerrilla.emailAddr}]`, 'green');
        // Write to file
        fs.appendFileSync('reff_accounts.txt', `${guerrilla.emailAddr}:${password}\n`);
        return true;
    }
    printStatus(LOG_ICON.fail, `Registration failed: Unknown error`, 'red');
    return false;
}

// RUN WITH: node autoreff.js refcode manyaccounts
async function main() {
    const banner = `
\x1b[35m╔═════════════════════════════════════════════╗
║       MinionLab Autoreff - AmoureuxID       ║
╚═════════════════════════════════════════════╝\x1b[0m
    `;
    console.log(banner);
    console.log("================== MINIONLAB REFERRAL BOT ==================");

    const argv = process.argv;
    const referralCode = argv[2];
    const count = parseInt(argv[3], 10);

    if (!referralCode || isNaN(count) || count < 1) {
        printStatus(LOG_ICON.fail, "Usage: node autoreff.js <referral_code> <how_many>", 'red'); 
        process.exit(1);
    }

    const proxies = loadProxies();
    let proxyIdx = 0;

    for (let i = 1; i <= count; i++) {
        const proxy = proxies.length ? proxies[proxyIdx % proxies.length] : null;
        await autoreffOne(referralCode, proxy, i, count);
        proxyIdx++;
        if (i < count) await sleep(2000);
    }
    printStatus(LOG_ICON.success, "ALL DONE", 'green');
}

main();