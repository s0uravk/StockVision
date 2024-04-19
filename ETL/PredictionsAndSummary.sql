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

-- Drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS "Predicted_Summary";

-- Create the Predicted_Summary table based on the provided query
CREATE TABLE "Predicted_Summary" AS
SELECT dwp."Ticker",
		MIN(CASE WHEN dwp."Date" = CURRENT_DATE THEN dwp."Close" END) AS "Today_price",
		MIN(CASE WHEN dwp."Date" = sub."Date" THEN dwp."Close" END) AS "Predicted_price",
		MIN(CASE WHEN dwp."Date" = sub."Date" THEN dwp."Close" END) - MIN(CASE WHEN dwp."Date" = CURRENT_DATE THEN dwp."Close" END) AS "Predcited_Change",
		(MIN(CASE WHEN dwp."Date" = sub."Date" THEN dwp."Close" END) - MIN(CASE WHEN dwp."Date" = CURRENT_DATE THEN dwp."Close" END)) / NULLIF(MIN(CASE WHEN dwp."Date" = CURRENT_DATE THEN dwp."Close" END), 0) * 100 AS "Percentage_Change",
		dwp."Sector",
		dwp."Industry"
FROM
	-- Subquery to get the latest date for each Ticker
	(SELECT "Ticker", MAX("Date") AS "Date"
	FROM data_with_prediction
	GROUP BY "Ticker") sub
-- Join the subquery with the data_with_prediction table to get the required data
JOIN data_with_prediction dwp
ON dwp."Ticker" = sub."Ticker"
GROUP BY 1, 6, 7
ORDER BY 5 DESC;

-- Select all records from the Predicted_Summary table (optional, for verification)
SELECT * FROM "Predicted_Summary";