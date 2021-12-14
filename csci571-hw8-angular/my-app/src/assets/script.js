
//temp range chart function
function populateTempRangeChart(jsonobj)
{
    var jsontext_chartdata = "[\n";
    var dayinfo_chartdata = jsonobj['data']['timelines'][1]['intervals'];
    console.log(dayinfo_chartdata);
    var abbrmonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for(var i = 0; i<dayinfo_chartdata.length; i++)
    {
        var currentdayinfo_chartdata = dayinfo_chartdata[i]['values'];

        var datestring_chartdata = new Date(dayinfo_chartdata[i]['startTime']);
        var date_milliseconds = datestring_chartdata.getTime();
        var daylow_chartdata = currentdayinfo_chartdata['temperatureMin'];
        var dayhigh_chartdata = currentdayinfo_chartdata['temperatureMax'];

        var entry_chartdata = "\t[" + date_milliseconds + ", " + daylow_chartdata + ", " + dayhigh_chartdata + "]";
        if(i != dayinfo_chartdata.length - 1)
        {
            entry_chartdata += ",";
        }
        entry_chartdata += "\n";
        jsontext_chartdata += entry_chartdata;
    }
    jsontext_chartdata += "]";
    var chart_json = JSON.parse(jsontext_chartdata);

    console.log(chart_json);

    const options_temp_range_chart = {
        chart: 
        {
            type: 'arearange',
            zoomType: 'x',
            scrollablePlotArea: {
              minWidth: 600,
              scrollPositionX: 1
            },
            height: 400
        },
        title: {
            text: 'Temperature Ranges (Min, Max)'
        },
        xAxis: 
        {
            type: 'datetime',
            tickInterval: 1000*3600*24, 
            dateTimeLabelFormats: 
            {
              day: "%e %b",
              month: "%b %y"
            },
        },
        yAxis: {
            title: {
              text: null
            }
        },
        legend: {
            enabled: false
        },
        tooltip: {
            crosshairs: true,
            shared: true,
            valueSuffix: '°F',
            xDateFormat: '%A, %b %e'
        },
        plotOptions: {
            series: {
              fillColor: {
                linearGradient: [0, 0, 0, 300],
                stops: [
                  [0, 'rgba(255,205,70,1)'],
                  [0.3, 'rgba(245,177,64,0.7)'],
                  [1, 'rgba(64,182,245,0.1)']
                ]
              },
              lineColor: "#ffcd46"
            },
        },
        series: [{
            name: 'Temperatures',
            data: chart_json,
        }]
    };

    const temp_range_chart = Highcharts.chart("temperaturerangechartdiv", options_temp_range_chart);
}



// hourly weather chart
function populateHourlyWeatherChart(jsonobj)
{
    var datamap = new Map();
                
    var date_arr = [];
    var temperature_arr = [];
    var humidity_arr = [];
    var air_pressure_arr = [];
    var wind_speed_arr = [];
    var wind_direction_arr = [];

    var hourinfo_chartdata = jsonobj['data']['timelines'][0]['intervals'];
    //120 hour entries = 5 days * 24 hrs
    for(var i = 0; i<Math.min(120, hourinfo_chartdata.length); i++)
    {
        var datetemp = new Date(hourinfo_chartdata[i]["startTime"]);
        date_arr.push(datetemp.getTime());
        temperature_arr.push(Math.round(hourinfo_chartdata[i]["values"]["temperatureMax"]));
        humidity_arr.push(Math.round(hourinfo_chartdata[i]["values"]["humidity"]));
        air_pressure_arr.push(Math.round(hourinfo_chartdata[i]["values"]["pressureSeaLevel"]));
        wind_speed_arr.push(hourinfo_chartdata[i]["values"]["windSpeed"]);
        wind_direction_arr.push(hourinfo_chartdata[i]["values"]["windDirection"]);
    }

    datamap.set("date", date_arr);
    datamap.set("temperature", temperature_arr);
    datamap.set("humidity", humidity_arr);
    datamap.set("airpressure", air_pressure_arr);
    datamap.set("windspeed", wind_speed_arr);
    datamap.set("winddirection", wind_direction_arr);

    console.log(datamap);

    const meteorgram = new Meteogram(datamap, "hourlyweatherchartdiv");
}

