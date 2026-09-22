-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startingBalance" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "entryTime" TEXT,
    "closingDate" DATETIME,
    "closingTime" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "setup" TEXT,
    "session" TEXT,
    "entryPrice" REAL NOT NULL,
    "stopLoss" REAL,
    "takeProfit" REAL,
    "exitPrice" REAL,
    "quantity" REAL NOT NULL,
    "pnl" REAL NOT NULL DEFAULT 0,
    "brokerageCharges" REAL NOT NULL DEFAULT 0,
    "netPnl" REAL NOT NULL DEFAULT 0,
    "riskAmount" REAL,
    "riskPercent" REAL,
    "plannedRR" REAL,
    "rMultiple" REAL,
    "result" TEXT,
    "marketBias" TEXT,
    "higherTimeframeBias" TEXT,
    "entryReason" TEXT,
    "exitReason" TEXT,
    "confirmation" TEXT,
    "invalidation" TEXT,
    "tradeManagement" TEXT,
    "mistakeNotes" TEXT,
    "emotionBefore" TEXT,
    "emotionDuring" TEXT,
    "emotionAfter" TEXT,
    "confidenceLevel" INTEGER,
    "disciplineScore" INTEGER,
    "preTradeThesis" TEXT,
    "whatHappened" TEXT,
    "whatWentRight" TEXT,
    "whatWentWrong" TEXT,
    "lessonLearned" TEXT,
    "screenshotUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mistake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "TradeMistake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeId" TEXT NOT NULL,
    "mistakeId" TEXT NOT NULL,
    CONSTRAINT "TradeMistake_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TradeMistake_mistakeId_fkey" FOREIGN KEY ("mistakeId") REFERENCES "Mistake" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Trade_accountId_date_idx" ON "Trade"("accountId", "date");

-- CreateIndex
CREATE INDEX "Trade_accountId_closingDate_idx" ON "Trade"("accountId", "closingDate");

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");

-- CreateIndex
CREATE INDEX "Trade_setup_idx" ON "Trade"("setup");

-- CreateIndex
CREATE UNIQUE INDEX "Mistake_name_key" ON "Mistake"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TradeMistake_tradeId_mistakeId_key" ON "TradeMistake"("tradeId", "mistakeId");
