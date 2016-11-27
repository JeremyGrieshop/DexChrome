
function restore_options() {
    chrome.storage.sync.get({
        BridgeServer: 'share1.dexcom.com',
        Units: 'mg/dL',
        UserName: '',
        Password: '',
        AlertHigh: '300',
        WarningHigh: '200',
        AlertLow: '50',
        WarningLow: '100'
    }, function(items) {
        document.getElementById('BridgeServer').value = items.BridgeServer;
        document.getElementById('Units').value = items.Units;
        document.getElementById('UserName').value = items.UserName;
        document.getElementById('Password').value = items.Password;
        document.getElementById('AlertHigh').value = items.AlertHigh;
        document.getElementById('AlertLow').value = items.AlertLow;
        document.getElementById('WarningHigh').value = items.WarningHigh;
        document.getElementById('WarningLow').value = items.WarningLow;
    });
}

function save_options() {
    var BridgeServer = document.getElementById('BridgeServer').value;
    var Units = document.getElementById('Units').value;
    var UserName = document.getElementById('UserName').value;
    var Password = document.getElementById('Password').value;
    var AlertHigh = document.getElementById('AlertHigh').value;
    var WarningHigh = document.getElementById('WarningHigh').value;
    var AlertLow = document.getElementById('AlertLow').value;
    var WarningLow = document.getElementById('WarningLow').value;
    
    console.log("Saving options");

    chrome.storage.sync.set({
        BridgeServer: BridgeServer,
        Units: Units,
        UserName: UserName,
        Password: Password,
        AlertHigh: AlertHigh,
        WarningHigh: WarningHigh,
        AlertLow: AlertLow,
        WarningLow: WarningLow 
    }, function() {
        var background = chrome.extension.getBackgroundPage();
        background.units = Units;
        background.alertHigh = AlertHigh;
        background.alertLow = AlertLow;
        background.warningHigh = WarningHigh;
        background.warningLow = WarningLow;

        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 2000);
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
