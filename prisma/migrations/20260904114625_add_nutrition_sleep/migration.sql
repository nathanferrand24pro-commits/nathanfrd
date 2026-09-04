-- CreateTable
CREATE TABLE "FoodEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "meal" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantityG" REAL NOT NULL,
    "calories" REAL NOT NULL,
    "proteinG" REAL NOT NULL DEFAULT 0,
    "carbsG" REAL NOT NULL DEFAULT 0,
    "fatG" REAL NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'manuel',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NutritionGoal" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "calories" INTEGER NOT NULL DEFAULT 2500,
    "proteinG" INTEGER NOT NULL DEFAULT 140,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SleepEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "bedTime" DATETIME,
    "wakeTime" DATETIME,
    "durationMin" INTEGER NOT NULL,
    "quality" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'manuel',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SleepEntry_date_key" ON "SleepEntry"("date");
