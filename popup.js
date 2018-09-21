$(document).ready(function () {
    $(".tabs-menu a").click(function (event) {
        event.preventDefault();
        $(this).parent().addClass("current");
        $(this).parent().siblings().removeClass("current");
        var tab = $(this).attr("href");
        $(".tab-content").not(tab).css("display", "none");
        $(tab).fadeIn();
    });
});
function selectOption() {
    $(".selected a")[0].click();
}
function buildPopupDom(divName, data) {
    var popupDiv = document.getElementById(divName);

    var ul = document.createElement('ul');
    $(ul).addClass("tickets");
    popupDiv.appendChild(ul);

    for (var key in data) {
        var a = document.createElement('a');
        a.href = key;
        var title = data[key];
        var cutPosition = 100;
        if (title.length >= cutPosition) {
            title = title.substring(0, cutPosition) + "...";
        }
        a.appendChild(document.createTextNode(title));

        $(a).click(safeAnchorClickHandler);

        var li = document.createElement('li');
        li.appendChild(a);
        $(li).mouseover(function () {
            $("li").removeClass("selected");
            $(this).addClass("selected");
        });

        ul.appendChild(li);
    }

    $(document).keydown(function (e) {
        if (e.keyCode === 13) { // enter
            selectOption();
        }
        if (e.keyCode === 38) { // up
            var selected = $(".selected");
            $("li").removeClass("selected");
            if (selected.prev().length === 0) {
                selected.siblings().last().addClass("selected");
            } else {
                selected.prev().addClass("selected");
            }
        }
        if (e.keyCode === 40) { // down
            var selected = $(".selected");
            $("li").removeClass("selected");
            if (selected.next().length === 0) {
                selected.siblings().first().addClass("selected");
            } else {
                selected.next().addClass("selected");
            }
        }
    });
    $("li").first().mouseover();
}

function buildRecentTicketsList(divName) {
    var msPeriod = 1000 * 60 * 60 * 24 * 14;
    var urlToTitle = {};
    chrome.history.search({ 'text': '', 'startTime': (new Date).getTime() - msPeriod },
        function (historyItems) {
            for (var i = 0; i < historyItems.length; i++) {
                var url = historyItems[i].url;
                if (url.toLowerCase().includes(ISC_THREAD_DETAILS_URL)) {
                    //if (url.toLowerCase().indexOf(ISC_THREAD_PARAMETER) > -1) {
                    //    var ticketId = url.substr(url.lastIndexOf(ISC_THREAD_PARAMETER) + ISC_THREAD_PARAMETER.length).toLowerCase();
                    //    url = "https://" + ISC_THREAD_DETAILS_URL + "/" + ticketId;
                    //}
                    url = GetNormalizedIscThreadDetailsUrl(url);
                    urlToTitle[url] = historyItems[i].title;
                }
            }
            buildPopupDom(divName, urlToTitle);
        }
    );
}
//function buildPopularHelpLinksList(divName) {
//    var msPeriod = 1000 * 60 * 60 * 24 * 30;
//    var urlToTitle = [];
//    chrome.history.search({ 'text': '', 'startTime': (new Date).getTime() - msPeriod },
//        function (historyItems) {
//            for (var i = 0; i < historyItems.length; i++) {
//                var url = historyItems[i].url;
//                if (url.toLowerCase().indexOf(DOCUMENTATION_URL) > -1) {
//                    urlToTitle.push({ url: url, title: historyItems[i].title, visitCount: historyItems[i].visitCount });
//                }
//            }
//            urlToTitle.sort(function (a, b) { return a.visitCount - b.visitCount });
//            buildPopupDom(divName, urlToTitle);
//        }
//    );
//}
document.addEventListener('DOMContentLoaded', function () {
    buildRecentTicketsList("tab-1");
    //buildPopularHelpLinksList("popularHelpLinks");
});
var app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue!'
    }
})