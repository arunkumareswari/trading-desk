//+------------------------------------------------------------------+
//|                                         TradingJournalSync.mq5    |
//|                        Trading Journal Real-Time & Catch-up Sync |
//|                                  https://github.com              |
//+------------------------------------------------------------------+
#property copyright "Trading Journal AI"
#property link      "http://localhost:3000"
#property version   "1.00"
#property description "Auto-syncs MT5 trades into your Trading Journal."
#property description "Supports real-time sync & automatic catch-up of mobile/closed-laptop trades."

//--- Inputs
input group "=== Server Configuration ===";
input string   InpWebhookURL     = "http://localhost:3000/api/webhooks/mt5"; // Webhook URL
input string   InpAccountToken   = "YOUR_ACCOUNT_ID";                         // Account ID / Token

input group "=== Sync Settings ===";
input int      InpHistoryDays    = 30;                                        // Days of History to Scan on Startup
input int      InpTimerInterval  = 10;                                        // Sync Check Interval (Seconds)
input bool     InpVerboseLogs    = true;                                      // Show Debug Logs in Experts Tab

//--- Global Variables
ulong SyncedTickets[];

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("==================================================");
   Print("🚀 Trading Journal MT5 Sync EA Initialized");
   Print("📡 Webhook URL: ", InpWebhookURL);
   Print("🔑 Account Token: ", InpAccountToken);
   Print("🔄 Scanning past ", InpHistoryDays, " days of history...");
   Print("==================================================");

   // Check WebRequest permission notification
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED))
   {
      Print("⚠️ Note: Allow automated trading if required by your broker.");
   }

   // Perform initial catch-up scan for missed trades
   SyncHistoryDeals();

   // Set timer for periodic background catch-up
   EventSetTimer(InpTimerInterval);

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("🛑 Trading Journal MT5 Sync EA Stopped. Reason code: ", reason);
}

//+------------------------------------------------------------------+
//| Timer function for periodic catch-up sync                        |
//+------------------------------------------------------------------+
void OnTimer()
{
   SyncHistoryDeals();
}

//+------------------------------------------------------------------+
//| Trade transaction function for instant sub-second sync          |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
{
   // If a deal was added (trade closed or executed), trigger sync immediately
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      if(InpVerboseLogs) Print("⚡ Trade transaction detected (Deal: #", trans.deal, "). Syncing...");
      SyncHistoryDeals();
   }
}

