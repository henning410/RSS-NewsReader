/**
 * Created by magaert on 08.02.2017.
 * 2018-04-25 adjust URL RSS feed after Relaunch FM
 */
/**
 * List of all feeds to use
 */
var feeds = [
    {
        id: 'it-board',
        url: 'https://intranetportal.hs-esslingen.de/it-board?type=9818',
        dataType: 'jsonp',
        displayName: 'IT-Board',
        handler: loadXML
    },
    {
        id: 'it-news',
        url: 'https://intranetportal.hs-esslingen.de/index.php?id=93908&type=101',
        dataType: 'jsonp',
        displayName: 'IT-News',
        handler: loadJSONP
    },
    {
        id: 'hs-news',
        url: 'https://intranetportal.hs-esslingen.de/index.php?id=92976&type=101',
        dataType: 'jsonp',
        displayName: 'HS-News',
        handler: loadJSONP
    },
    {
        id: 'rz-news',
        url: 'https://intranetportal.hs-esslingen.de/index.php?id=93895&type=101',
        dataType: 'jsonp',
        displayName: 'RZ-News',
        handler: loadJSONP
    },
    {
        id: 'rz-motd',
        url: 'https://www3.hs-esslingen.de/rz/feed/rss-motd.php',
        dataType: 'xml',
        displayName: 'RZ-motd',
        handler: loadXML
    }
];

/** necessary to prevent "TypeError: JSONPCallback is not a function" when using JSONPCallback in
 * JQuery.ajax with given done()/success() function and no implementation in order to use context
 */
var JSONPCallback = function (){};


/**
 * Fixes javascript encoded mailTo links in feed entry content
 * @param $content feed entry content
 */
function sanitizeMailTo( $content ){
    $content.find('a').each(function(index, element){
        var $element = $(element);
        if( ~ $element.attr('href').indexOf('UnCryptMailto') ) {
            $element.replaceWith($element.text());
        }
    });
}

/**
 * Fix relative links used in feed entry for downloadable files and images
 * @param $content feed entry content
 */
function fixDownloadsAndImages($content ){
    $content.find('a').each(function(index, element){
       var $element = $(element);
       if( $element.attr('href').indexOf('fileadmin') == 0 ) {
           $element.attr('href', 'http://intranetportal.hs-esslingen.de/' + $element.attr('href') );
       }
    });

    $content.find('img').each(function(index, element){
        var $element = $(element);
        if( ~$element.attr('src').indexOf('..') ){
            // relativer Pfad, falls kein fileadmin zu finden ist, einfach wegwerfen, da der pfad schwer zu erraten ist
            var $fileadminIndex = $element.attr('src').indexOf('fileadmin');

            if( ~$fileadminIndex ) {
                $element.attr('src', 'http://intranetportal.hs-esslingen.de/' + $element.attr('src').substr($fileadminIndex));
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
function fixHeader( $content ){
    $content.find('h1, h2, h3, h4, h5, h6').each(function( index, element ){
        $(element).replaceWith('<br/><br/><strong>' + $(element).text() + '</strong><br/><br/>');
    });
}

/**
 *  Creates a short excerpt of the given entry content and prepends it
 * @param $content feed entry content
 */
function createShortExcerpt( $content ){

}

/**
 * Fills out a template for a feed entry with the given entry data
 * @param template the template for a feed entry
 * @param entry content data for a feed entry
 * @returns {*} cloned template with filled in feed data
 */
function fillEntry( template, entry ){
    var clone = template.clone();
    clone.removeClass('template');

    var date = new Date(entry.pubDate);

    clone.find('.entry-title').text(entry.title);
    clone.find('.entry-url').attr('href', entry.link);
    clone.find('.entry-date').text(date.toLocaleString());

    var entryContent = clone.find('.entry-content');
    entryContent.html(entry.description);
    fixHeader(entryContent);
    sanitizeMailTo(entryContent);
    fixDownloadsAndImages(entryContent);
    createShortExcerpt(entryContent);

    return clone;
}

/**
 *
 * @param feed
 * @param entries
 */
function updateFeed( feed, entries ){
    // remove all existing feed items
    feed.children('.entry').not('.template').remove();

    var template = feed.find('div.entry.template');

    $.each(entries, function (index, entry) {
        var clone = fillEntry(template, entry);
        clone.appendTo(feed);
    });
}

function loadJSONP(feedData){
    $.ajax({
        type: "GET",
        url: feedData.url,
        crossDomain: true,
        jsonp: false,
        jsonpCallback: "JSONPCallback",
        contentType: "application/json; charset=utf-8",
        dataType: "jsonp"
    }).done(function(json){
        console.log(feedData.url);
        console.log(json);

        if (!json.hasOwnProperty('rss') || !json['rss'].hasOwnProperty('channel')) {
            throw Error("Malformed JSON feed!");
        }

        var channel = json['rss']['channel'];
        var items = [];

        $.each(channel.items, function (index, content) {
            if (!content.hasOwnProperty('title')) {
                return;
            }
            items.push(content);
        });

        updateFeed($('#news'), items);
    });
}

function loadXML(feedData) {
    $.ajax({
        type: "GET",
        url: feedData.url,
        dataType: "xml"
    }).done(function(response){
        console.log(response);

        var xml = $(response);
        var channel = xml.find('channel');
        var items = [];
        channel.children('item').each(function(index, element){
            var item = {
                title: $(element).find('title').text(),
                link: $(element).find('link').text(),
                pubDate: $(element).find('pubDate').text(),
                description: $(element).find('link').siblings(':last').text(),
                //description: $(element).after('description'),
            };
            console.log(item);
            items.push(item);
        });

        updateFeed($('#news'), items);
    });
}


$(document).ready(function(){
    console.log('Loaded');
    var news = $('#news');
    var navbar = $('.navbar-collapse');
    var feedLinks = $('#feed-links');

    $.each(feeds, function( index, feed ){
        var feedHTML = $('<li><a href="#"></a></li>');
        var feedLink = feedHTML.find('a');

        feedLink.text(feed['displayName']);
        feedLink.click(feed, function( event ){
            feed.handler(event.data);

            var element = $(this);
            // set as active, every other list element as inactive
            element.parent('li').addClass('active').siblings('li').removeClass('active');
            navbar.collapse('hide');
        });

        feedLinks.append(feedHTML);
    });

    feedLinks.find('a').first().click();
});
