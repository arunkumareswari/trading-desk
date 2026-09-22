"""
Trading Journal — MT5 Python Direct Bridge
Connects to MetaTrader 5 locally using official MetaTrader5 Python library
and syncs trades automatically to your Trading Journal Webhook.

Prerequisites:
  pip install MetaTrader5 requests

Usage:
  python mt5_sync.py
"""

import time
import datetime
import requests
import sys

# ==========================================
# CONFIGURATION — Fill your details here
# ==========================================
JOURNAL_WEBHOOK_URL = "http://localhost:3000/api/webhooks/mt5"  # Your Journal Webhook URL
ACCOUNT_TOKEN       = "cmu2vhxgh0000ekceeaqtrvq8"             # Your Account Token from Settings

# Optional: Auto-login to specific MT5 account (leave as None if MT5 is already logged in)
MT5_LOGIN    = None       # e.g., 51234567 (integer) or None
MT5_PASSWORD = None       # e.g., "InvestorPwd123" or None
MT5_SERVER   = None       # e.g., "Exness-Real2" or "FTMO-Server" or None

CHECK_INTERVAL_SECONDS = 5  # Scan interval
HISTORY_DAYS_TO_SCAN   = 30 # Days of history to scan on startup

# ==========================================
# SYNC LOGIC
# ==========================================
try:
    import MetaTrader5 as mt5
except ImportError:
    print("❌ MetaTrader5 Python package not found!")
    print("👉 Please run: pip install MetaTrader5 requests")
    sys.exit(1)

synced_tickets = set()

def init_mt5():
    print("=" * 60)
    print("🚀 Initializing MetaTrader 5 Python Direct Sync Bridge...")
    print(f"📡 Webhook URL: {JOURNAL_WEBHOOK_URL}")
    print(f"🔑 Account Token: {ACCOUNT_TOKEN}")
    print("=" * 60)

    if MT5_LOGIN and MT5_PASSWORD and MT5_SERVER:
        initialized = mt5.initialize(login=MT5_LOGIN, password=MT5_PASSWORD, server=MT5_SERVER)
    else:
        initialized = mt5.initialize()

    if not initialized:
        print(f"❌ MT5 initialization failed. Error code: {mt5.last_error()}")
        print("💡 Make sure MetaTrader 5 desktop terminal is installed on your Windows PC.")
        return False

    account_info = mt5.account_info()
    if account_info:
        print(f"✅ Connected to MT5 Account: #{account_info.login} ({account_info.server})")
        print(f"💰 Balance: {account_info.balance} {account_info.currency} | Equity: {account_info.equity}")
    else:
        print("⚠️ Connected to MT5, but could not retrieve account info.")

    return True

def sync_deals():
    global synced_tickets

    from_date = datetime.datetime.now() - datetime.timedelta(days=HISTORY_DAYS_TO_SCAN)
    to_date = datetime.datetime.now() + datetime.timedelta(days=1)

    deals = mt5.history_deals_get(from_date, to_date)
    if deals is None:
        return

    # Filter closed deals (DEAL_ENTRY_OUT or DEAL_ENTRY_INOUT)
    # entry == 1 is DEAL_ENTRY_OUT, entry == 2 is DEAL_ENTRY_INOUT
    deals_to_send = []

    for deal in deals:
        ticket = deal.ticket
        if ticket in synced_tickets:
            continue

        # In MT5: entry 1 is DEAL_ENTRY_OUT (position closed)
        if deal.entry not in (1, 2):
            continue

        # deal.type: 0 is BUY, 1 is SELL
        if deal.type not in (0, 1):
            continue

        symbol = deal.symbol
        volume = deal.volume
        exit_price = deal.price
        profit = deal.profit
        commission = abs(deal.commission)
        swap = abs(deal.swap)
        close_time = datetime.datetime.fromtimestamp(deal.time).strftime("%Y-%m-%d %H:%M:%S")

        # Find entry deal to get entry price and open time
        open_price = exit_price
        open_time = close_time
        side = "SHORT" if deal.type == 0 else "LONG" # Closing a short uses BUY

        position_id = deal.position_id
        for d in deals:
            if d.position_id == position_id and d.entry == 0: # DEAL_ENTRY_IN
                open_price = d.price
                open_time = datetime.datetime.fromtimestamp(d.time).strftime("%Y-%m-%d %H:%M:%S")
                side = "LONG" if d.type == 0 else "SHORT"
                break

        deals_to_send.append({
            "ticket": ticket,
            "symbol": symbol,
            "side": side,
            "lots": volume,
            "openPrice": open_price,
            "closePrice": exit_price,
            "openTime": open_time,
            "closeTime": close_time,
            "profit": profit,
            "commission": commission,
            "swap": swap,
            "comment": deal.comment or "Python MT5 Direct Sync",
            "magic": deal.magic,
        })

        synced_tickets.add(ticket)

    if not deals_to_send:
        return

    payload = {
        "apiToken": ACCOUNT_TOKEN,
        "action": "SYNC_TRADES",
        "trades": deals_to_send,
    }

    try:
        res = requests.post(JOURNAL_WEBHOOK_URL, json=payload, timeout=8)
        if res.status_code == 200:
            data = res.json()
            saved = data.get("saved", 0)
            skipped = data.get("skipped", 0)
            print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] ⚡ Synced {len(deals_to_send)} deal(s) -> {saved} saved, {skipped} already existed.")
        else:
            print(f"❌ Webhook returned HTTP {res.status_code}: {res.text}")
    except Exception as e:
        print(f"❌ Failed to reach Webhook URL: {e}")

def main():
    if not init_mt5():
        sys.exit(1)

    print("🟢 Live Sync Active! Watching for new MT5 trades (Press Ctrl+C to stop)...")
    try:
        while True:
            sync_deals()
            time.sleep(CHECK_INTERVAL_SECONDS)
    except KeyboardInterrupt:
        print("\n🛑 Stopping MT5 Sync Bridge.")
        mt5.shutdown()

if __name__ == "__main__":
    main()
