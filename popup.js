
var alertHigh;
var alertLow;
var warningHigh;
var warningLow;
var maxBGValue;

function show() {
    var chartTypes = document.getElementsByName('chart');
    var durations = document.getElementsByName('duration');

    console.log(chartTypes);

    for (var i = 0; i < chartTypes.length; i++) {
        if (chartTypes[i].checked)
            chartType = chartTypes[i].id;
    }

    for (var i = 0; i < durations.length; i++) {
        if (durations[i].checked)
            duration = durations[i].id;
    }

    if (chartType == 'line')
        showGraph(duration);
    else
        showPie(duration);

}

document.addEventListener('DOMContentLoaded', function() {
    var radio;

    radio = document.getElementById('24');
    radio.addEventListener('click', show);
    radio = document.getElementById('12');
    radio.addEventListener('click', show);
    radio = document.getElementById('6');
    radio.addEventListener('click', show);
    radio = document.getElementById('3');
    radio.addEventListener('click', show);
    radio = document.getElementById('1');
    radio.addEventListener('click', show);

    radio = document.getElementById('line');
    radio.addEventListener('click', show);
    radio = document.getElementById('pie');
    radio.addEventListener('click', show);

    show();
});

function initialize() {

    // we rely on the background page to do our xhr requests
    var background = chrome.extension.getBackgroundPage();

    var bgData = background.data;
    alertHigh = background.alertHigh;
    alertLow = background.alertLow;
    warningHigh = background.warningHigh;
    warningLow = background.warningLow;
    units = background.units;

    // determine our units
    if (units == 'mmol/L')
        maxBGValue = 22.2;
    else
        maxBGValue = 400;

    return bgData;
}

function stats(bgData, duration) {

    var bgTotal = 0;
    var bgCount = 0;
    var bgAve = 0;
    var bgMin = 400;
    var bgMax = 0;
    var bgAbove = 0;
    var bgBelow = 0;

    for (var d in bgData) {
        var bg = bgData[d];
        var t = new Date(parseInt(bg.ST.split('(')[1].split(')')[0]));
        var val;

        // if the date exceeds our duration, skip it
        if (((new Date) - t) > (parseInt(duration) * 60 * 60 * 1000))
            continue;

        if (units == 'mmol/L')
            val = bg.Value / 18;
        else
            val = bg.Value;

        // keep a running total
        bgTotal += val;
        bgCount++;

        if (val < bgMin)
            bgMin = val;
        if (val > bgMax)
            bgMax = val;
        if (val > warningHigh)
            bgAbove++;
        if (val < warningLow)
            bgBelow++;
    }

    // compute our average
    bgAve = Math.round(bgTotal / bgCount);

    document.getElementById('total').innerHTML = bgCount;
    document.getElementById('average').innerHTML = bgAve;
    document.getElementById('ave-units').innerHTML = units;
    document.getElementById('max').innerHTML = bgMax;
    document.getElementById('max-units').innerHTML = units;
    document.getElementById('min').innerHTML = bgMin;
    document.getElementById('min-units').innerHTML = units;
    document.getElementById('above-range').innerHTML = Math.round(100*(bgAbove/bgCount)) + '%';
    document.getElementById('below-range').innerHTML = Math.round(100*(bgBelow/bgCount)) + '%';
    document.getElementById('in-range').innerHTML = Math.round(100*(((bgCount-(bgAbove+bgBelow))/bgCount))) + '%';
}

function getTitle(lastBG) {

    var title = lastBG.Value;

    /*
     * The trends seem to be:
     *     1 double up
     *     2 up arrow
     *     3 sloping up
     *     4 steady
     *     5 sloping down
     *     6 down arrow
     *     7 double down
     */
    if (lastBG.Trend <= 1) {
        title += '\u21c8';
    } else if (lastBG.Trend == 2) {
        title += '\u2191';
    } else if (lastBG.Trend == 3) {
        title += '\u2197';
    } else if (lastBG.Trend == 4) {
        title += '\u2192';
    } else if (lastBG.Trend == 5) {
        title += '\u2198';
    } else if (lastBG.Trend == 6) {
        title += '\u2193';
    } else if (lastBG.Trend >= 7) {
        title += '\u21ca';
    }

    return title;
}

