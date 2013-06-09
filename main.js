/// <reference path="jquery-2.0.1.min.js" />

var msie = /*@cc_on!@*/0;

var lastSelected, selectedItems;

function deleteSelect() {
    var nowplaying = player.attr("src");
    playlist.find("tr.info:not(.hide)").each(function () {
        var $this = $(this);
        if ($this.data("url") == nowplaying)
            player.attr("src", "");
        knownFiles.splice(knownFiles.indexOf($this.data("filename")), 1);
        $this.remove();
    });
    playlistChanged();
    lastSelected = null;
}

function playlistChanged() {
    if (knownFiles.length == 0) {
        importButton.appendTo(guidePanel);
        guidePanel.show();

        previousButton.addClass("disabled");
        nextButton.addClass("disabled");
        playButton.addClass("disabled");
    }
    else {
        importButton.appendTo($("header"));
        guidePanel.hide();

        previousButton.removeClass("disabled");
        nextButton.removeClass("disabled");
        playButton.removeClass("disabled");
    }
}

var contextmenu = $("#contextmenu").hide();
var menuitems = contextmenu.children();
menuitems.eq(0).click(function () {
    contextmenu.hide();
    playlist.find("tr.info:not(.hide)").first().dblclick();
});
menuitems.eq(1).click(function () {
    contextmenu.hide();
    deleteSelect();
});
menuitems.eq(2).click(function () {
    contextmenu.hide();
    // TODO: Show detail dialog.
});

$(document).click(function (e) {
    if (contextmenu.find(e.target).length == 0)
        contextmenu.hide();
});

var knownFiles = [];

var playlist = $("#playlist"), nullTr = $("#nullTr");

$("#main-section").on("dragenter", function (e) {
    var dataTransfer = e.originalEvent.dataTransfer;

    if (selectedItems) {
        e.preventDefault();
        dataTransfer.dropEffect = "move";
        nullTr.css("border-top", "solid 2px gray");
    }
    else if (dataTransfer.types.contains("Files")) {
        e.preventDefault();
        dataTransfer.dropEffect = "copy";
        nullTr.css("border-top", "solid 2px gray");
    }
}).on("dragover", function (e) {
    var dataTransfer = e.originalEvent.dataTransfer;

    if (selectedItems) {
        e.preventDefault();
        dataTransfer.dropEffect = "move";
        nullTr.css("border-top", "solid 2px gray");
    }
    else if (dataTransfer.types.contains("Files")) {
        e.preventDefault();
        dataTransfer.dropEffect = "copy";
        nullTr.css("border-top", "solid 2px gray");
    }
}).on("dragleave", function (e) {
    nullTr.css("border-top", "none");
}).on("drop", function (e) {
    var dataTransfer = e.originalEvent.dataTransfer;

    if (selectedItems) {
        e.preventDefault();
        selectedItems.insertBefore(nullTr);
        selectedItems = null;
        nullTr.css("border-top", "none");
    }
    else if (dataTransfer.types.contains("Files")) {
        e.preventDefault();
        loadFiles(dataTransfer.files, nullTr);
        nullTr.css("border-top", "none");
    }
});

