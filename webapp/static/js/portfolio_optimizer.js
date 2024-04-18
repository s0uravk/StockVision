// Stock data
const stocks = [
    { code: "AAPL", name: "Apple Inc. (AAPL)", risk: 0.2, returnRate: -0.4 },
    { code: "GOOGL", name: "Alphabet Inc. (GOOGL)", risk: 0.1, returnRate: 0.6 },
    { code: "MSFT", name: "Microsoft Corporation (MSFT)", risk: 0.7, returnRate: -0.2 },
    { code: "TSLA", name: "Tesla Inc.", risk: 0.7, returnRate: 0.2 },
    { code: "VISA", name: "Visa", risk: 0.7, returnRate: -0.2 },
    { code: "AMEX", name: "American express", risk: 0.7, returnRate: 0.2 }
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
  
  // Initialize display on load
  document.addEventListener("DOMContentLoaded", function() {
    updateSelectedOptions();
  });
  
  function updateSelectedOptions() {
    const selectedOptionsDiv = d3.select("#selectOps");
    selectedOptionsDiv.selectAll("*").remove(); // Clear previous selections
    const selectedStocks = [];
    const selectedColors = [];
    d3.selectAll("input[type=checkbox]:checked").each(function(d, i) {
      const stock = stocks.find(item => item.code === this.id);
      selectedStocks.push({ code: stock.code, name: stock.name, risk: stock.risk, returnRate: stock.returnRate });
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
    // Populate calcPanel and append inputs
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
        })
        .on("change", function() {
          if (this.value < 1) this.value = 1; // Restrict input to be non-negative
        });
    });
  
    // Update doughnut chart
    updateDoughnutCharts(selectedStocks, selectedColors);
    
    selectedOptionsDiv = d3.select('#selectOps')
    // Append data to selectOps
    selectedOptionsDiv.selectAll("div")
      .data(selectedStocks)
      .enter()
      .append("div")
      .text(d => d.name)
      .each(function(d, i) {
        d3.select(this)
          .append("span")
          .attr("class", "remove-btn")
          .text("|✖")
          .on("click", function() {
            removeStock(d.code);
          });
      });
  }
  
  function removeStock(code) {
    d3.select(`#${code}`).property("checked", false);
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
  
  // Add event listener to trigger calculation when user selects stocks but hasn't entered number of stocks
  d3.selectAll("input[type=checkbox]").on("change", function() {
      if (d3.selectAll("input[type=number]").empty()) {
          updateTotalDefault();
      } else {
          updateTotal(); // Update totals based on input values
      }
  });
  
  // Add event listener for subsequent calculations when user interacts with number of stocks inputs
  d3.selectAll("input[type=number]").on("input", function() {
      updateTotal(); // Update totals based on input values
  });
});


function updateTotalDefault() {
  let totalReturn = 0; // Initialize total return
  let totalRisk = 0; // Initialize total risk

  // Get the selected stocks
  const selectedStocks = stocks.filter(stock => d3.select(`#${stock.code}`).property("checked"));
  const selectedColors = selectedStocks.map((_, i) => colorPalette[i % colorPalette.length]);

  // Calculate total return and total risk with default multiplier of 1 for each selected stock
  selectedStocks.forEach(stock => {
      const multiplierInput = d3.select(`input[data-code='${stock.code}']`).node();
      let multiplier = 1; // Default multiplier for each stock

      // Check if the input field for the number of stocks exists
      if (multiplierInput) {
          // Use the input value if it's valid and greater than 0
          if (+multiplierInput.value > 0) {
              multiplier = +multiplierInput.value;
          }
      }

      // Add the risk and return, considering negative values
      totalRisk += Math.max(0, stock.risk) * multiplier;
      totalReturn += stock.returnRate * multiplier;
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
    const selectedStocks = stocks.filter(stock => d3.select(`#${stock.code}`).property("checked"));
    const selectedColors = selectedStocks.map((_, i) => colorPalette[i % colorPalette.length]);

    // Calculate total return and total risk
    selectedStocks.forEach(stock => {
        let multiplier = 1; // Default to 1 if the input is empty or invalid
        const multiplierInput = d3.select(`input[data-code='${stock.code}']`).node();
        if (multiplierInput && +multiplierInput.value > 0) {
            multiplier = +multiplierInput.value; // Use the input value if it's valid and greater than 0
        }

        // Ensure multiplier is not negative
        multiplier = Math.max(0, multiplier);

        // Add the risk and return, considering negative values
        totalRisk += Math.max(0, stock.risk) * multiplier;
        totalReturn += stock.returnRate * multiplier;
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



  
function calculateTotalReturn(defaultValue = 1) {
    let totalReturn = 0;
    d3.selectAll(".stockMultiplier").each(function() {
        const code = d3.select(this).attr("data-code");
        const stock = stocks.find(item => item.code === code);
        let multiplier = +this.value || defaultValue; // Use default value if input is empty
        // Prevent decreasing multiplier below 1
        multiplier = Math.max(multiplier, 1);
        totalReturn += stock.returnRate * multiplier;
    });
    return totalReturn;
}
  
function calculateTotalRisk(defaultValue = 1) {
    let totalRisk = 0;
    d3.selectAll(".stockMultiplier").each(function() {
        const code = d3.select(this).attr("data-code");
        const stock = stocks.find(item => item.code === code);
        let multiplier = +this.value || defaultValue; // Use default value if input is empty
        // Prevent decreasing multiplier below 1
        multiplier = Math.max(multiplier, 1);
        totalRisk += stock.risk * multiplier;
    });
    return totalRisk;
} 

  
function updateDoughnutCharts(selectedStocks, selectedColors) {
    const quantities = selectedStocks.map(stock => {
        const multiplierInput = d3.select(`input[data-code='${stock.code}']`).node();
        return multiplierInput ? +multiplierInput.value || 1 : 1;  // Use 1 if the input does not exist or is invalid
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
  