function showGraph(duration) {

    // fetch our BG Data from the background page
    bgData = initialize();

    // calculate stats
    stats(bgData, duration);

    var bgValues = [];
    var bgST = [];

    for (var d in bgData) {
        var bg = bgData[d];
	var t = new Date(parseInt(bg.ST.split('(')[1].split(')')[0]));
        var val;

        // if the date exceeds our duration, skip it
        if (((new Date) - t) > (parseInt(duration) * 60 * 60 * 1000))
            continue;

        if (units == 'mmol/L')
            val = bg.Value / 18;
        else
            val = bg.Value;

        // add the timestamp to our x-axis 
	bgST.push(t);

        // add the BG Value to our y-axis
        bgValues.push(val);
    }

    var lastBG = bgData[bgData.length-1];
    var title = getTitle(lastBG);

    if (parseInt(lastBG.Value) > 300)
        color = 'rgba(255,0,0,1)'; 
    else if (parseInt(lastBG.Value) > 200)
        color = 'rgba(255,165,0,1)'; 
    else if (parseInt(lastBG.Value) > 100)
        color = 'rgba(0,255,0,1)'; 
    else if (parseInt(lastBG.Value) > 75)
        color = 'rgba(255,165,0,1)'; 
    else 
        color = 'rgba(255,0,0,1)'; 

    var canvas = document.getElementById("jchart");
    var jchart = canvas.getContext("2d");

    jchart.canvas.height = 400;
    jchart.canvas.width = 800;

    Chart.pluginService.register({
        beforeDraw: function(chart, easing) {
            if (chart.config.options.chartArea) {
                var helpers = Chart.helpers;
                var ctx = chart.chart.ctx;
                var chartArea = chart.chartArea;

                ctx.save();
                ctx.clearRect(0, 0, 800, 400);

                // use the height to determine color regions 
                var height = (chartArea.bottom - chartArea.top);

                ctx.fillStyle = 'rgba(255,0,0,0.4)';
                // fill in alertHigh
                ctx.fillRect(chartArea.left, chartArea.top, 
                    chartArea.right - chartArea.left, ((maxBGValue-alertHigh)/maxBGValue) * height);
                // fill in alertLow
                ctx.fillRect(chartArea.left, chartArea.top+(height*((maxBGValue-alertLow)/maxBGValue)), 
                    chartArea.right - chartArea.left, height*(alertLow/maxBGValue));

                ctx.fillStyle = 'rgba(255,200,0,0.4)';
                // fill in warningHigh
                ctx.fillRect(chartArea.left, chartArea.top + ((maxBGValue-alertHigh)/maxBGValue) * height, 
                    chartArea.right - chartArea.left, ((alertHigh-warningHigh)/maxBGValue) * height);
                // fill in warningLow
                ctx.fillRect(chartArea.left, chartArea.top + ((maxBGValue-warningLow)/maxBGValue)*height, 
                    chartArea.right - chartArea.left, ((warningLow-alertLow)/maxBGValue)*height);

                ctx.fillStyle = 'rgba(0,255,0,0.4)';
                // fill in good zone
                ctx.fillRect(chartArea.left, chartArea.top+((maxBGValue-warningHigh)/maxBGValue)*height, 
                    chartArea.right - chartArea.left, ((warningHigh-warningLow)/maxBGValue)*height);
                ctx.restore();
            }
        }
    });

    if (window.chart != undefined)
        window.chart.destroy();

    window.chart = new Chart(jchart, {
        type: 'line',
	label: 'Blood Glucose',
        data: {
	    labels: bgST,
	    datasets: [
	        {
		    label: 'Blood Glucose',
		    fill: false,
		    data: bgValues,
	            borderColor: 'rgba(0,0,0,1)',
		}
	    ]
	},
	borderWidth: 5,
	options: {
            //responsive: true,
            scales: {
                yAxes: [{
		    ticks: {
		        beginAtZero: true,
                        min: 0,
                        max: maxBGValue
		    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Glucose'
                    }
		}],
                xAxes: [{
                    type: 'time',
                    scaleLabel: {
                        display: true,
                        labelString: 'Time'
                    }
                }],
	    },
	    title: {
	        display: true,
		text: title,
		fontSize: 30,
		fontColor: color,
		fontStyle: 'bold'
	    },
            chartArea: {
            }
	}
    });
}

function showPie(duration) {
    bgData = initialize();

    // calculate stats
    stats(bgData, duration);

    var pie = {
        low: 0, good: 0, high: 0
    };

    for (var d in bgData) {
        var bg = bgData[d];
        var t = new Date(parseInt(bg.ST.split('(')[1].split(')')[0]));

        if (((new Date) - t) > (parseInt(duration) * 60 * 60 * 1000))
            continue;

        if (bg.Value < warningLow)
            pie['low']++;
        else if (bg.Value < warningHigh)
            pie['good']++;
        else
            pie['high']++;
    }

    var lastBG = bgData[bgData.length-1];
    title = getTitle(lastBG);

    if (window.chart != undefined)
        window.chart.destroy();

    window.chart = new Chart(jchart, {
        type: 'doughnut',
        data: {
            labels: [
                "Low",
                "Good",
                "High"
            ],
            datasets: [
                {
                    data: [
                        pie['low'],
                        pie['good'],
                        pie['high']
                    ],
                    backgroundColor: [
                        "#FF0000",
                        "#00FF00",
                        "#FFFF00"
                    ]
                }
            ]
        }
    });
}
