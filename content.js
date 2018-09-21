var sc3zr = new function () {
    var options = null;
    this.init = function () {
        chrome.runtime.onMessage.addListener(function listener(request, sender, sendResponse) {
            if (request.options) {
                options = request.options;
                $(document).ready(initCore);
            }
            chrome.runtime.onMessage.removeListener(listener);
        });
        chrome.runtime.sendMessage({ options: ID_GET_OPTIONS });
        //chrome.runtime.sendMessage({ options: ID_GET_OPTIONS }, function (response) {
        //    options = response.options;
        //    $(document).ready(initCore);
        //});
    };

    function initCore() {
        if (document.URL.toLowerCase().includes(SC_PUBLIC_QUESTION_URL) || document.URL.toLowerCase().includes(SC_PUBLIC_EXAMPLE_URL)) {
            openTicketInSC3();
        }
        else {
            if (document.URL.toLowerCase().includes(ISC_Thread_URL)) {
                changeDefaultStyle();
                enableInsertHelpTitle();
                copyIdOnDoubleClick();
                insertSignature();
                logStatistics();
            }
            if (document.URL.toLowerCase().includes(ISC_URL)) {
                preventDuplicateTabs();
            }
            if (document.URL.toLowerCase().includes(SC_STATS_URL)) {
                setTimeout(preventDuplicateTabs, 500);
                setInterval(preventDuplicateTabs, 62500);
            }
        }
    }
    function getOptionValue(key) {
        if (options) {
            var value = options[key];
            if (value === "true") {
                return true;
            }
            if (value === "false") {
                return false;
            }
            if (!isNaN(value)) {
                return value + "px";
            }
            return value;
        }
        return null;
    }
    function loadCacheItem(cacheItemKey, callback) {
        chrome.runtime.onMessage.addListener(function listener(request, sender, sendResponse) {
            if (request.loadedCacheItem) {
                callback(request.loadedCacheItem);
            }
            chrome.runtime.onMessage.removeListener(listener);
        });
        chrome.runtime.sendMessage({ cacheItemKey: cacheItemKey });
    }
    function saveCacheItem(cacheItem) {
        chrome.runtime.sendMessage({ savedCacheItem: cacheItem });
    }
    function insertSignature() {
        //http://stackoverflow.com/questions/22201221/event-listener-domnodeinserted-being-run-multiple-times-why
        (function ($, sr) {
            // debouncing function from John Hann
            // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
            var debounce = function (func, threshold, execAsap) {
                var timeout;
                return function debounced() {
                    var obj = this, args = arguments;
                    function delayed() {
                        if (!execAsap)
                            func.apply(obj, args);
                        timeout = null;
                    };
                    if (timeout) {
                        clearTimeout(timeout);
                    } else if (execAsap) { func.apply(obj, args); }
                    timeout = setTimeout(delayed, threshold || 100);
                };
            }
            jQuery.fn[sr] = function (fn) { return fn ? this.on('DOMNodeInserted', debounce(fn)) : this.trigger(sr); };
        })(jQuery, 'debouncedDNI');

        $(document).debouncedDNI(function (e) {
            if (e.target.className === "new-item-states clearfix") {
                var editorFrame = $(e.target).parent().parent().find("iframe[id^='mce_'][id$='_ifr']");
                editorFrame.contents().find("body").keydown(function (e) {
                    if (e.keyCode === 85 && e.ctrlKey) {// Control+U
                        if (editorFrame.contents().find("a[href*='" + DENNIS_BLOG_URL + "']").length === 0) {
                            editorFrame.contents().find("body").append(DENNIS_BLOG_SIGNATURE_HTML);
                        }
                    }
                    if (e.keyCode === 85 && e.altKey) { // Alt+U
                        if (editorFrame.contents().find("a[href*='" + SEARCH_ENGINE_URL + "']").length === 0) {
                            editorFrame.contents().find("body").append(SEARCH_ENGINE_SUGGESTION_HTML);
                        }
                    }
                });
            }
        });
    }
    function logStatistics() {
        //TODO
        //http://stackoverflow.com/questions/12985723/google-analytics-tracking-in-chrome-extensions-background-html
    }
    function changeDefaultStyle() {
        $("label").css("font-size", getOptionValue("defaultLabelSize"));
        $("body, div").css("font-size", getOptionValue("defaultContentSize"));
        var submitButton = $("button#submitPage");
        if (getOptionValue("emphasizeSubmit") && submitButton) {
            submitButton.css("font-size", "36px");
            submitButton.css("font-weight", "900");
            submitButton.css("width", getOptionValue("submitWidth"));
            submitButton.css("height", getOptionValue("submitHeight"));
        }
    }
    //TODO:
    //Url cache algorithm:
    //0: Cache structure: [{url: URL, value: VALUE, rank: RANK}, ...]
    //1. A user inserts a help doc URL into the URL box;
    //2. If there is a cached value by the URL key, then return the value into the Text box;
    //3. Else then query for the Text by URL, wait for the result, put the value into the cache, update the Text box.
    //4. Increment the cached item rank for the URL;
    function enableInsertHelpTitle() {
        if (getOptionValue("insertHelpTitle")) {
            $(document).on('DOMNodeInserted', function (e) {
                if (e.target.id === 'mce-modal-block') {
                    setTimeout(function () {
                        if ($(".mce-title")) {
                            var dialogText = $(".mce-title").text().toLowerCase();
                            var inputs = $(".mce-title").parent().parent().find("input.mce-textbox");
                            if ((dialogText === "insert link") && (inputs.length === 2)) {
                                var urlInput = $(inputs[0]);
                                var descInput = $(inputs[1]);
                                descInput.updateTitle = function (title) {
                                    if (title) {
                                        $(this).val(title);
                                        $(this).css("background-color", "LightCyan");
                                    }
                                }
                                urlInput.change(function () {
                                    descInput.css("background-color", "transparent");
                                    var docUrl = urlInput.val();
                                    var docTitle = undefined;
                                    loadCacheItem(docUrl, function (result) {
                                        if (result === ID_ERROR) {
                                            //console.warn("Cannot find cache item by key: " + docUrl);
                                            chrome.runtime.onMessage.addListener(function listener(request, sender, sendResponse) {
                                                if (request.docTitle && (descInput.val() !== request.docTitle)) {
                                                    docTitle = request.docTitle;
                                                    saveCacheItem({ url: docUrl, title: docTitle, rank: 1 });
                                                    descInput.updateTitle(docTitle);
                                                }
                                                chrome.runtime.onMessage.removeListener(listener);
                                            });
                                            chrome.runtime.sendMessage({ docUrl: docUrl });
                                        } else if (result) {
                                            docTitle = result.title;
                                            result.rank = result.rank + 1;
                                            saveCacheItem(result);
                                            descInput.updateTitle(docTitle);
                                        }
                                    });
                                });
                            }
                        }
                    }, 500);
                }
            });
        }
    }
    function preventDuplicateTabs() {
        if (getOptionValue("preventDuplicateTabs")) {
            var anchors = $("a.caption, a:not([href*='#'],[href='javascript:void(0)'],[href='/'])");
            for (var i = 0; i < anchors.length; i++) {
                $(anchors[i]).off("mousedown", safeAnchorClickHandler);
                $(anchors[i]).mousedown(safeAnchorClickHandler);
            }
            //$("a.caption, a:not([href*='#'],[href='javascript:void(0)'],[href='/'])").click(safeAnchorClickHandler);
            //$(document).click(function (e) {
            //    if (e.target.nodeName.toLowerCase() === "a" 
            //        && !e.target.href.toLowerCase().includes('#') 
            //            && !e.target.href.toLowerCase().includes('javascript:void(0)')
            //                && !e.target.href !== '/') {
            //        e.preventDefault();
            //        $(e.target).click(safeAnchorClickHandler);
            //        var text = $(e.target).text();
            //        alert(text);
            //    }
            //});
        }
    }
    function openTicketInSC3() {
        if (getOptionValue("openTicketInSC3")) {
            var url = document.URL.toString();
            var ticketId = url.substr(url.lastIndexOf("/") + 1);
            var openInSc3Button = document.createElement('a');
            openInSc3Button.href = GetNormalizedIscThreadDetailsUrlById(ticketId);
            openInSc3Button.appendChild(document.createTextNode("Open in SC3"));
            openInSc3Button.id = "openTicketInSC3";
            openInSc3Button.style.cssFloat = "right";
            openInSc3Button.style.color = "green";
            openInSc3Button.style.fontWeight = "900";
            var container = $("div.post-tags");
            if (container) {
                container.append(openInSc3Button);
            } else {
                console.warn("Could not locate a container for inserting the openTicketInSC3 button.");
            }
            $(openInSc3Button).click(safeAnchorClickHandler);
        }
    }
    function copyIdOnDoubleClick() {
        if (getOptionValue("copyIdOnDoubleClick")) {
            var subject = $("div#ticket-subject").find("h4");
            if (subject) {
                subject.attr("title", "Double-click to copy the Id value to clipboard");
                subject.dblclick(function () {
                    var sourceSubject = subject.text();
                    chrome.runtime.sendMessage({ textToCopy: sourceSubject.slice(0, sourceSubject.indexOf(":")) });
                    subject.animate({ opacity: 0, fontColor: 'green' }, 200, "linear", function () { $(this).animate({ opacity: 1, fontColor: "black" }, 200); });
                });
            }
        }
    }
};
sc3zr.init();