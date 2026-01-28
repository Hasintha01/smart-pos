-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopName" TEXT NOT NULL DEFAULT 'Smart POS',
    "shopAddress" TEXT,
    "shopPhone" TEXT,
    "shopEmail" TEXT,
    "shopLogo" TEXT,
    "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "taxPercentage" REAL NOT NULL DEFAULT 0,
    "taxLabel" TEXT NOT NULL DEFAULT 'VAT',
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "currencySymbol" TEXT NOT NULL DEFAULT 'Rs.',
    "receiptHeader" TEXT,
    "receiptFooter" TEXT NOT NULL DEFAULT 'Thank you for your business!',
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