function Meteogram(dataset, container) {
    // Parallel arrays for the chart data, these are populated as the XML/JSON file
    // is loaded
    this.humidities = [];
    this.winds = [];
    this.temperatures = [];
    this.pressures = [];

    // Initialize
    this.dataset = dataset;
    this.container = container;

    // Run
    this.parseData();
}

/**
 * Function to smooth the temperature line. The original data provides only whole degrees,
 * which makes the line graph look jagged. So we apply a running mean on it, but preserve
 * the unaltered value in the tooltip.
 */
Meteogram.prototype.smoothLine = function (data) {
    var i = data.length,
        sum,
        value;

    while (i--) {
        data[i].value = value = data[i].y; // preserve value for tooltip

        // Set the smoothed value to the average of the closest points, but don't allow
        // it to differ more than 0.5 degrees from the given value
        sum = (data[i - 1] || data[i]).y + value + (data[i + 1] || data[i]).y;
        data[i].y = Math.max(value - 0.5, Math.min(sum / 3, value + 0.5));
    }
};


/**
 * Draw blocks around wind arrows, below the plot area
 */
Meteogram.prototype.drawBlocksForWindArrows = function (chart) {
    var xAxis = chart.xAxis[0],
        x,
        pos,
        max,
        isLong,
        isLast,
        i;

    for (pos = xAxis.min, max = xAxis.max, i = 0; pos <= max + 36e5; pos += 36e5, i += 1) {

        // Get the X position
        isLast = pos === max + 36e5;
        x = Math.round(xAxis.toPixels(pos)) + (isLast ? 0.5 : -0.5);

        // Draw the vertical dividers and ticks
        if (this.resolution > 36e5) {
            isLong = pos % this.resolution === 0;
        } else {
            isLong = i % 2 === 0;
        }
        chart.renderer.path(['M', x, chart.plotTop + chart.plotHeight + (isLong ? 0 : 28),
            'L', x, chart.plotTop + chart.plotHeight + 32, 'Z'])
            .attr({
                stroke: chart.options.chart.plotBorderColor,
                'stroke-width': 1
            })
            .add();
    }

    // Center items in block
    chart.get('windbarbs').markerGroup.attr({
        translateX: chart.get('windbarbs').markerGroup.translateX + 8
    });

};

/**
 * Get the title based on the XML data
 */
Meteogram.prototype.getTitle = function () {
    return "Hourly Weather (For Next 5 Days)";
};

/**
 * Build and return the Highcharts options structure
 */

