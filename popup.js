
document.addEventListener('DOMContentLoaded', function() {
    var radio;

    radio = document.getElementById('24');
    radio.addEventListener('click', function() { showGraph(24); });
    radio = document.getElementById('12');
    radio.addEventListener('click', function() { showGraph(12); });
    radio = document.getElementById('6');
    radio.addEventListener('click', function() { showGraph(6); });
    radio = document.getElementById('3');
    radio.addEventListener('click', function() { showGraph(3); });
    radio = document.getElementById('1');
    radio.addEventListener('click', function() { showGraph(1); });

    showGraph(24);
});

function showGraph(duration) {

    var background = chrome.extension.getBackgroundPage();
    //var x = chrome.storage.sync.get('bgData', function(obj) {
    //    console.log(obj);
    //});
    var bgData = [];
    bgData = background.data;
    console.log(bgData);

    bgValues = [];
    bgST = [];
    for (var d in bgData) {
        var bg = bgData[d];
	var t = new Date(parseInt(bg.ST.split('(')[1].split(')')[0]));

        if (((new Date) - t) > (parseInt(duration) * 60 * 60 * 1000))
            continue;

	bgST.push(t);
	bgValues.push(bgData[d].Value);
    }

    var lastBG = bgData[bgData.length-1];
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

    jchart.canvas.height = 500;
    jchart.canvas.width = 800;

    Chart.pluginService.register({
        beforeDraw: function(chart, easing) {
            if (chart.config.options.chartArea) {
                var helpers = Chart.helpers;
                var ctx = chart.chart.ctx;
                var chartArea = chart.chartArea;
           
                ctx.save();
                ctx.clearRect(0, 0, 800, 500);

                // use the height to determine color regions 
                var height = (chartArea.bottom - chartArea.top);

                ctx.fillStyle = 'rgba(255,0,0,0.4)';
                ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, height / 4);
                ctx.fillRect(chartArea.left, chartArea.top+(height*0.875), chartArea.right - chartArea.left, height*0.125);
                ctx.fillStyle = 'rgba(255,200,0,0.4)';
                ctx.fillRect(chartArea.left, chartArea.top + height/4, chartArea.right - chartArea.left, height / 4);
                ctx.fillRect(chartArea.left, chartArea.top + (height*0.75), chartArea.right - chartArea.left, height*0.125);
                ctx.fillStyle = 'rgba(0,255,0,0.4)';
                ctx.fillRect(chartArea.left, chartArea.top+(height*0.5), chartArea.right - chartArea.left, height*0.25);
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
                        max: 400
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
