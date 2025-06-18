# MinionLab AIO Bot

A complete Node.js automation suite by **AmoureuxID** for MinionLab waitlist farming, airdrop, and referral management.  
Supports main account farming, mass referral generation (autoreff), proxy rotation, and a user-friendly CLI menu.

---

## 🚀 Features

- **Main Account Point Farming**  
  Automate point checking and farming for your main MinionLab account (`node_main.js`).
- **Reff Account Management**  
  Run node farming for referral accounts with one click (`node_reff.js`).
- **Autoreff (Referral Generator)**  
  Automatically create new MinionLab accounts with your referral code and verify via GuerrillaMail (`autoreff.js`).
- **Auto Refcode Fetch**  
  Fetch referral code from your main account automatically using your credentials.
- **Proxy Support**  
  Supports HTTP, HTTPS, and SOCKS5 proxies via `proxies.txt`.
- **Interactive AIO CLI**  
  Simple menu system (`index.js`) for all bot operations—no need to remember commands.
- **Logging to File**  
  All generated accounts and credentials saved to `reff_accounts.txt`.

---

## 🏁 Getting Started

### 1. Get Your MinionLab Referral Code

You can get your refcode from the app or let this bot fetch it automatically from your main account.

👉 **[Go to MinionLab](https://app.minionlab.ai/index?referralCode=KnwHCFzS)**

### 2. Join the AmoureuxID Community

For updates, tips, and airdrop info:  
🔗 **[Join AmoureuxID on Telegram](https://t.me/AmoureuxID)**

---

## ⚙️ Installation

### Prerequisites

- Node.js (v16.x or newer)
- npm

### 1. Clone & Install

```bash
git clone https://github.com/AmoureuxID/MinionLab-AIO-Bot.git
cd MinionLab-AIO-Bot
npm install
```

### 2. Proxy Configuration (Optional)

Add a `proxies.txt` file for proxy rotation. Supported formats per line:
```
http://user:pass@ip:port
https://ip:port
socks5://user:pass@ip:port
```
If not provided, the bot will use your default IP.

---

## 🖥️ Usage

Start the CLI menu with:

```bash
node index.js
```

**Menu Example:**
```
╔══════════════════════════════════════════════════╗
║         MinionLab AIO Bot - AmoureuxID           ║
╚══════════════════════════════════════════════════╝

[1] Run Node Main Account      -> Runs node_main.js  
[2] Run Node Reff Accounts     -> Runs node_reff.js  
[3] Autoreff for Main Account  -> Get refcode by login  
[4] Autoreff input code        -> Manually input referral code for autoreff  
[0] Exit
```

- **[1]** Run farming bot for your main account (email:password in `main_account.txt`).
- **[2]** Run farming bot for your referral accounts (`reff_accounts.txt`).
- **[3]** Autoreff using your main account's refcode (auto-fetched).
- **[4]** Autoreff with manual refcode input.

All successful accounts are saved to `reff_accounts.txt` as `email:password`.

---

## 📁 Project Structure

```
MinionLab-AIO-Bot/
├── index.js           # Main CLI menu & controller
├── node_main.js       # Main account farming logic
├── node_reff.js       # Reff account farming logic
├── autoreff.js        # Automated referral generator
├── package.json       # Dependencies
├── proxies.txt        # (optional) Proxy list
├── main_account.txt   # Your main MinionLab account (email:password)
├── reff_accounts.txt  # Output of generated referral accounts
└── README.md          # This file
```

---

## ⚠️ Important Notes

- **For educational purposes only!** Use at your own risk.
- **Respect platform limitations & ToS.** The bot includes delays between actions, but use responsibly.
- **If failures occur:** Check your internet, proxies, or dependencies. Third-party APIs may be down or have changed endpoints.

---

## ❓ FAQ & Troubleshooting

- **"Failed to generate email."**  
  Guerrilla Mail API may be down or temporarily blocking your IP. Try again later or use a VPN/proxy.

- **"No email received!"**  
  MinionLab's email may be delayed. Try increasing the `DELAY_SECONDS` value in `autoreff.js` (e.g., set to 30 seconds).

- **"Want more debug info?"**  
  Set `DEBUG_MODE` to `true` in `autoreff.js` to see full JSON responses.

---

## 🤗 Contributing

1. Fork this repository.
2. Create a new feature branch (`git checkout -b feature/NewFeature`).
3. Commit and push your changes.
4. Open a Pull Request.

---

## 📜 License & Attribution

- For educational purposes only — use at your own risk.
- Developed by **AmoureuxID**.

---

## 📬 Support & Contact

- Telegram: [@AmoureuxID](https://t.me/AmoureuxID)
- GitHub Issues: [Open an Issue](https://github.com/AmoureuxID/MinionLab-Autoreff/issues)

---

## 🧋 Buy Me a Coffee

If you find this project helpful, your support is appreciated!

- EVM  : `0xcee2713694211aF776E0a3c1B0E4d9B5B45167c1`
- TON  : `UQAGw7KmISyrILX807eYYY1sxPofEGBvOUKtDGo8QPtYY_SL`
- SOL  : `9fYY9YkPmaumkPUSqjD6oaYxvxNo3wETpC9A7nE3Pbza`
- SUI  : `0x2f4b127951b293e164056b908d05c826011a258f81910f2685a8c433158a7b9b`

---

⭐ If you enjoy this project, please star the repository!

**à la folie.**