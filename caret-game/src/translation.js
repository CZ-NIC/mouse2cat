let LANG = navigator.language === "cs" ? 1 : 0
const texts = {
    "header-title": ["Are you a text manipulation ace?", "Umíš zamachrovat s textem?"],
    "goal": ["🎯 Goal: Position the keyboard cursor (caret, pipe) to the highlighted position.", "🎯 Cíl: Umísti kurzor klávesnice (karet, blikající čárka) na vyznačenou pozici."],
    "keys": ["keys", "kláves"],
    "might be better": ["might be better", "mohlo být lepší"],
    "You used": ["You used", "Použils"],
    "Try again": ["Try again", "Zkusíš znovu"],
    "hint_word": ["⌨ You may need to add a word sometimes", "⌨ Možná budeš potřebovat připsat slovo"],
    "credits": ["The game was created alongside <a href='https://github.com/CZ-NIC/mouse2cat'>Leave the mouse to the cat</a> blog series of CZ.NIC.",
    "Hra vznikla v rámci série článků <a href='https://github.com/CZ-NIC/mouse2cat'>Myš je pro kočku</a> v CZ.NIC."]
}

function gettext(s) {
    console.log('12: texts[s]: ', texts[s], s, LANG);
    return texts[s][LANG]
}

// Translation
function refresh_translation() {
    $("[data-i18n-key]").each(function() {
        $(this).html(gettext($(this).attr("data-i18n-key")))
    })
}

$("#lang a").click(function() {
    LANG = $(this).data("lang")
    refresh_translation()
})