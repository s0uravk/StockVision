// Stock data
d3.json('/api/v1.0/predicted_stock_data/summary').then(response => {
// Populate the stocks array with items from the response
stocks = []

response.forEach(item => {
  stocks.push(item);
});
console.log(stocks)
// Append checkboxes
stocks.forEach(stock => {
  d3.select("#checkboxes")
    .append("label")
    .attr("for", stock.Ticker)
    .html(`<input type="checkbox" id="${stock.Ticker}" value="${stock.Ticker}" /> ${stock.Ticker}`)
    .on("change", updateSelectedOptions);
});


// Function to generate distinct colors
function generateDistinctColors(count) {
  var colors = [];
  var goldenRatioConjugate = 0.618033988749895;
  var hue = Math.random(); // Start at a random hue
  for (var i = 0; i < count; i++) {
    hue += goldenRatioConjugate;
    hue %= 1;
    var color = hslToRgb(hue, 0.5, 0.6); // Fix saturation and lightness for distinctness
    colors.push(color);
  }
  return colors;
}

// Function to convert HSL to RGB
function hslToRgb(h, s, l){
  var r, g, b;

  if(s == 0){
    r = g = b = l; 
  }else{
    function hue2rgb(p, q, t){
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return '#' + Math.round(r * 255).toString(16) + Math.round(g *
255).toString(16) + Math.round(b * 255).toString(16);
}

// Call the function
var colorPalette = generateDistinctColors(stocks.length);

    
// Initialize display on load
updateSelectedOptions();

// Call the function to setupEventListeners
setupEventListeners();

function updateSelectedOptions() {
  const selectedOptionsDiv = d3.select("#selectOps");
  selectedOptionsDiv.selectAll("*").remove(); // Clear previous selections
  const selectedStocks = [];
  const selectedColors = [];
  d3.selectAll("input[type=checkbox]:checked").each(function(d, i) {
    const stock = stocks.find(item => item.Ticker === this.id);
    selectedStocks.push({ Ticker: stock.Ticker, Return_rate: stock.Return_rate, Risk_rate: stock.Risk_rate });
    selectedColors.push(colorPalette[i % colorPalette.length]); // Cycle through color palette
  });

  // Handle the display even if no stocks are selected or inputs are yet to be changed
  if (selectedStocks.length === 0) {
    displayDefaults();
  } else {
    displaySelectedStocks(selectedStocks, selectedColors);
  }
}

function displayDefaults() {
  d3.select("#totalReturn").text(`Total Return: 0.00`);
  d3.select("#totalRisk").text(`Total Risk: 0.00`);
  updateDoughnutCharts([], []); // Clear any existing charts
}

function displaySelectedStocks(selectedStocks, selectedColors) {
// Clear previous selections in calcPanel
const calcPanel = d3.select("#calcPanel");
calcPanel.selectAll("*").remove();

// Append data to calcPanel
selectedStocks.forEach(stock => {
    const div = calcPanel.append("div").attr("data-ticker", stock.Ticker);
    div.text(`${stock.Ticker}: `);
    div.append("input")
        .attr("type", "number")
        .attr("class", "stockMultiplier input-box")
        .attr("data-code", stock.Ticker)
        .attr("placeholder", "No. of stocks")
        .attr("value", "1")
        .on("input", function() {
            updateTotal();
        })
        .on("change", function() {
            if (this.value < 1) this.value = 1; // Restrict input to be non-negative
        });
    div.append("span")
        .attr("class", "remove-btn")
        .text("✖")
        .on("click", function() {
            removeStock(stock.Ticker);
        });
});

// Update doughnut chart
updateDoughnutCharts(selectedStocks, selectedColors);
}

function removeStock(Ticker) {
  console.log(`Removing stock with ticker: ${Ticker}`);
    d3.select(`#${Ticker}`).property("checked", false);
    // Remove the item from selectOps
    d3.select(`#selectOps > div[data-ticker='${Ticker}']`).remove();
    // Remove the corresponding item from calcPanel
    d3.select(`#calcPanel > div[data-ticker='${Ticker}']`).remove();
    // Update the selected options after removing the stock
    updateSelectedOptions();
    // Recalculate total return and total risk after updating selected options
    updateTotal();
}



// Get references to the stock checkboxes and input fields
const stockCheckboxes = document.querySelectorAll('input[type="checkbox"]');
const stockInputFields = document.querySelectorAll('input[type="number"]');

// Initialize display on load
document.addEventListener("DOMContentLoaded", function() {
  updateSelectedOptions();
  
  // Event listener to trigger calculation when user selects stocks but hasn't entered number of stocks
  d3.selectAll("input[type=checkbox]").on("change", function() {
      if (d3.selectAll("input[type=number]").empty()) {
          updateTotalDefault();
      } else {
          updateTotal(); // Update totals based on input values
      }
  });
  
  // Event listener for subsequent calculations when user interacts with number of stocks inputs
  d3.selectAll("input[type=number]").on("input", function() {
      updateTotal(); // Update totals based on input values
  });
});

function updateTotalDefault() {
  let totalReturn = 0; // Initialize total return
  let totalRisk = 0; // Initialize total risk

  // Get the selected stocks
  const selectedStocks = stocks.filter(stock => d3.select(`#${stock.Ticker}`).property("checked"));
  const selectedColors = selectedStocks.map((_, i) => colorPalette[i % colorPalette.length]);

  // Calculate total return and total risk with default multiplier of 1 for each selected stock
  selectedStocks.forEach(stock => {
      const multiplierInput = d3.select(`input[data-code='${stock.Ticker}']`).node();
      let multiplier = 1; // Default multiplier for each stock

      // Check if the input field for the number of stocks exists
      if (multiplierInput) {
          // Use the input value if it's valid and greater than 0
          if (+multiplierInput.value > 0) {
              multiplier = +multiplierInput.value;
          }
      }

      // Add the risk and return, considering negative values
      totalRisk += Math.max(0, parseFloat(stock.Risk_rate)) * multiplier;
      totalReturn += parseFloat(stock.Return_rate) * multiplier;
  });

  // Check for negative total return and adjust total risk accordingly
  if (totalReturn < 0) {
      totalRisk = Math.abs(totalRisk); // Take the absolute value of total risk
  }

  // If totalReturn or totalRisk is NaN (due to no selected stocks), set them to 0
  totalReturn = isNaN(totalReturn) ? 0 : totalReturn;
  totalRisk = isNaN(totalRisk) ? 0 : totalRisk;

  // Update the doughnut charts
  updateDoughnutCharts(selectedStocks, selectedColors);

  // Update the text displaying total return and risk
  d3.select("#totalReturn").text(`Total Return: ${totalReturn.toFixed(2)}%`); // using toFixed for formatting
  d3.select("#totalRisk").text(`Total Risk: ${totalRisk.toFixed(2)}%`);
}

function updateTotal() {
  let totalReturn = 0; // Initialize total return
  let totalRisk = 0; // Initialize total risk

  // Get the selected stocks
  const selectedStocks = stocks.filter(stock => d3.select(`#${stock.Ticker}`).property("checked"));
  const selectedColors = selectedStocks.map((_, i) => colorPalette[i % colorPalette.length]);

  // Calculate total return and total risk
  selectedStocks.forEach(stock => {
      let multiplier = 1; // Default to 1 if the input is empty or invalid
      const multiplierInput = d3.select(`input[data-code='${stock.Ticker}']`).node();
      if (multiplierInput && +multiplierInput.value > 0) {
          multiplier = +multiplierInput.value; // Use the input value if it's valid and greater than 0
      }

      // Ensure multiplier is not negative
      multiplier = Math.max(0, multiplier);

      // Add the risk and return, considering negative values
      totalRisk += Math.max(0, parseFloat(stock.Risk_rate)) * multiplier;
      totalReturn += parseFloat(stock.Return_rate) * multiplier;
  });

  // Check for negative total return and adjust total risk accordingly
  if (totalReturn < 0) {
      totalRisk = Math.abs(totalRisk); // Take the absolute value of total risk
  }

  // If totalReturn or totalRisk is NaN (due to no selected stocks), set them to 0
  totalReturn = isNaN(totalReturn) ? 0 : totalReturn;
  totalRisk = isNaN(totalRisk) ? 0 : totalRisk;

  // Update the doughnut charts
  updateDoughnutCharts(selectedStocks, selectedColors);

  // Update the text displaying total return and risk
  d3.select("#totalReturn").text(`Total Return: ${totalReturn.toFixed(2)}%`); // using toFixed for formatting
  d3.select("#totalRisk").text(`Total Risk: ${totalRisk.toFixed(2)}%`);

  // Show total risk and return even if no number of stocks input is present
  if (selectedStocks.length === 0) {
      d3.select("#totalReturn").text(`Total Return: 0.00%`);
      d3.select("#totalRisk").text(`Total Risk: 0.00%`);
  }
}

function updateDoughnutCharts(selectedStocks, selectedColors) {
  const quantities = selectedStocks.map(stock => {
      const multiplierInput = d3.select(`input[data-code='${stock.Ticker}']`).node();
      return multiplierInput ? +multiplierInput.value || 1 : 1;  // Use 1 if the input does not exist or is invalid
  });

  const riskData = selectedStocks.map((stock, i) => parseFloat(stock.Risk_rate) * quantities[i]);
  const returnData = selectedStocks.map((stock, i) => parseFloat(stock.Return_rate) * quantities[i]);
  const labels = selectedStocks.map(stock => stock.Ticker);

  updateDoughnutChart(riskData, labels, selectedColors, 'risk_chart');
  updateDoughnutChart(returnData, labels, selectedColors, 'return_chart');
}

function updateDoughnutChart(data, labels, colors, chartId) {
  const config = {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        hoverOffset: 4
      }]
    },
  };

  const chartCanvas = d3.select(`#${chartId}`).node();
  const ctx = chartCanvas.getContext('2d');

  // Destroy existing chart if it exists
  if (window[chartId] instanceof Chart) {
    window[chartId].destroy();
  }

  // Create a new chart
  window[chartId] = new Chart(ctx, config);
}

// Function to set up event listeners
function setupEventListeners() {
  // Add event listener for checkboxes
  d3.selectAll("input[type=checkbox]").on("change", function () {
    updateTotal(); // Update totals based on input values
  });

  // Add event listener for number inputs
  d3.selectAll("input[type=number]").on("input", function () {
    updateTotal(); // Update totals based on input values
  });
}

// Call the function to set up event listeners
    setupEventListeners();
  })
  .catch(error => {
    console.error('Error fetching data from the API:', error);


});

var expanded = false;

function showCheckboxes() {
  var checkboxes = document.getElementById("checkboxes");
  if (!expanded) {
    checkboxes.style.display = "block";
    expanded = true;
  } else {
    checkboxes.style.display = "none";
    expanded = false;
  }
}