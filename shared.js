'use strict';
const ID_GET_OPTIONS = "getOptions";
const ID_VISITED_DOCS_CACHE = "visitedDocsCache";
const ID_ERROR = "error";
const ID_RECENT_TICKETS = "recentTickets";

//All URL must be in lower case and without schema(e.g., http), host (e.g., www).
const ISC_URL = "isc.devexpress.com";
const ISC_Thread_URL = ISC_URL + "/thread/";
const ISC_THREAD_DETAILS_URL = ISC_Thread_URL + "workplacedetails";
const ISC_THREAD_PARAMETER = "?id=";
const SC_PUBLIC = "devexpress.com/support/center/";
const SC_PUBLIC_QUESTION_URL = SC_PUBLIC + "question/details/";
const SC_PUBLIC_EXAMPLE_URL = SC_PUBLIC + "example/details/";
const SC_STATS_URL = "internal.devexpress.com/supportstat";
const DOCUMENTATION_URL = "documentation.devexpress.com";
const SEARCH_ENGINE_URL = "search.devexpress.com";
const DENNIS_BLOG_URL = "dennisgaravsky,blogspot.com";
const DENNIS_BLOG_SIGNATURE_HTML = "<br/><a href='http://dennisgaravsky.blogspot.com' data-mce-href='http://dennisgaravsky.blogspot.com'>News, tips, tricks and more about DevExpress Application Framework directly from the lab</a>";
const SEARCH_ENGINE_SUGGESTION_HTML = "<br/>In addition, please consider using <a href='https://search.devexpress.com/' data-mce-href='https://search.devexpress.com/'>our search engine</a> to quickly locate information in our online documentation and support database. I hope you find this tool helpful for the future as it can help you save your time and find answers faster than we do.";

function GetNormalizedIscThreadDetailsUrl(url) {
    var ticketId = null;
    url = url.toLowerCase();
    if (url.includes(ISC_THREAD_DETAILS_URL)) {
        if (url.includes(ISC_THREAD_PARAMETER)) {
            ticketId = url.substr(url.lastIndexOf(ISC_THREAD_PARAMETER) + ISC_THREAD_PARAMETER.length);
        } else {
            ticketId = url.substr(url.lastIndexOf("/") + 1);
        }
    } else {
        console.warn("A URL in the next format expected: " + ISC_THREAD_DETAILS_URL);
    }
    return GetNormalizedIscThreadDetailsUrlById(ticketId);
}
function GetNormalizedIscThreadDetailsUrlById(ticketId) {
    return "https://" + ISC_THREAD_DETAILS_URL + "/" + ticketId;
}
function safeAnchorClickHandler(e) {
    //Do not change to $(this).attr('href') because of http://stackoverflow.com/questions/6977049/this-href-vs-this-attrhref
    if (this.href) {
        e.preventDefault();
        chrome.runtime.sendMessage({ duplicateUrl: this.href, target: this.target });
    }
}
