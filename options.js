
function restore_options() {
    chrome.storage.sync.get({
        UserName: '',
        Password: ''
    }, function(items) {
        document.getElementById('UserName').value = items.UserName;
        document.getElementById('Password').value = items.Password;
    });
}

function save_options() {
    var UserName = document.getElementById('UserName').value;
    var Password = document.getElementById('Password').value;
    
    console.log("Saving options");

    chrome.storage.sync.set({
        UserName: UserName,
        Password: Password
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
