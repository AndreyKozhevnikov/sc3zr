var optionsHandler = new function () {
    var inputList = null;
    var saveButton = null;
    function onOptionChanged() {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.style.fontWeight = "bold";
        }
    };
    function onOptionSaved() {
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.style.fontWeight = "";
        }
    };
    function saveOptions() {
        if (inputList) {
            for (var i = 0; i < inputList.length; i++) {
                var input = inputList[i];
                if (input.type === "checkbox") {
                    localStorage.setItem(input.id, input.checked);
                } else {
                    localStorage.setItem(input.id, input.value);
                }
            }
        }
    };
    function restoreOptions() {
        if (inputList) {
            for (var i = 0; i < inputList.length; i++) {
                var input = inputList[i];
                var optionValue = localStorage.getItem(input.id);
                if (optionValue) {
                    if (input.type === "checkbox") {
                        input.checked = optionValue == "true";
                    } else {
                        input.value = optionValue;
                    }
                }
            }
        }
    };
    this.init = function () {
        document.addEventListener('DOMContentLoaded', function () {
            inputList = this.getElementsByTagName("input");
            if (inputList) {
                for (var i = 0; i < inputList.length; i++) {
                    var input = inputList[i];
                    input.onchange = input.onkeypress = input.onpaste = input.oninput = function () {
                        onOptionChanged();
                    };
                }
                if (localStorage.length === 0) { // To fill local storage for the first time.
                    saveOptions();
                }
                restoreOptions();
            }
            saveButton = this.getElementById('save');
            if (saveButton) {
                saveButton.onclick = function () {
                    saveOptions();
                    onOptionSaved();
                }
            }
        });
    };
};
optionsHandler.init();