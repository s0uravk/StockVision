//init function
function init(){
  let url = '/api/v1.0/predicted_stock_data'
  d3.json(url).then(function (response){

    let firstElement = d3.select('select').select('option').attr('value');
    infoPanel(firstElement)
    createChart(response, firstElement);
    news(firstElement);
    renderTopGainers();
  });
  let url1 = '/api/v1.0/predicted_stock_data/summary';
  d3.json(url1).then(reponse => {
    let firstSector = d3.select('#selDataset1').select('option').attr('value');
    top_pred_stocks(reponse, firstSector);
  });
}

//on change function
function optionChanged(){
  let url = '/api/v1.0/predicted_stock_data'
  d3.json(url).then(function (response){

    let selDataset = d3.select('#selDataset').property('value');

    infoPanel(selDataset);
    createChart(response, selDataset);
    news(selDataset)
  });

  let url1 = '/api/v1.0/predicted_stock_data/summary';
  d3.json(url1).then(response => {
    console.log(response)
    let selSector = d3.select('#selDataset1').property('value');
    top_pred_stocks(response, selSector);
  });
}

//appending ticker to select tag
d3.json('/api/v1.0/stock_data/summary').then(response =>{

  tickers = response.map(row => row.Ticker);
  const sectors = response.map(row => row.Sector);
  const uniqueSectors = [...new Set(sectors)];

  console.log(tickers)
 tickers.forEach(ticker => {
    d3.select('#selDataset').append('option').text(ticker).attr('value', ticker);
  });
  uniqueSectors.forEach(sector => {
    d3.select('#selDataset1').append('option').text(sector).attr('value', sector);
  });

});

//Line chart
function createChart(data, dataset){
  let dataPoints = []
  let selData = data.filter(row => row.Ticker == dataset);

  selData.forEach(element => {
      let close = Number(element.Close_Price);
      //dataPoints.push({x: new Date(data[i].date), y: Number(data[i].price)});
      dataPoints.push({x: new Date(element.Date), y: close});
      //dps2.push({x: new Date(element.Date), y: close});
      
  });

  // Get today's date
 var today = new Date();

  // Create arrays to hold data points for each color range
  var dataPointsBeforeThreshold = [];
  var dataPointsAfterThreshold = [];
  
// Iterate through data points and separate them based on the threshold date
dataPoints.forEach(function(point) {
  if (point.x < today) {
      dataPointsBeforeThreshold.push({x: point.x, y: point.y}); // Add to array for points before threshold
  } else if (point.x >= today) {
      dataPointsBeforeThreshold.push({x: point.x, y: point.y});
      dataPointsAfterThreshold.push({x: point.x, y: point.y}); // Add to array for points after threshold
  }
});
  
  // Define the CanvasJS StockChart
  var stockChart = new CanvasJS.StockChart("line_chart", {
    title: {
      text: `${dataset} Price (in USD)`
    },
    charts: [{
        axisX: {
            crosshair: {
                enabled: true
            }
        },
        axisY: {
            prefix: "$",
            title: "Stock price",
            titleFontSize: 14
        },
        data: [{
            type: "area",
            xValueFormatString: "DD-MMM-YYYY",
            yValueFormatString: "$#,###.##",
            dataPoints: dataPointsBeforeThreshold
        }]
    }],

    navigator: {
      slider: {
        minimum: dataPoints[0].x, // Assuming the first date in the dataset is the minimum
        maximum: dataPoints[dataPoints.length - 1].x // Assuming the last date in the dataset is the maximum

      }
    }
  });

  
// Push the data for the second series (after threshold) to the chart's data array
stockChart.options.charts[0].data.push({
  type: "area",
  xValueFormatString: "DD-MMM-YYYY",
  yValueFormatString: "$#,###.##M",
  dataPoints: dataPointsAfterThreshold,
  color: "cyan" // Color for area after threshold
});

  
  // Render the chart
  stockChart.render();
  
  
};
//Info Panel
function infoPanel(dataset){
  
  summaryUrl = '/api/v1.0/stock_data/summary';

  d3.json(summaryUrl).then(response =>{

    // Extracting keys and values for the selected dataset
    let demoArrKey = Object.keys(response.filter(data => data.Ticker == dataset)[0]);
    let demoArrVal = Object.values(response.filter(data => data.Ticker == dataset)[0]);  
    
    // Removing ticker from demoArrKey
    let index = demoArrKey.indexOf('Ticker');
    if (index > -1) {
      demoArrKey.splice(index, 1);
    }

    d3.select('#info').html(`<h5>Historic Performance(${dataset})</h5><hr>`);

  for (let i = 0; i < demoArrKey.length; i++) {
    d3.select('#info').append('div').text(`${demoArrKey[i]} : ${demoArrVal[i]}`)
  }

  })      
};
function news(dataset){

  // Get today's date
  var today = new Date();
  // Get the date 3 days ago
  var from_date = new Date(today);
  from_date.setDate(from_date.getDate() - 3);

  // Format the dates in YYYY-MM-DD format
  var formatted_today = today.toISOString().split('T')[0];
  var formatted_from_date = from_date.toISOString().split('T')[0];

  apiKey = 'cockid1r01qknpft0bpgcockid1r01qknpft0bq0'
  // Define the API endpoint URL
  var apiUrl = `https://finnhub.io/api/v1/company-news?symbol=${dataset}&from=${formatted_from_date}&to=${formatted_today}&token=${apiKey}`;

  // Make an HTTP GET request to fetch the data
  d3.json(apiUrl).then(function(response) {

      // Clear news panel first
      d3.select('#news').html('');

      // Create a div element to display the extracted data
      var div = d3.select('#news').append('div');

      // Append related, summary, and headline to the div
      div.append('h3').style('text-align', 'center').text('Daily News Update')
      div.append('hr')
      div.append('p').text('Ticker: ' + response[0].related + ' (' + new Date(response[0].datetime * 1000).toDateString() + ')');
      div.append('p').text('Headline: ' + response[0].headline);
      div.append('p').text('Summary: ' + response[0].summary);

    })
    .catch(function(error) {
      // Handle errors here
      console.error('Error fetching data:', error);
    });
}



