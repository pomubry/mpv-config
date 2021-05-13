"use strict";

//display chapter on osd and easily switch between chapters by click on title of chapter
mp.register_event("file-loaded", init);
mp.observe_property("chapter", "number", onChapterChange);
var options = {
  font_size: 20,
  font_color: "FFFFFF",
  border_size: 2.5,
  border_color: "000000",
  font_color_currentChapter: "8EC225",
};
var playinfo = {
  chapters: [], //array
  chaptercount: "", // int
  assinterface: [], //array(deprecated, use single assdraw instead)
  currentChapter: "", //int
  loaded: false,
};
var toggle_switch = false;
var assdraw = mp.create_osd_overlay();
var autohidedelay = mp.get_property_number("cursor-autohide");
//function
function init() {
  playinfo.chapters = getChapters();
  playinfo.chaptercount = playinfo.chapters.length;
  if (playinfo.chaptercount == 0) {
    return;
  }
  while (playinfo.chaptercount * options.font_size > 1000 / 1.5) {
    options.font_size = options.font_size - 1;
  }
  drawChapterList();
  mp.msg.info("init");
  playinfo.loaded = true;
}
function getChapters() {
  var chapterCount = mp.get_property("chapter-list/count");
  if (chapterCount === 0) {
    return ["null"];
  } else {
    var chaptersArray = [];
    for (var index = 0; index < chapterCount; index++) {
      var chapterTitle = mp.get_property_native(
        "chapter-list/" + index + "/title"
      );

      if (chapterTitle != undefined) {
        chaptersArray.push(chapterTitle);
      }
    }
    return chaptersArray;
  }
}

function drawChapterList() {
  var resY = 20;
  var resX = 20;
  assdraw.data = "";
  function setPos(str, _X, _Y) {
    str = str + "{\\pos(" + _X + ", " + _Y + ")}";
    return str;
  }
  function setborderSize(str) {
    str = str + "{\\bord" + options.border_size + "}";
    return str;
  }
  function setborderColor(str) {
    str = str + "{\\3c&H" + options.border_color + "&}";
    return str;
  }
  function setFontColor(str, index) {
    var _color;
    if (mp.get_property_native("chapter") == index - 1) {
      _color = options.font_color_currentChapter;
    } else {
      _color = options.font_color;
    }
    str = str + "{\\c&H" + _color + "&}";
    return str;
  }
  function setFont(str) {
    str = str + "{\\fs" + options.font_size + "}";
    return str;
  }
  function setEndofmodifiers(str) {
    str = str + "{\\p0}";
    return str;
  }
  function setEndofLine(str) {
    str = str + "\n";
    return str;
  }

  playinfo.chapters.forEach(function (element, index) {
    assdraw.data = setPos(assdraw.data, resX, resY);
    assdraw.data = setborderSize(assdraw.data);
    assdraw.data = setborderColor(assdraw.data);
    assdraw.data = setFontColor(assdraw.data, index);
    assdraw.data = setFont(assdraw.data);
    assdraw.data = setEndofmodifiers(assdraw.data);
    assdraw.data = assdraw.data + element;
    assdraw.data = setEndofLine(assdraw.data);
    resY += options.font_size;
  });
  mp.con;
}

function toggleOverlay() {
  if (!playinfo.loaded) {
    return;
  }
  if (!toggle_switch) {
    drawChapterList();
    assdraw.update();
    mp.set_property("cursor-autohide", "no");
    toggle_switch = !toggle_switch;
  } else {
    assdraw.remove();
    mp.set_property("cursor-autohide", autohidedelay);
    toggle_switch = !toggle_switch;
  }
}

function onChapterChange() {
  playinfo.currentChapter = mp.get_property_native("chapter");
  if (playinfo.currentChapter != undefined) {
    drawChapterList();
  }

  if ((playinfo.currentChapter != undefined) & toggle_switch) {
    assdraw.update();
  }
  var firstStr = playinfo.chapters[0];
  var myStr = "Chapter [" + (playinfo.currentChapter + 1) + "/";
  var myRegex = /Chapter \[\d+\/\d+\]:/;
  if (!myRegex.test(firstStr)) {
    playinfo.chapters.unshift(myStr + playinfo.chapters.length + "]:");
  } else {
    playinfo.chapters[0] = myStr + (playinfo.chapters.length - 1) + "]:";
  }
  toggleOverlay();
  toggleOverlay();
}
function pos2chapter(x, y, overallscale) {
  x -= 20;
  y -= 40;
  var vectical = y / (options.font_size * overallscale);
  if (vectical > playinfo.chaptercount) {
    return null;
  }

  var intVectical = Math.floor(vectical);
  if (intVectical < 0) {
    return null;
  }

  var lengthofTitleClicked = playinfo.chapters[intVectical].length;
  var lengthofTitleClicked_px =
    (lengthofTitleClicked * options.font_size) / overallscale;
  if (x < lengthofTitleClicked_px) {
    return intVectical;
  } else {
    return null;
  }
}
function getOverallScale() {
  return mp.get_osd_size().height / 720;
}
function onMBTN_LEFT() {
  //get mouse position
  if (!playinfo.loaded) {
    return;
  }
  if (toggle_switch) {
    var overallscale = getOverallScale();
    var pos = mp.get_mouse_pos();
    var chapterClicked = pos2chapter(pos.x, pos.y, overallscale);
    if (chapterClicked != null) {
      mp.set_property_native("chapter", chapterClicked);
    }
  }
}
mp.add_key_binding("TAB", "tab", function () {
  toggleOverlay();
});
mp.add_key_binding("MBTN_LEFT", "mbtn_left", function () {
  onMBTN_LEFT();
});
