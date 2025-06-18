const readline = require('readline');
const { spawn } = require('child_process');
const fs = require('fs');
const axios = require('axios');

function printBanner() {
    console.clear();
    console.log(`
\x1b[35m╔══════════════════════════════════════════════════╗
║         MinionLab AIO Bot - AmoureuxID           ║
╚══════════════════════════════════════════════════╝\x1b[0m
    `);
}

function printMenu() {
    console.log(`
[1] Run Node Main Account
[2] Run Node Reff Accounts
[3] Autoreff for Main Account
[4] Autoreff input mode
[0] Exit
    `);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
function ask(q) {
    return new Promise((resolve) => rl.question(q, resolve));
}
function waitPressEnter() {
    return new Promise((resolve) => rl.question("Tekan ENTER untuk kembali ke menu...", resolve));
}

function runScript(command, args = []) {
    return new Promise((resolve) => {
        const child = spawn(command, args, { stdio: 'inherit' });
        child.on('exit', () => resolve());
    });
}

async function getRefcode(email, password) {
    try {
        const loginRes = await axios.post(
            "https://api.minionlab.ai/web/v1/auth/emailLogin",
            { email, password },
            { headers: { "Content-Type": "application/json" } }
        );
        const token = loginRes.data.data.token;
        const profileRes = await axios.get(
            "https://api.minionlab.ai/web/v1/auth/myInfo",
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return (
            profileRes.data.data.referralCode ||
            null
        );
    } catch (e) {
        return null;
    }
}

async function main() {
    while (true) {
        printBanner();
        printMenu();
        const choice = await ask("Pilih menu: ");
        printBanner();
        if (choice === "1") {
            console.log("[INFO] Menjalankan node_main.js ...\n");
            await runScript('node', ['node_main.js']);
            await waitPressEnter();
        } else if (choice === "2") {
            console.log("[INFO] Menjalankan node_reff.js ...\n");
            await runScript('node', ['node_reff.js']);
            await waitPressEnter();
        } else if (choice === "3") {
            if (!fs.existsSync('main_account.txt')) {
                console.log("[ERROR] File main_account.txt tidak ditemukan!\n");
                await waitPressEnter();
                continue;
            }
            const accounts = fs.readFileSync('main_account.txt', 'utf8').split('\n').filter(Boolean);
            if (!accounts.length) {
                console.log("[ERROR] main_account.txt kosong!\n");
                await waitPressEnter();
                continue;
            }
            const [email, password] = accounts[0].split(':');
            console.log(`[INFO] Login akun utama: ${email}`);
            let refcode = await getRefcode(email, password);
            if (!refcode) {
                console.log(`[ERROR] Gagal mendapatkan refcode akun utama!`);
                const manual = await ask("Masukkan refcode secara manual (atau kosong untuk batal): ");
                if (!manual) {
                    await waitPressEnter();
                    continue;
                }
                refcode = manual;
            }
            console.log(`[INFO] Refcode akun utama: ${refcode}`);
            const count = await ask("Berapa akun referral yg ingin dibuat? ");
            await runScript('node', ['autoreff.js', refcode, count]);
            await waitPressEnter();
        } else if (choice === "4") {
            const refcode = await ask("Masukkan referral code: ");
            const count = await ask("Berapa akun referral yg ingin dibuat? ");
            await runScript('node', ['autoreff.js', refcode, count]);
            await waitPressEnter();
        } else if (choice === "0") {
            console.log("Bye!");
            rl.close();
            process.exit(0);
        } else {
            console.log("Pilihan tidak valid!\n");
            await waitPressEnter();
        }
    }
}

main();