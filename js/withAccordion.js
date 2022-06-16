/**
 * Created by magaert on 08.02.2017.
 * 2018-04-25 adjust URL RSS feed after Relaunch FM
 *
 * Updated by heweit00
 * adjustment to work with new intranet-structure.
 * deleted old, unnecessary content
 */

$(document).ready(function () {
    console.log("Page loaded");
    const RSS_URL = `https://intranetportal.hs-esslingen.de/it-board?type=9818`;
    loadRSS(RSS_URL);
    /* Check if current color theme is already stored in local Storage.
    * If not, we set the darkmode to false and store it in local Storage.
    * If darkmode exists in local storage, we check if its true to load darkmode css
    */
    if (localStorage.getItem('darkmode') === null) {
        localStorage.setItem('darkmode', 'false');
    } else if (localStorage.getItem('darkmode') === "true") {
        loadDarkmode();
    }
});

/*
* function to initialize google translation
*/
function googleTranslateElementInit() {
    new google.translate.TranslateElement(
        {
            pageLanguage: 'de',
            includedLanguages: 'de,en,fr,it,es'
        },
        'google_translate_element'
    );
}

/**
 * making ajax reqeust on specific url and load rss content into html by calling updateFeed() method
 * @param url
 */
function loadRSS(url) {
    const items = [];
    $.get({
        url: url,
        dataType: "xml",
    }, function (data) {
        $("#loading").text(""); //delete loading message
        const xml = $(data);
        const channel = xml.find("channel");
        channel.children("item").each(function (index, element) {
            const item = {
                title: $(element).find("title").text(),
                link: $(element).find("link").text(),
                pubDate: $(element).find("pubDate").text(),
                description: $(element).find("description").next().text(),
            };
            items.push(item);
        });
        updateFeed($("#accordion"), items);
    }).fail(function () {
        loadErrorMessage();
    });
}

function loadErrorMessage() {
    $("#loading").text(""); //delete loading message
    var errorMessage = $("<p></p>").text("Data could not be loaded");
    errorMessage.addClass("bg-danger");
    $("#accordion").append(errorMessage)
}

/**
 * @param feed
 * @param entries
 */
function updateFeed(feed, entries) {
    // remove all existing feed items
    feed.children(".entry").not(".template").remove();
    var template = feed.find("div.entry.template");

    $.each(entries, function (index, entry) {
        var clone = fillEntry(template, entry, index);
        clone.appendTo(feed);
    });
}

/**
 * Fills out a template for a feed entry with the given entry data
 * @param template the template for a feed entry
 * @param entry content data for a feed entry
 * @param index
 * @returns {*} cloned template with filled in feed data
 */
function fillEntry(template, entry, index) {
    var clone = template.clone();
    clone.removeClass("template");
    var date = new Date(entry.pubDate);
    clone.find(".panel-heading").attr("id", "heading" + index);
    clone.find(".header").attr("href", "#collapse" + index);
    clone.find(".header").attr("aria-controls", "collapse" + index);
    clone.find(".panel-collapse").attr("id", "collapse" + index);
    clone.find(".panel-collapse").attr("aria-labelledby", "heading" + index);
    clone.find(".entry-title").text(entry.title);
    /*clone.find(".entry-url").attr("href", entry.link);*/
    clone.find(".entry-date").text(date.toLocaleString());
    var entryContent = clone.find(".entry-content");
    entryContent.html(entry.description);

    fixHeader(entryContent);
    sanitizeMailTo(entryContent);
    fixDownloadsAndImages(entryContent);
    createShortExcerpt(entryContent);

    return clone;
}

/**
 * Fix headlines used in feed entry content
 * @param $content feed entry content
 */
function fixHeader($content) {
    $content.find("h1, h2, h3, h4, h5, h6").each(function (index, element) {
        $(element).replaceWith("<br/><br/><strong>" + $(element).text() + "</strong><br/><br/>");
    });
}

/**
 * Fixes javascript encoded mailTo links in feed entry content
 * @param $content feed entry content
 */
function sanitizeMailTo($content) {
    $content.find("a").each(function (index, element) {
        var $element = $(element);
        if (~$element.attr("href").indexOf("UnCryptMailto")) {
            $element.replaceWith($element.text());
        }
    });
}

/**
 * Fix relative links used in feed entry for downloadable files and images
 * @param $content feed entry content
 */
function fixDownloadsAndImages($content) {
    $content.find("a").each(function (index, element) {
        var $element = $(element);
        if ($element.attr("href").indexOf("fileadmin") == 0) {
            $element.attr("href", "http://intranetportal.hs-esslingen.de/" + $element.attr("href"));
        }
    });
    $content.find("img").each(function (index, element) {
        var $element = $(element);
        if (~$element.attr("src").indexOf("..")) {
            // relativer Pfad, falls kein fileadmin zu finden ist, einfach wegwerfen, da der pfad schwer zu erraten ist
            var $fileadminIndex = $element.attr("src").indexOf("fileadmin");

            if (~$fileadminIndex) {
                $element.attr("src", "http://intranetportal.hs-esslingen.de/" + $element.attr("src").substr($fileadminIndex));
            } else {
                $element.remove();
            }
        }
    });
}

/**
 *  Creates a short excerpt of the given entry content and prepends it
 * @param $content feed entry content
 */
function createShortExcerpt($content) {
}

/*
* Click-event on button to switch current color mode.
* After switching update current state in localStorage
*/
$("#saveButton").click(function () {
    // checking if state of switch is different from current state
    if (localStorage.getItem('darkmode') !== String($("input[type='checkbox']").is(":checked"))) {
        // checking if darkmode was activated or disabled
        if ($("input[type='checkbox']").is(":checked")) {
            localStorage.setItem('darkmode', 'true');
            loadDarkmode();
        } else {
            localStorage.setItem('darkmode', 'false');
            clearDarkmode();
        }
    }
});

$("#closeButton").click(function () {
    if (localStorage.getItem('darkmode') === 'false') {
        $("input[type='checkbox']").prop('checked', false);
    } else {
        $("input[type='checkbox']").prop('checked', true);
    }
});

function clearDarkmode() {
    $("body").css("background-color", "#1B2845");
    $(".navbar-default").removeClass("navbar-darkmode");
    $(".panel-heading").removeClass("panel-darkmode");
    $(".panel-body").removeClass("panel-darkmode");
    $(".modal-content").removeClass("modal-darkmode");
    $(".modalbutton").removeClass("modalbutton-darkmode");
    localStorage.setItem('darkmode', 'false');
}

function loadDarkmode() {
    $("input[type='checkbox']").prop('checked', true);
    $("body").css("background-color", "#1E1E1E");
    $(".navbar-default").addClass("navbar-darkmode");
    $(".panel-heading").addClass("panel-darkmode");
    $(".panel-body").addClass("panel-darkmode");
    $(".modal-content").addClass("modal-darkmode");
    $(".modalbutton").addClass("modalbutton-darkmode");
}
