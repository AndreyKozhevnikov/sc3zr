var backgroundHandler = new function () {
    var documentationUrlTimeout = 3000;

    this.init = function () {
        updateBrowserActionState();
        handleCommandShortcuts();
        handleMessages();
    };
    function AreEqualUrls(url1, url2) {
        var urlWoProtocol1 = url1.toLowerCase().replace("https://", "").replace("http://", "").replace("www.", "");
        var urlWoProtocol2 = url2.toLowerCase().replace("https://", "").replace("http://", "").replace("www.", "");
        if (urlWoProtocol1 == urlWoProtocol2) {
            return true;
        }
        if (urlWoProtocol1.includes(ISC_THREAD_DETAILS_URL) && urlWoProtocol2.includes(ISC_THREAD_DETAILS_URL)) {
            return GetNormalizedIscThreadDetailsUrl(url1) == GetNormalizedIscThreadDetailsUrl(url2);
        }
        else {
            return urlWoProtocol1.includes(urlWoProtocol2);
        }
    }
    function copyToClipboard(text) {
        var copyDiv = document.createElement('div');
        copyDiv.contentEditable = true;
        document.body.appendChild(copyDiv);
        copyDiv.innerHTML = text;
        copyDiv.unselectable = "off";
        copyDiv.focus();
        document.execCommand('SelectAll');
        document.execCommand("Copy", false, null);
        document.body.removeChild(copyDiv);
    }
    function handleCommandShortcuts() {// To handle shortcuts for commands defined in the manifest file.
        chrome.commands.onCommand.addListener(function (command) {
            chrome.tabs.getSelected(null, function (tab) {
                if (tab.url.includes(ISC_URL)) {
                    chrome.tabs.sendMessage(tab.id, { command: command });
                }
            });
        });
    }
    function updateBrowserActionState() {
        chrome.tabs.query({}, function (tabs) {
            var disableRecentTickets = localStorage.getItem(ID_RECENT_TICKETS) != "true";
            for (var i = 0; i < tabs.length; i++) {
                if (disableRecentTickets || !tabs[i].url.includes(ISC_URL)) {
                    chrome.browserAction.disable(tabs[i].id);
                }
            }
        });
    }
    function handleMessages() {
        chrome.runtime.onMessage.addListener(
          function (request, sender, sendResponse) {

              if (request.options === ID_GET_OPTIONS) {
                  chrome.tabs.sendMessage(sender.tab.id, { options: localStorage });
              }

              if (request.savedCacheItem) {
                  var visitedDocsCache = JSON.parse(localStorage.getItem(ID_VISITED_DOCS_CACHE));
                  if (!visitedDocsCache) {
                      visitedDocsCache = [];
                  }
                  var searchResults = $.grep(visitedDocsCache, function (item) { return item.url === request.savedCacheItem.url; });
                  if (searchResults.length === 1) {
                      visitedDocsCache.splice(visitedDocsCache.indexOf(searchResults[0]), 1);
                      searchResults[0] = request.savedCacheItem;
                  }
                  visitedDocsCache.push(request.savedCacheItem);
                  localStorage.setItem(ID_VISITED_DOCS_CACHE, JSON.stringify(visitedDocsCache));
              }

              if (request.cacheItemKey) {
                  var visitedDocsCache = JSON.parse(localStorage.getItem(ID_VISITED_DOCS_CACHE));
                  var loadedCacheItem = ID_ERROR;
                  if (!visitedDocsCache) {
                      visitedDocsCache = [];
                  }
                  var searchResults = $.grep(visitedDocsCache, function (item) { return item.url === request.cacheItemKey; });
                  if (searchResults.length === 1) {
                      loadedCacheItem = searchResults[0];
                  }
                  chrome.tabs.sendMessage(sender.tab.id, { loadedCacheItem: loadedCacheItem });
              }

              if (request.textToCopy) {
                  copyToClipboard(request.textToCopy);
              }

              if (request.duplicateUrl) {
                  chrome.tabs.query({}, function (tabs) {
                      var duplicateTab = null;
                      for (var i = 0; i < tabs.length; i++) {
                          if (AreEqualUrls(tabs[i].url, request.duplicateUrl)) {
                              duplicateTab = tabs[i];
                              break;
                          }
                      }
                      if (duplicateTab) {
                          chrome.tabs.update(duplicateTab.id, { selected: true });
                      } else {
                          open(request.duplicateUrl, request.target);
                      }
                      chrome.tabs.sendMessage(sender.tab.id, { duplicateHighlighted: duplicateTab ? true : false });
                  });
              }

              if (request.docUrl && request.docUrl.toLowerCase().includes(DOCUMENTATION_URL)) { // Handling the request from the content script when inserting a documentation link.
                  if (request.docUrl.toLowerCase().includes(SEARCH_ENGINE_URL)) {
                      request.docUrl = decodeURIComponent(request.docUrl.slice(request.docUrl.indexOf("?url=") + 5, request.docUrl.indexOf("&documentType")));
                  }
                  chrome.tabs.query({}, function (tabs) {
                      var existingDocTab = null;
                      for (var i = 0; i < tabs.length; i++) {
                          if (tabs[i].url === request.docUrl) {
                              existingDocTab = tabs[i];
                              break;
                          }
                      }
                      var docTabInjectedScript = "chrome.runtime.sendMessage( { docTitle: (document.getElementsByClassName('breadcrumbs').length !== 0 ? document.getElementsByClassName('breadcrumbs') : document.getElementsByClassName('dx-title'))[0].innerText, threadTabId: " + sender.tab.id + " } );";
                      if (existingDocTab) {
                          chrome.tabs.executeScript(existingDocTab.id, { code: docTabInjectedScript });
                      } else {
                          chrome.tabs.create({
                              url: request.docUrl,
                              active: false
                          }, function (createdDocTab) {
                              chrome.tabs.executeScript(createdDocTab.id, { code: "setTimeout(function(){" + docTabInjectedScript + "close(); }," + documentationUrlTimeout.toString() + ");" });
                          });
                      }
                  });
              }

              if (request.docTitle) { // Handling the request from the tab with the help article. Do not mix the sender.tab.id here, use presaved threadTabId instead.
                  chrome.tabs.sendMessage(request.threadTabId, { docTitle: request.docTitle });
              }
          }
        );
    }
};
backgroundHandler.init();