// Function to render top gainers panel
function renderTopGainers() {
  d3.select("#topGainersList").html("");

  api_key = '0FE1BNEKXM2YALTG'
  // Define the API endpoint URL
  var apiUrl = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${api_key}`;

  d3.json(apiUrl).then(response=>{

    top_gainers = response.top_gainers
    top_losers = response.top_losers
    most_traded = response.most_actively_traded

     // Loop through top gainers data and create list items
    top_gainers.forEach(function(d) {
      var gainerBlock = d3.select("#topGainersList").append("div").classed("gainerBlock", true);
      gainerBlock.append("div").text(d.ticker + " (" + Number(d.change_percentage.replace("%", "")).toFixed(2) + "%)" + " ▲");
  });
    top_losers.forEach(function(d) {
      var loserBlock = d3.select("#topLosersList").append("div").classed("loserBlock", true);
      loserBlock.append("div").text(d.ticker + " (" + Number(d.change_percentage.replace("%", "")).toFixed(2) + "%)" + " ▼");
  });
    most_traded.forEach(function(d) {
      var tradedBlock = d3.select("#topTradedList").append("div").classed("tradedBlock", true);
      tradedBlock.append("div").text(d.ticker + " (" + Number(d.volume) + ")");
  });
  })


}

// Function Definition for bar chart
function top_pred_stocks(resp, choice){
  let selData = resp.filter(row => row.Sector == choice);
  labels = []
  percentChange = []
  selData.forEach(element =>{
    change = parseFloat(element.Return_rate.replace('%', ''));
    percentChange.push(change);
    labels.push(element.Ticker);
    
  })
    // Define an array to hold colors based on values
  const colors = percentChange.map(change => {
    if (change >= 0) {
      return 'rgba(30, 144, 255, 2.5)'; // Blue for positive values
    } else {
      return 'rgba(255, 0, 0, 2.5)'; // Red for negative values
    }
  });

  const data = {
    labels: labels,
    datasets: [{
      axis: 'y',
      label: 'Top predicted stocks',
      data: percentChange,
      fill: false,
      backgroundColor: colors,
      borderWidth: 1 }]

  };
  const config = {
    type: 'bar',
    data,
    options: {
      indexAxis: 'y',
      scales: {
        x: {
          title: {
            display: true,
            text: 'Percent Change',
            font: {
              size: 30 
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Ticker',
            font: {
              size: 30
            }
          }
        }
      },
    }
  };
  // Get the canvas context
  const canvas = d3.select('#top_preds').node();
  const ctx = canvas.getContext('2d');

  // Destroy existing chart if it exists
  if (window.myChart instanceof Chart) {
    window.myChart.destroy();
  }

  // Create a new chart
  window.myChart = new Chart(ctx, config);

}

// Initialize the visualization
init();

// Event listener for dropdown change
d3.selectAll("#selDataset").on("change", optionChanged);