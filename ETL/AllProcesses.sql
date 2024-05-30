DROP TABLE IF EXISTS "Final_Data";

CREATE TABLE "Final_Data" (
    "Date" Date   NOT NULL,
    "Open" FLOAT   NOT NULL,
    "High" FLOAT   NOT NULL,
    "Low" FLOAT   NOT NULL,
    "Close" FLOAT   NOT NULL,
    "Volume" FLOAT   NOT NULL,
    "Ticker" VARCHAR(10)   NOT NULL,
	"Industry" VARCHAR(255)   NOT NULL,
	"Sector" VARCHAR(255)   NOT NULL
);

ALTER TABLE "Final_Data"
ADD COLUMN "id" SERIAL PRIMARY KEY;

SELECT * FROM "Final_Data";

--Industry_Volume
DROP TABLE IF EXISTS "Industry_Volume";
CREATE TABLE "Industry_Volume"(
    id serial PRIMARY KEY,
	industry Varchar(255),
	sector Varchar(255),
    total_volume FLOAT
);
INSERT INTO "Industry_Volume" (industry,sector, total_volume)
SELECT "Industry","Sector", SUM("Volume") AS total_volume
FROM
    "Final_Data"
GROUP BY  "Sector","Industry"
ORDER BY total_volume desc;

SELECT * FROM "Industry_Volume";

--Moving_average
SELECT "Date",
	CASE 
		WHEN ROW_NUMBER() OVER (ORDER BY "Date") <= 29 THEN NULL
		ELSE AVG ("Close") OVER(ORDER BY "Date" ROWS BETWEEN 29 PRECEDING AND CURRENT ROW)
	END AS moving_average
FROM "Final_Data"
LIMIT 1000;

--PredictionsAndSummary
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


--Summary table
-- Create Summary table
DROP TABLE IF EXISTS "Summary";
CREATE TABLE "Summary" AS
SELECT subquery."Ticker",
	   MAX(CASE WHEN "Date" = subquery."Start_Date" THEN "Open" END) AS "Initial_Open",
	   MAX(CASE WHEN "Date" = subquery."End_Date" THEN "Close" END) AS "Final_Close",
	   (MAX(CASE WHEN "Date" = subquery."End_Date" THEN "Close" END) - MAX(CASE WHEN "Date" = subquery."Start_Date" THEN "Open" END)) AS "Total_Change",
	   (MAX(CASE WHEN "Date" = subquery."End_Date" THEN "Close" END) - MAX(CASE WHEN "Date" = subquery."Start_Date" THEN "Open" END))/ NULLIF(MAX(CASE WHEN "Date" = subquery."Start_Date" THEN "Open" END), 0) * 100 AS "Percentage_Change",
	   AVG("Volume") AS "Average_Volume",
	   "Final_Data"."Sector",
	   "Final_Data"."Industry"
FROM
	(SELECT "Ticker", 
			MIN("Date") AS "Start_Date", 
			MAX("Date") AS "End_Date" 
	 FROM "Final_Data" 
	 GROUP BY "Ticker") AS subquery
	JOIN "Final_Data" ON "Final_Data"."Ticker" = subquery."Ticker"
GROUP BY subquery."Ticker","Final_Data"."Sector", "Final_Data"."Industry"
ORDER BY subquery."Ticker";
	
-- Add the id column as SERIAL
ALTER TABLE "Summary"
ADD COLUMN id SERIAL;

-- Set id column as the primary key
ALTER TABLE "Summary"
ADD CONSTRAINT pk_Summary PRIMARY KEY (id);

SELECT * FROM "Summary";

--Total_volume
DROP TABLE IF EXISTS "Total_Volume";

CREATE TABLE "Total_Volume"(
    id serial PRIMARY KEY,
	year INT,
    ticker VARCHAR(6),
    total_volume FLOAT
);

INSERT INTO "Total_Volume" (year, ticker, total_volume)
SELECT DATE_PART('year', "Date") as Year, "Ticker", SUM("Volume") AS total_volume
FROM 
	"Final_Data"
GROUP BY DATE_PART('year', "Date"), "Ticker"
ORDER BY total_volume desc;

SELECT * FROM "Total_Volume";