Meteogram.prototype.getChartOptions = function () {
    var meteogram = this;
    return {
        chart: {
            renderTo: this.container,
            marginBottom: 70,
            marginRight: 40,
            marginTop: 50,
            plotBorderWidth: 1,
            height: 400,
            alignTicks: false,
            scrollablePlotArea: {
                minWidth: 720
            }
        },

        title: {
            text: this.getTitle(),
            align: 'center',
            style: {
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
            }
        },

        tooltip: {
            shared: true,
            useHTML: true,
            headerFormat:
                '<small>{point.x:%A, %b %e, %H:%M}</small><br>' +
                '<b>{point.point.symbolName}</b><br>'

        },

        xAxis: [{ // Bottom X axis
            type: 'datetime',
            tickInterval: 4 * 36e5, // four hours
            minorTickInterval: 36e5, // one hour
            tickLength: 0,
            gridLineWidth: 1,
            gridLineColor: 'rgba(128, 128, 128, 0.1)',
            startOnTick: false,
            endOnTick: false,
            minPadding: 0,
            maxPadding: 0,
            offset: 30,
            showLastLabel: true,
            labels: {
                format: '{value:%H}'
            },
            crosshair: true
        }, { // Top X axis
            linkedTo: 0,
            type: 'datetime',
            tickInterval: 24 * 3600 * 1000,
            labels: {
                format: '{value:<span style="font-size: 12px; font-weight: bold">%a</span> %b %e}',
                align: 'left',
                x: 3,
                y: -5
            },
            opposite: true,
            tickLength: 20,
            gridLineWidth: 1
        }],

        yAxis: [{ // temperature axis
            title: {
                text: null
            },
            labels: {
                format: '{value}°',
                style: {
                    fontSize: '10px'
                },
                x: -3
            },
            plotLines: [{ // zero plane
                value: 0,
                color: '#BBBBBB',
                width: 1,
                zIndex: 2
            }],
            maxPadding: 0.3,
            minRange: 8,
            tickInterval: 1,
            gridLineColor: 'rgba(128, 128, 128, 0.1)'

        }, { // humidity axis
            title: {
                text: null
            },
            labels: {
                enabled: false
            },
            gridLineWidth: 0,
            tickLength: 0,
            minRange: 10,
            min: 0

        }, { // Air pressure
            allowDecimals: false,
            title: { // Title on top of axis
                text: 'inHg',
                offset: 0,
                align: 'high',
                rotation: 0,
                style: {
                    fontSize: '10px',
                    color: 'rgba(255,205,70)'
                },
                textAlign: 'left',
                x: 3
            },
            labels: {
                style: {
                    fontSize: '8px',
                    color: 'rgba(255,205,70)'
                },
                y: 2,
                x: 3
            },
            gridLineWidth: 0,
            opposite: true,
            showLastLabel: false
        }],

        legend: {
            enabled: false
        },

        plotOptions: {
            series: {
                pointPlacement: 'between'
            }
        },


        series: [{
            name: 'Temperature',
            data: this.temperatures,
            type: 'spline',
            marker: {
                enabled: false,
                states: {
                    hover: {
                        enabled: true
                    }
                }
            },
            tooltip: {
                pointFormat: '<span style="color:{point.color}">\u25CF</span> ' +
                    '{series.name}: <b>{point.value}°F</b><br/>'
            },
            zIndex: 1,
            color: '#FF3333',
            negativeColor: '#48AFE8'
        }, {
            name: 'Humidity',
            data: this.humidities,
            type: 'column',
            color: '#86bdf9',
            yAxis: 0,
            groupPadding: 0,
            pointPadding: 0,
            grouping: false,
            dataLabels: {
                enabled: true,
                align: 'center',
                inside: false,
                formatter: function () {
                    if (this.y > 0) {
                        return this.y;
                    }
                },
                style: {
                    fontSize: '8px',
                    color: 'gray'
                }
            },
            tooltip: {
                valueSuffix: '%'
            }
        }, {
            name: 'Air pressure',
            color: "#ffcd46",
            data: this.pressures,
            marker: {
                enabled: false
            },
            shadow: false,
            tooltip: {
                valueSuffix: ' inHg'
            },
            dashStyle: 'shortdot',
            yAxis: 2
        }, {
            name: 'Wind',
            type: 'windbarb',
            id: 'windbarbs',
            color: 'gray',
            lineWidth: 1.5,
            data: this.winds,
            vectorLength: 8,
            yOffset: -15,
            xOffset: -5,
            tooltip: {
                valueSuffix: ' m/s'
            }
        }]
    };
};

/**
 * Post-process the chart from the callback function, the second argument to Highcharts.Chart.
 */
Meteogram.prototype.onChartLoad = function (chart) {

    this.drawBlocksForWindArrows(chart);

};

/**
 * Create the chart. This function is called async when the data file is loaded and parsed.
 */
Meteogram.prototype.createChart = function () {
    var meteogram = this;
    this.chart = new Highcharts.Chart(this.getChartOptions(), function (chart) {
        meteogram.onChartLoad(chart);
    });
};

/**
 * Handle the data. This part of the code is not Highcharts specific, but deals with yr.no's
 * specific data format
 */
Meteogram.prototype.parseData = function () {

    var meteogram = this,
        dataset = this.dataset;

  	for(var i = 0; i < dataset.get("date").length; i++)
    {
    	var from = dataset.get("date")[i];
      var to = dataset.get("date")[i] + 3600;
    	meteogram.temperatures.push({
      	x:from,
        y: Math.round(dataset.get("temperature")[i]),
        to: to
      })
      meteogram.humidities.push({
        x: from,
        y: dataset.get("humidity")[i]
      });
      if (i % 2 === 0) {
        meteogram.winds.push({
          x: from,
          value: dataset.get("windspeed")[i],
          direction: dataset.get("winddirection")[i]
        });
      }
      meteogram.pressures.push({
        x: from,
        y: dataset.get("airpressure")[i]
      });
    }
    

    // Smooth the line
    this.smoothLine(this.temperatures);

    // Create the chart when the data is loaded
    this.createChart();
};
// End of the Meteogram protype