function loadFiles(files, insertPoint) {
    var i = 0;
    var file, filename, blobUrl;
    var empty = knownFiles.length == 0;
    var audioLoader = $('<audio preload="metadata" />').on("loadedmetadata", function () {
        var duration = audioLoader.prop("duration");
        var second = (duration % 60).toFixed();
        if (second < 10)
            second = "0" + second;
        durationText = (duration > 3600 ? parseInt(duration / 3600) + ":" : "") +
            (duration > 60 ? parseInt(duration / 60) : "0") + ":" + second;
        readFile(file, function (tag) {
            var title = tag["frames"]["TIT2"] ? tag["frames"]["TIT2"]["value"] : filename.substr(0, filename.length - 4);
            album = tag["frames"]["TALB"] ? tag["frames"]["TALB"]["value"] : "<Unknown>",
            artist = tag["frames"]["TPE1"] ? tag["frames"]["TPE1"]["value"] : "<Unknown>",
            genre = tag["frames"]["TCON"] ? tag["frames"]["TCON"]["value"] : "<Unknown>";
            var item = $("<tr />", { "draggable": "true" }).data({
                "url": blobUrl,
                "filename": filename,
                "title": title,
                "album": album,
                "artist": artist,
                "genre": genre
            }).click(function (e) {
                if (e.ctrlKey)
                    item.toggleClass("info");
                else {
                    $("tr.info").removeClass("info");
                    item.addClass("info");
                }
                if (e.shiftKey) {
                    var songItems = playlist.find("tr:not(.hide)");
                    var startIndex = lastSelected ? songItems.index(lastSelected) : 0,
                        endIndex = songItems.index(this);
                    if (startIndex > endIndex) {
                        var temp = startIndex;
                        startIndex = endIndex;
                        endIndex = temp + 1;
                    }
                    else
                        endIndex++;
                    songItems.slice(startIndex, endIndex).addClass("info");
                }
                else
                    lastSelected = this;
            }).dblclick(function () {
                player.on("playing", function seek() {
                    this.currentTime = 3;
                    this.currentTime = 0;
                    $(this).off("playing", seek);
                }).attr("src", item.data("url"))[0].play();
                $("tr.success").removeClass("success").find("i").removeClass("icon-pause").removeClass("icon-play");
                item.addClass("success");
                nowPlaying = item;
            }).on("contextmenu", function (e) {
                e.preventDefault();
                if (!item.hasClass("info"))
                    item.click();
                var width = contextmenu.width(), height = contextmenu.height();
                contextmenu.css({
                    "left": Math.max(0, Math.min(e.clientX, innerWidth - width)) + "px",
                    "top": Math.max(0, Math.min(e.clientY, innerHeight - height)) + "px"
                }).show();
            }).on("dragstart", function (e) {
                var dataTransfer = e.originalEvent.dataTransfer;

                dataTransfer.effectAllowed = "move";
                dataTransfer.dropEffect = "move";

                if (!item.hasClass("info"))
                    item.click();

                selectedItems = playlist.find("tr.info:not(.hide)");

                var titles = "";
                selectedItems.each(function () {
                    titles += $(this).data("title") + "\r\n";
                });
                if (msie)
                    dataTransfer.setData("Text", titles);
                else
                    dataTransfer.setData("text/plain", titles);
            }).on("dragenter", function (e) {
                var dataTransfer = e.originalEvent.dataTransfer;

                if (selectedItems) {
                    e.preventDefault();
                    e.stopPropagation();
                    dataTransfer.dropEffect = "move";
                    item.css("border-top", "solid 2px gray");
                }
                else if (dataTransfer.types.contains("Files")) {
                    e.preventDefault();
                    e.stopPropagation();
                    dataTransfer.dropEffect = "copy";
                    item.css("border-top", "solid 2px gray");
                }
            }).on("dragover", function (e) {
                var dataTransfer = e.originalEvent.dataTransfer;

                if (selectedItems) {
                    e.preventDefault();
                    e.stopPropagation();
                    playlist.on("dragleave");
                    dataTransfer.dropEffect = "move";
                    item.css("border-top", "solid 2px gray");
                }
                else if (dataTransfer.types.contains("Files")) {
                    e.preventDefault();
                    e.stopPropagation();
                    playlist.on("dragleave");
                    dataTransfer.dropEffect = "copy";
                    item.css("border-top", "solid 2px gray");
                }
            }).on("dragleave", function (e) {
                playlist.on("dragenter", e);
                item.css("border-top", "none");
            }).on("drop", function (e) {
                var dataTransfer = e.originalEvent.dataTransfer;

                if (selectedItems) {
                    e.preventDefault();
                    e.stopPropagation();
                    selectedItems.insertBefore(this);
                    selectedItems = null;
                    item.css("border-top", "none");
                }
                else if (dataTransfer.types.contains("Files")) {
                    e.preventDefault();
                    e.stopPropagation();
                    loadFiles(dataTransfer.files, this);
                    item.css("border-top", "none");
                }
            }).append($("<td />").append($("<i />")))
              .append($("<td />").text(title))
              .append($("<td />").text(album))
              .append($("<td />").text(durationText))
              .append($("<td />").text(artist))
              .append($("<td />").text(genre))
            item.insertBefore(insertPoint);
            loadSong();
        });
    });
    function loadSong() {
        if (i < files.length) {
            file = files[i++];
            filename = file.name;
            if (knownFiles.indexOf(filename) == -1 &&
                (filename.indexOf(".mp3") == filename.length - 4 && mp3) ||
                ((filename.indexOf(".ogg") == filename.length - 4 ||
                filename.indexOf(".oga") == filename.length - 4) && ogg)) {
                knownFiles.push(filename);
                if (empty)
                    playlistChanged();
                blobUrl = URL.createObjectURL(file);
                audioLoader.attr("src", blobUrl);
            }
            else
                loadSong();
        }
    }
    loadSong();
    filter.keyup();
}

var shuffle = false, loop = 0, playing = false, nowPlaying = null;

