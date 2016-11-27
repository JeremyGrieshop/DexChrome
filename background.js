
var interval;
var data = [];
var alertHigh;
var alertLow;
var warningHigh;
var warningLow;
var units;

function checkParams() {
    chrome.storage.sync.get({
        BridgeServer: 'share1.dexcom.com',
        Units: 'mg/dl',
        UserName: '',
        Password: '',
        AlertHigh: '300',
        WarningHigh: '200',
        AlertLow: '50',
        WarningLow: '100'
    }, function(items) {
        var body = {
            "accountName": items.UserName,
            "applicationId":"d8665ade-9673-4e27-9ff6-92db4ce13d13",
            "password": items.Password
        }

        alertHigh = items.AlertHigh;
        alertLow = items.AlertLow;
        warningHigh = items.WarningHigh;
        warningLow = items.WarningLow;
        units = items.Units;

        // now login
        if (items.UserName && items.Password && items.BridgeServer) {
            login(items.BridgeServer, items.UserName, items.Password);
	} else {
	    console.log('UserName/Password not set..');
	    window.setTimeout(checkParams, 3000);
	}
    });
}

function login(BridgeServer, UserName, Password) {
    console.log('Logging into Dexcom..');

    var xhr = new XMLHttpRequest();

    xhr.open('POST', 'https://' + BridgeServer + '/ShareWebServices/Services/General/LoginPublisherAccountByName');
    xhr.setRequestHeader('Content-Type', 'application/json');

    var body = {
        "accountName": UserName,
        "applicationId":"d8665ade-9673-4e27-9ff6-92db4ce13d13",
        "password": Password
    }

    xhr.send(JSON.stringify(body));
    xhr.onload = function() {
        var sessionId = JSON.parse(xhr.responseText);
	console.log('Got SessionId: ' + sessionId);

        data = [];

        // Now we can read data!
        readBG(BridgeServer, sessionId, '1440', '288');

        // Poll every 5 minutes for a new one
        interval = setInterval(myTimer, 300000);

        function myTimer() {
	    var d = new Date();
	    console.log(d + 'Checking dexcom..');
            
	    readBG(BridgeServer, sessionId, '9', '1');
	}
    }
}

function readBG(BridgeServer, sessionId, minutes, max) {

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://' + BridgeServer +
        '/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues?sessionId=' +
        sessionId + '&minutes=' + minutes + '&maxCount=' + max);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();

    xhr.onload = function() {
        if (xhr.status != 200) {
           clearInterval(interval);
	   console.log('An error was received connecting to Dexcom: ' + xhr.responseText + ' (' + xhr.status + ')');
           checkParams(); 
        }

        var bgData = JSON.parse(xhr.responseText);
	console.log(bgData);

	if (data.length > 0 && bgData.length > 0) {
            if (bgData[0].ST == data[data.length-1].ST) {
                console.log('Ignoring duplicate, no updates this poll..');
	        chrome.browserAction.setBadgeText({text: ''});

	        return;
            }
	}

        if (bgData[0].Value > 300)
	    chrome.browserAction.setBadgeBackgroundColor({color: [255,0,0,64]});
	else if (bgData[0].Value > 200)
            chrome.browserAction.setBadgeBackgroundColor({color: [255,165,0,64]});
        else if (bgData[0].Value > 100)
	    chrome.browserAction.setBadgeBackgroundColor({color: [0,255,0,64]});
	else if (bgData[0].Value > 75)
	    chrome.browserAction.setBadgeBackgroundColor({color: [255,165,0,64]});
        else
	    chrome.browserAction.setBadgeBackgroundColor({color: [255,0,0,64]});

        for (var i in bgData) {
            data.push(bgData[bgData.length-i-1]);
        }

        var lastBG = data[data.length-1];
        var lastBGDate = new Date(parseInt(lastBG.ST.split('(')[1].split(')')[0]));

        // only display the badge if within 7 minutes old
        if ((new Date) - lastBGDate < (1000 * 60 * 7))
            chrome.browserAction.setBadgeText({text: data[data.length-1].Value.toString()});

        // keep for one day
	if (data.length > 288) {
            console.log('Shifting data array.');
	    data.shift();
        }
    }
}

checkParams();
