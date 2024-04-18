User
 // Stock data
const stocks = [
  { code: "AAPL", name: "Apple Inc. (AAPL)", risk: 0.2, returnRate: 0.4 },
  { code: "GOOGL", name: "Alphabet Inc. (GOOGL)", risk: 0.1, returnRate: 0.6 },
  { code: "MSFT", name: "Microsoft Corporation (MSFT)", risk: 0.7, returnRate : 0.2 },
  { code: "TSLA", name: "Tesla Inc.", risk: 0.7, returnRate: 0.2 },
  { code: "VISA", name: "Visa", risk: 0.7, returnRate: 0.2 },
  { code: "AMEX", name: "American express", risk: 0.7, returnRate : 0.2 }

];

// Append checkboxes
stocks.forEach(stock => {
  d3.select("#checkboxes")
    .append("label")
    .attr("for", stock.code)
    .html(`<input type="checkbox" id="${stock.code}" value="${stock.code}" /> ${stock.name}`)
    .on("change", updateSelectedOptions);
});

// Color palette for charts
const colorPalette = ["#007bff", "#6610f2", "#6f42c1", "#e83e8c", "#dc3545", "#fd7e14"];

function updateSelectedOptions() {
  const selectedOptionsDiv = d3.select("#selectOps");
  selectedOptionsDiv.selectAll("*").remove(); // Clear previous selections
  const selectedStocks = [];
  const selectedColors = [];
  d3.selectAll("input[type=checkbox]:checked").each(function(d, i) {
    const stock = stocks.find(item => item.code === this.id);
    selectedStocks.push({ code: stock.code, name: stock.name, risk : stock.risk, returnRate : stock.returnRate });
    selectedColors.push(colorPalette[i % colorPalette.length]); // Cycle through color palette
  });

  
  selectedOptionsDiv.selectAll("div")
    .data(selectedStocks)
    .enter()
    .append("div")
    .text(d => d.name)
    .each(function(d, i) {
      d3.select(this)
        .append("span")
        .attr("class", "remove-btn")
        .text("❌")
        .on("click", function() {
          removeStock(d.code);
        });
    });

   const calcPanel = d3.select("#calcPanel");
    calcPanel.selectAll("div").remove(); // Clear previous inputs

    selectedStocks.forEach(stock => {
      const div = calcPanel.append("div");
      div.append("span").text(`${stock.name}: `);
      div.append("input")
        .attr("type", "number")
        .attr("class", "stockMultiplier")
        .attr("data-code", stock.code)
        .attr("placeholder", "Enter number of stocks")
        .attr("value", "1")
        .on("input", function() {
          updateTotal();
        });
    });
 

  // Update doughnut chart
  updateDoughnutCharts(selectedStocks, selectedColors);
}

function removeStock(code) {
  d3.select(`#${code}`).property("checked", false);
  updateSelectedOptions();
}
function updateTotal() {
    const totalReturn = calculateTotalReturn();
    const totalRisk = calculateTotalRisk();
  
    const selectedStocks = stocks.filter(stock => d3.select(`#${stock.code}`).property("checked"));
    const selectedColors = selectedStocks.map((_, i) => colorPalette[i % colorPalette.length]);
  
    updateDoughnutCharts(selectedStocks, selectedColors);
  
    // Update the text displaying total return and risk
    d3.select("#totalReturn").text(`Total Return: ${totalReturn.toFixed(2)}`); // using toFixed for formatting
    d3.select("#totalRisk").text(`Total Risk: ${totalRisk.toFixed(2)}`);
  }
  

  function calculateTotalReturn() {
    let totalReturn = 0;
    d3.selectAll(".stockMultiplier").each(function() {
      const code = d3.select(this).attr("data-code");
      const stock = stocks.find(item => item.code === code);
      const multiplier = +this.value || 0; // Get the input value, default to 0 if empty
      totalReturn += stock.returnRate * multiplier;
    });
    return totalReturn;
  }

  function calculateTotalRisk() {
    let totalRisk = 0;
    d3.selectAll(".stockMultiplier").each(function() {
      const code = d3.select(this).attr("data-code");
      const stock = stocks.find(item => item.code === code);
      const multiplier = +this.value || 0; // Get the input value, default to 0 if empty
      totalRisk += stock.risk * multiplier;
    });
    return totalRisk;
  }
  function updateDoughnutCharts(selectedStocks, selectedColors) {
    const quantities = selectedStocks.map(stock => {
      const multiplierInput = d3.select(`input[data-code='${stock.code}']`).node();
      return +multiplierInput.value || 1;  // Use 0 if the input is empty or invalid
    });
  
    const riskData = selectedStocks.map((stock, i) => stock.risk * quantities[i]);
    const returnData = selectedStocks.map((stock, i) => stock.returnRate * quantities[i]);
    const labels = selectedStocks.map(stock => stock.name);
  
    updateDoughnutChart(riskData, labels, selectedColors, 'risk_chart');
    updateDoughnutChart(returnData, labels, selectedColors, 'return_chart');
  }
  

function summation(data, id, text) {
  const total = sum(data);
  d3.select(`#${id}`).text(`Total ${text}: ${total}`);
}
function sum(array) {
  return array.reduce((acc, val) => acc + val, 0);
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