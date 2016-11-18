
var data = [];

function checkParams() {
    chrome.storage.sync.get({
        UserName: '',
        Password: ''
    }, function(items) {
        var body = {
            "accountName": items.UserName,
            "applicationId":"d8665ade-9673-4e27-9ff6-92db4ce13d13",
            "password": items.Password
        }

        // now login
        if (items.UserName && items.Password) {
            login(items.UserName, items.Password);
	} else {
	    console.log('UserName/Password not set..');
	    window.setTimeout(checkParams, 3000);
	}
    });
}

function login(UserName, Password) {
    console.log('Logging into Dexcom..');

    var xhr = new XMLHttpRequest();

    xhr.open('POST', 'https://share1.dexcom.com/ShareWebServices/Services/General/LoginPublisherAccountByName');
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

        // Now we can read data!
        readBG(sessionId, '1440', '288');

        // Poll every 5 minutes for a new one
        setInterval(myTimer, 300000);

        function myTimer() {
	    var d = new Date();
	    console.log(d + 'Checking dexcom..');
            
	    readBG(sessionId, '10', '1');
	}
    }
}

function readBG(sessionId, minutes, max) {

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://share1.dexcom.com' +
        '/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues?sessionId=' +
        sessionId + '&minutes=' + minutes + '&maxCount=' + max);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();

    xhr.onload = function() {
        var bgData = JSON.parse(xhr.responseText);
	console.log(bgData);

	if (data.length > 0 && (bgData[0].ST == data[data.length-1].ST)) {
	    console.log('Ignoring duplicate, no updates this poll..');
	    chrome.browserAction.setBadgeText({text: ''});

	    return;
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

        chrome.browserAction.setBadgeText({text: bgData[0].Value.toString()});

        for (var i in bgData) {
            data.push(bgData[i]);
        }

        // keep for one day
	if (data.length > 288) {
            console.log('Shifting data array.');
	    data.shift();
        }

        //chrome.storage.sync.set({ 'bgData' : data });
    }
}

checkParams();
