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
    loadRSS(RSS_URL)
});

/**
 * making ajax reqeust on specific url and load rss content into html by calling updateFeed() method
 * @param url
 */
function loadRSS(url) {
    const items = [];
    $.get({
        url: url,
        dataType: "xml",
    }, function(data) {
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
        /*console.log(items);*/
        updateFeed($("#news"), items);
    }).fail(function() {
        $("#loading").text(""); //delete loading message
        var errorMessage = $("<p></p>").text("Data could not be loaded");
        errorMessage.addClass("bg-danger");
        $("#news").append(errorMessage)
    });
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
        var clone = fillEntry(template, entry);
        clone.appendTo(feed);
    });
}

/**
 * Fills out a template for a feed entry with the given entry data
 * @param template the template for a feed entry
 * @param entry content data for a feed entry
 * @returns {*} cloned template with filled in feed data
 */
function fillEntry(template, entry) {
    var clone = template.clone();
    clone.removeClass("template");
    var date = new Date(entry.pubDate);
    clone.find(".entry-title").text(entry.title);
    clone.find(".entry-url").attr("href", entry.link);
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
 * Fix headlines used in feed entry content
 * @param $content feed entry content
 */
function fixHeader($content) {
    $content.find("h1, h2, h3, h4, h5, h6").each(function (index, element) {
        $(element).replaceWith("<br/><br/><strong>" + $(element).text() + "</strong><br/><br/>");
    });
}

/**
 *  Creates a short excerpt of the given entry content and prepends it
 * @param $content feed entry content
 */
function createShortExcerpt($content) {}