var player = $("<audio />").on("playing", function () {
    playlist.find("tr.success i").removeClass("icon-pause").addClass("icon-play");
    playing = true;
    playButton.removeClass("play").addClass("pause");
    sliderThumb.show();
}).on("pause", function () {
    playlist.find("tr.success i").removeClass("icon-play").addClass("icon-pause");
    playing = false;
    playButton.removeClass("pause").addClass("play");
}).on("ended", function () {
    playing = false;
    playButton.removeClass("pause").addClass("play");
    playlist.find("tr.success i").removeClass("icon-play");
    sliderThumb.hide();
    player.attr("src", "");
    if (loop == 1)
        nowPlaying.dblclick();
    if (loop == 2)
        nextButton.click();
}).on("timeupdate", function () {
    if (!dragging) {
        var percent = player.prop("currentTime") / player.prop("duration") * 100 + "%";
        sliderThumb.css("margin-left", percent);
        $("#slider-foreground").css("width", percent);
    }
}), mp3 = player[0].canPlayType("audio/mpeg") == "maybe",
ogg = player[0].canPlayType("audio/ogg") == "maybe",
fileSelector = $("#file").change(function () {
    loadFiles(this.files, nullTr);
});

var dragging = false;
$("#progress-wrapper").mousedown(function (e) {
    if (player.attr("src"))
        player.prop("currentTime", e.pageX / innerWidth * player.prop("duration"));
});
var sliderThumb = $("#slider-thumb").mousedown(function (e) {
    e.stopPropagation();
    dragging = true;
    function moveSlider(e) {
        var percent = e.pageX / innerWidth * 100 + "%";
        sliderThumb.css("margin-left", percent);
        $("#slider-foreground").css("width", percent);
    }
    $(document).css("cursor", "pointer").mousemove(moveSlider).mouseup(function releaseMouse(e) {
        dragging = false;
        player.prop("currentTime", e.pageX / innerWidth * player.prop("duration"));
        $(this).css("cursor", "default").off("mousemove", moveSlider).off("mouseup", releaseMouse);
    });
}).hide();
var loopButton = $("#control-loop").click(function () {
    switch (loop) {
        case 0:
            loopButton.removeClass("no-repeat").addClass("list-repeat");
            loop = 1;
            break;
        case 1:
            loopButton.removeClass("list-repeat").addClass("single-repeat");
            loop = 2;
            break;
        case 2:
            loopButton.removeClass("single-repeat").addClass("no-repeat");
            loop = 0;
            break;
    }
});
var shuffleButton = $("#control-shuffle").click(function () {
    if (shuffle)
        shuffleButton.removeClass("shuffle").addClass("no-shuffle");
    else
        shuffleButton.removeClass("no-shuffle").addClass("shuffle");
    shuffle = !shuffle;
});
var previousButton = $("#control-previous").click(function () {
    if (!previousButton.hasClass("disabled")) {
        var songItems = playlist.children();
        var next;
        if (shuffle)
            next = songItems.eq(parseInt(Math.random() * (songItems.length - 2)));
        else {
            var now = songItems.index(nowPlaying);
            if (now > 0)
                now--;
            else
                now = songItems.length - 2;
            next = songItems.eq(now);
        }
        next.dblclick();
    }
});
var nextButton = $("#control-next").click(function () {
    if (!nextButton.hasClass("disabled")) {
        var songItems = playlist.children();
        var next;
        if (shuffle)
            next = songItems.eq(parseInt(Math.random() * (songItems.length - 2)));
        else {
            var now = songItems.index(nowPlaying);
            if (now < songItems.length - 2)
                next = songItems.eq(++now);
            else
                next = songItems.first();
        }
        next.dblclick();
    }
});
var playButton = $("#control-play").click(function () {
    if (!playButton.hasClass("disabled")) {
        if (playing)
            player[0].pause();
        else {
            if (player.attr("src"))
                player[0].play();
            else
                playlist.children().first().dblclick();
        }
    }
});

var guidePanel = $("#guide");
var importButton = $("#import").click(function () {
    fileSelector.click();
});

var filter = $("#filter"),
    clear = $("#clear");
filter.keydown(function (e) {
    e.stopPropagation();
}).keyup(function (e) {
    e.stopPropagation();
    var value = filter.val();
    if (value == "") {
        clear.hide();
        playlist.children().removeClass("hide").last().addClass("hide");
    }
    else {
        clear.show();
        var regex = new RegExp(value, "i");
        playlist.children().each(function () {
            var ele = $(this);
            if (ele.text().match(regex))
                ele.removeClass("hide");
            else
                ele.addClass("hide");
        });
    }
}).on("paste", function (e) {
    setTimeout(function () {
        filter.keyup();
    }, 100);
});
clear.click(function (e) {
    filter.val("").keyup().focus();
});

$(document).keydown(function (e) {
    console.log(e.keyCode);
    if (e.ctrlKey && e.keyCode == 65) { // Ctrl + A
        e.preventDefault();
        playlist.find("tr:not(.hide)").addClass("info");
    }
    else if (e.keyCode == 46) // Delete
        deleteSelect();
    else
        filter.keydown(e).keyup(e);
});