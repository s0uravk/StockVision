-- Drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS data_with_prediction;

-- Create the data_with_prediction table
CREATE TABLE "data_with_prediction" (
    "id" SERIAL PRIMARY KEY,
    "Date" DATE NOT NULL,
    "Close" FLOAT NOT NULL,
    "Ticker" VARCHAR(10) NOT NULL,
    "Sector" VARCHAR(255) NOT NULL,
    "Industry" VARCHAR(255) NOT NULL
);

-- Select all records from the data_with_prediction table (optional, for verification)
SELECT * FROM data_with_prediction;

-- Drop the existing table if it exists
DROP TABLE IF EXISTS "Predicted_Summary";

-- Create the new table with the result from the complex query using a CTE for handling the window function
CREATE TABLE "Predicted_Summary" AS
WITH DailyReturns AS (
    SELECT
        dwp."Ticker",
        dwp."Date",
        dwp."Sector",
        dwp."Industry",
        dwp."Close",
        (dwp."Close" / NULLIF(LAG(dwp."Close", 1) OVER (PARTITION BY dwp."Ticker" ORDER BY dwp."Date"), 0) - 1) AS Daily_Return
    FROM data_with_prediction dwp
),
AggregatedData AS (
    SELECT
        dr."Ticker",
        MIN(CASE WHEN dr."Date" = CURRENT_DATE THEN dr."Close" END) AS "Today_price",
        MIN(CASE WHEN dr."Date" = sub."Date" THEN dr."Close" END) AS "Predicted_price",
        MIN(CASE WHEN dr."Date" = sub."Date" THEN dr."Close" END) - MIN(CASE WHEN dr."Date" = CURRENT_DATE THEN dr."Close" END) AS "Predicted_Change",
        (MIN(CASE WHEN dr."Date" = sub."Date" THEN dr."Close" END) - MIN(CASE WHEN dr."Date" = CURRENT_DATE THEN dr."Close" END)) / NULLIF(MIN(CASE WHEN dr."Date" = CURRENT_DATE THEN dr."Close" END), 0) * 100 AS "Return_rate",
        dr."Sector",
        dr."Industry"
    FROM DailyReturns dr
    JOIN (
        SELECT "Ticker", MAX("Date") AS "Date"
        FROM data_with_prediction
        GROUP BY "Ticker"
    ) sub ON dr."Ticker" = sub."Ticker"
    GROUP BY dr."Ticker", dr."Sector", dr."Industry"
),
RiskRate AS (
    SELECT
        "Ticker",
        SQRT(SUM(POWER(Daily_Return, 2))) AS "Risk_rate"
    FROM DailyReturns
    GROUP BY "Ticker"
)
SELECT
    ad."Ticker",
    ad."Today_price",
    ad."Predicted_price",
    ad."Predicted_Change",
    ad."Return_rate",
    rr."Risk_rate",
    ad."Sector",
    ad."Industry"
FROM AggregatedData ad
JOIN RiskRate rr ON ad."Ticker" = rr."Ticker"
ORDER BY ad."Return_rate" DESC;

-- Add Serial Primary Key
ALTER TABLE "Predicted_Summary" ADD COLUMN "ID" SERIAL PRIMARY KEY;


-- Select all records from the Predicted_Summary table
SELECT * FROM "Predicted_Summary";