//+------------------------------------------------------------------+
//| Check if ticket is already synced                               |
//+------------------------------------------------------------------+
bool IsTicketSynced(ulong ticket)
{
   int total = ArraySize(SyncedTickets);
   for(int i = 0; i < total; i++)
   {
      if(SyncedTickets[i] == ticket) return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Add ticket to synced list                                        |
//+------------------------------------------------------------------+
void MarkTicketSynced(ulong ticket)
{
   int total = ArraySize(SyncedTickets);
   ArrayResize(SyncedTickets, total + 1);
   SyncedTickets[total] = ticket;
}

//+------------------------------------------------------------------+
//| Scan MT5 History Deals and push to Webhook                       |
//+------------------------------------------------------------------+
void SyncHistoryDeals()
{
   datetime fromDate = TimeCurrent() - (InpHistoryDays * 86400);
   datetime toDate   = TimeCurrent() + 86400;

   if(!HistorySelect(fromDate, toDate))
   {
      Print("❌ Failed to select MT5 trade history. Error: ", GetLastError());
      return;
   }

   int totalDeals = HistoryDealsTotal();
   if(totalDeals == 0) return;

   string dealsJson = "";
   int newDealsCount = 0;

   for(int i = 0; i < totalDeals; i++)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket <= 0) continue;

      long entryType = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
      long dealType  = HistoryDealGetInteger(dealTicket, DEAL_TYPE);

      // We are interested in Closed Deals (DEAL_ENTRY_OUT or DEAL_ENTRY_INOUT)
      if(entryType != DEAL_ENTRY_OUT && entryType != DEAL_ENTRY_INOUT) continue;
      if(dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL) continue;

      // Skip already synced tickets
      if(IsTicketSynced(dealTicket)) continue;

      ulong orderTicket = HistoryDealGetInteger(dealTicket, DEAL_ORDER);
      ulong positionId  = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
      string symbol     = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
      double volume     = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
      double exitPrice  = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
      double profit     = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
      double commission = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
      double swap       = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
      datetime closeTime= (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
      string comment    = HistoryDealGetString(dealTicket, DEAL_COMMENT);
      long magic        = HistoryDealGetInteger(dealTicket, DEAL_MAGIC);

      // Find original entry deal to get exact open price and open time
      double openPrice = exitPrice;
      datetime openTime = closeTime - 60; // fallback
      string side = (dealType == DEAL_TYPE_BUY) ? "SHORT" : "LONG"; // In MT5, DEAL_ENTRY_OUT BUY closes a SHORT position

      // Find the corresponding entry deal
      for(int j = 0; j < totalDeals; j++)
      {
         ulong inTicket = HistoryDealGetTicket(j);
         if(inTicket > 0 && HistoryDealGetInteger(inTicket, DEAL_POSITION_ID) == positionId)
         {
            long inEntry = HistoryDealGetInteger(inTicket, DEAL_ENTRY);
            if(inEntry == DEAL_ENTRY_IN)
            {
               openPrice = HistoryDealGetDouble(inTicket, DEAL_PRICE);
               openTime  = (datetime)HistoryDealGetInteger(inTicket, DEAL_TIME);
               long inType = HistoryDealGetInteger(inTicket, DEAL_TYPE);
               side = (inType == DEAL_TYPE_BUY) ? "LONG" : "SHORT";
               break;
            }
         }
      }

      // Format ISO dates
      string openTimeStr  = TimeToString(openTime, TIME_DATE|TIME_SECONDS);
      string closeTimeStr = TimeToString(closeTime, TIME_DATE|TIME_SECONDS);

      // Build JSON for this trade
      string tradeItem = "{"
         + "\"ticket\":" + (string)dealTicket + ","
         + "\"symbol\":\"" + symbol + "\","
         + "\"side\":\"" + side + "\","
         + "\"lots\":" + DoubleToString(volume, 2) + ","
         + "\"openPrice\":" + DoubleToString(openPrice, 5) + ","
         + "\"closePrice\":" + DoubleToString(exitPrice, 5) + ","
         + "\"openTime\":\"" + openTimeStr + "\","
         + "\"closeTime\":\"" + closeTimeStr + "\","
         + "\"profit\":" + DoubleToString(profit, 2) + ","
         + "\"commission\":" + DoubleToString(commission, 2) + ","
         + "\"swap\":" + DoubleToString(swap, 2) + ","
         + "\"comment\":\"" + comment + "\","
         + "\"magic\":" + (string)magic
         + "}";

      if(newDealsCount > 0) dealsJson += ",";
      dealsJson += tradeItem;
      newDealsCount++;

      // Mark ticket as sent
      MarkTicketSynced(dealTicket);
   }

   if(newDealsCount == 0) return;

   // Construct full payload
   string payload = "{"
      + "\"apiToken\":\"" + InpAccountToken + "\","
      + "\"action\":\"SYNC_TRADES\","
      + "\"trades\":[" + dealsJson + "]"
      + "}";

   if(InpVerboseLogs)
   {
      Print("📤 Sending ", newDealsCount, " trade(s) to Journal Webhook...");
   }

   // Send WebRequest
   char postData[];
   char resultData[];
   string resultHeaders;
   StringToCharArray(payload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(postData, ArraySize(postData) - 1); // remove trailing null char

   string headers = "Content-Type: application/json\r\n";
   int timeout = 5000; // 5s timeout

   ResetLastError();
   int res = WebRequest("POST", InpWebhookURL, headers, timeout, postData, resultData, resultHeaders);

   if(res == 200 || res == 201)
   {
      string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
      Print("✅ Synced ", newDealsCount, " trade(s) successfully! Server response: ", response);
   }
   else
   {
      int err = GetLastError();
      Print("❌ WebRequest failed. HTTP code: ", res, " Error code: ", err);
      if(err == 4014)
      {
         Print("⚠️ MT5 WebRequest not allowed! Please open MT5 -> Tools -> Options -> Expert Advisors -> check 'Allow WebRequest for listed URL' and add: ", InpWebhookURL);
      }
   }
}
//+------------------------------------------------------------------+
