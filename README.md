# MinionLab Referral Bot

A simple Node.js bot designed by **AmoureuxID** to automate the MinionLab waitlist referral registration process. This script allows you to generate mass referrals automatically with proxy support, email verification, and easy logging.

---

## 🚀 Features

- **Email Automation**  
  Generates a temporary email address using the Guerrilla Mail API for each referral registration.
- **Automated MinionLab Registration**  
  Registers a new account with your provided MinionLab referral code.
- **Automatic Email Verification**  
  Fetches the verification code from the temporary inbox and verifies the account automatically.
- **Proxy Support**  
  Supports HTTP, HTTPS, and SOCKS5 proxies loaded from proxies.txt for each run.
- **Mass Referrals**  
  Runs the entire process in a loop for as many referrals as you want—fully hands-off.
- **Logging to File**  
  Saves each successful referral account (email:password) into `reff_accounts.txt`.
- **Simple CLI Interface**  
  No complicated config files. All interaction is via an easy-to-use command-line interface.

---

## 🏁 Getting Started

### 1. Get Your MinionLab Referral Code

If you don't have an account yet, register to get your referral code.  
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
git clone https://github.com/AmoureuxID/MinionLab-Autoreff.git
cd MinionLab-Autoreff
npm install
```

### 2. Proxy Configuration (Optional)

If you want to use proxies, create a file named `proxies.txt` in the project directory.  
Format per line:  
```
http://user:pass@ip:port
https://ip:port
socks5://user:pass@ip:port
```
If not provided, the bot uses your default IP.

---

## 🖥️ Usage

Start the bot with:

```bash
node index.js
```

**Bot flow in the terminal:**

- Enter your MinionLab referral code when prompted.
- Enter the number of referrals you want to generate.
- The bot will handle registration and email verification for each referral account.
- Each successful account is saved to `reff_accounts.txt` as `email:password`.

---

## 📁 Project Structure

```
minionlab-autoreff/
├── index.js           # Main bot script
├── package.json       # Project dependencies
├── proxies.txt        # (optional) Proxy list
├── reff_accounts.txt  # Output of generated accounts
└── README.md          # This documentation file
```

---

## ⚠️ Important Notes

- **For educational purposes only!** Use at your own risk.
- **Respect platform limitations & ToS.** The bot includes delays between actions, but use responsibly.
- **If failures occur:** Check your internet connection, proxy reliability, and try again. Third-party APIs (Guerrilla Mail, MinionLab) may be down or have changed endpoints.

---

## ❓ FAQ & Troubleshooting

- **"Failed to generate email."**  
  Guerrilla Mail API may be down or temporarily blocking your IP. Try again later or use a VPN/proxy.

- **"No email received!"**  
  MinionLab's email may be delayed. Try increasing the `DELAY_SECONDS` value in `index.js` (e.g., set to 30 seconds).

- **"Want more debug info?"**  
  Set `DEBUG_MODE` to `true` in the config section of `index.js` to see full JSON responses.

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