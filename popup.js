
window.onload = function() {

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
	var t = new Date(parseInt(bgData[d].ST.split('(')[1].split(')')[0]));
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

    Chart.pluginService.register({
        beforeDraw: function(chart, easing) {
            if (chart.config.options.chartArea) {
                var helpers = Chart.helpers;
                var ctx = chart.chart.ctx;
                var chartArea = chart.chartArea;
           
                ctx.save();
                console.log('left = ' + chartArea.left);
                console.log('top = ' + chartArea.top);
                console.log('right = ' + chartArea.right);
                console.log('bottom = ' + chartArea.bottom);
 
                var height = (chartArea.bottom - chartArea.top);

                ctx.fillStyle = 'rgba(255,0,0,0.4)';
                //ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, 80);
                ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, height / 4);
                //ctx.fillRect(chartArea.left, chartArea.bottom-40, chartArea.right - chartArea.left, 40);
                ctx.fillRect(chartArea.left, chartArea.top+(height*0.875), chartArea.right - chartArea.left, 50);
                ctx.fillStyle = 'rgba(255,200,0,0.4)';
                //ctx.fillRect(chartArea.left, chartArea.top+80, chartArea.right - chartArea.left, 75);
                //ctx.fillRect(chartArea.left, chartArea.bottom-80, chartArea.right - chartArea.left, 40);
                ctx.fillStyle = 'rgba(0,255,0,0.4)';
                //ctx.fillRect(chartArea.left, chartArea.top+155, chartArea.right - chartArea.left, 80);
                ctx.restore();
            }
        }
    });

    var jchart = document.getElementById("jchart").getContext("2d");

    var myChart = new Chart(jchart, {
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
            scales: {
                yAxes: [{
		    ticks: {
		        beginAtZero: true,
                        min: 0,
                        max: 400
		    }
		}],
                xAxes: [{
                    type: 'time',
                    scaleLabel: {
                        display: true,
                        labelString: 'Time'
                    }
                }]
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
