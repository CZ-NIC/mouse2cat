// extend common functions
/**
 * Select range in an <input> or a <textarea>
 * https://stackoverflow.com/a/841121/2036148
 * @param start
 * @param end
 * @returns {*}
 */
$.fn.selectRange = function(start, end) {
    if (end === undefined) {
        end = start
    }
    return this.each(function() {
        if ('selectionStart' in this) {
            this.selectionStart = start
            this.selectionEnd = end
        } else if (this.setSelectionRange) {
            this.setSelectionRange(start, end)
        } else if (this.createTextRange) {
            const range = this.createTextRange()
            range.collapse(true)
            range.moveEnd('character', end)
            range.moveStart('character', start)
            range.select()
        }
    })
}

/**
 * Are elements of the arrays equal?
 * https://stackoverflow.com/a/39967517/2036148
 * @param a {Array}
 * @param b {Array}
 * @returns {Boolean}
 */
function arraysEqual(a, b) {
    return a.length === b.length && a.every((el, ix) => el === b[ix])
}

/**
 * Remove the animation when finished, official docs https://animate.style/#javascript
 * @param {jQuery} element
 * @param animation
 * @param {number} duration Seconds
 * @param prefix
 * @returns {Promise<unknown>}
 */
const animateCSS = ($element, animation, duration = null, prefix = 'animate__') => new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    const node = $element[0];
    if (duration) {
        node.style.setProperty('--animate-duration', duration + "s")
    }

    node.classList.add(`${prefix}animated`, animationName);

    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd(event) {
        event.stopPropagation();
        node.classList.remove(`${prefix}animated`, animationName);
        node.style.removeProperty("--animate-duration")
        resolve()
    }

    node.addEventListener('animationend', handleAnimationEnd, {once: true});
})

// Exercises definition
const $exercises = $("#exercises");
[
    new Exercise("input", [6, 6], [8, 8], ["🡺", "🡺"], 500, "Lorem ipsum dolor sit amet.", null),
    new Exercise("input", [6, 6], [11, 11], ["Ctrl+🡺"], 0, "Lorem ipsum dolor sit amet.", null),
    new Exercise("input", [0, 0], [17, 17], ["Ctrl+🡺", "Ctrl+🡺", "Ctrl+🡺"], 614, "Lorem ipsum dolor sit amet.", null),
    new Exercise("input", [6, 6], [16, 16], ["Ctrl+🡺", "Ctrl+🡺", "🡸"], 855, "Lorem ipsum dolor sit amet.", null),
    new Exercise("input", [17, 17], [0, 0], ["Home"], 0, "Pack my box with five dozen liquor jugs.", null),
    "<div class='alert alert-primary' data-i18n-key='hint_word'>⌨ You may need to add a word sometimes</div>",
    new Exercise("input", [21, 21], [12, 12], ["Ctrl+🡸", "Ctrl+🡸", "Ctrl+🡸", "b", "i", "g", "Space"], 2448, "Pack my box with five dozen liquor jugs.", "Pack my big box with five dozen liquor jugs."),
    new Exercise("input", [7, 7], [7, 8], ["Shift+🡺"], 0, "Příliš žluťoučký kůň úpěl ďábelské ódy.", null),
    new Exercise("input", [7, 7], [29, 29], ["Ctrl+🡺", "Ctrl+🡺", "Ctrl+🡺", "Space", "m", "o", "c"], 2408, "Příliš žluťoučký kůň úpěl ďábelské ódy.", "Příliš žluťoučký kůň úpěl moc ďábelské ódy."),
    new Exercise("input", [7, 7], [21, 27], ["Ctrl+🡺", "Ctrl+🡺", "🡺", "z", "a", "Ctrl+🡸", "Ctrl+Shift+🡺"], 3119, "Příliš žluťoučký kůň úpěl ďábelské ódy.", "Příliš žluťoučký kůň zaúpěl ďábelské ódy."),
    new Exercise("input", [8, 8], [8, 37], ["Shift+End"], 0, "Høj bly gom vandt fræk sexquiz på wc.", null),
    new Exercise("input", [8, 8], [8, 17], ["Ctrl+Shift+🡺", "Ctrl+Shift+🡺"], 367, "Høj bly gom vandt fræk sexquiz på wc.", null),
    new Exercise("input", [8, 8], [12, 16], ["🡺", "🡺", "🡺", "🡺", "Shift+🡺", "Shift+🡺", "Shift+🡺", "Shift+🡺"], 1848, "Törkylempijävongahdus.", null),
    new Exercise("input", [16, 16], [0, 46], ["Ctrl+a"], 0, "Portez ce vieux whisky au juge blond qui fume.", null),
    new Exercise("input", [46, 46], [10, 10], ["Home", "Ctrl+🡺", "Ctrl+🡺", "Ctrl+Shift+🡺", "Delete", "🡺"], 2368, "Portez ce vieux whisky au juge blond qui fume.", "Portez ce whisky au juge blond qui fume."),
    new Exercise("input", [10, 10], [46, 46], ["End", "Shift+🡸", "!"], 3000, "Portez ce vieux whisky au juge blond qui fume.", "Portez ce vieux whisky au juge blond qui fume!"),
    new Exercise("input", [0, 0], [31, 31], ["Ctrl+🡺", "Ctrl+Shift+🡺", "Shift+Delete", "End", "🡸", "Ctrl+v"], 2500, "Pranzo sghembi d'acqua fa volti.", "Pranzo d'acqua fa volti sghembi."),
    new Exercise("input", [31, 31], [5, 6], ["Home", "Ctrl+🡺", "Shift+🡸"], 974, "Pranzo d'acqua fa volti sghembi.", null),
    new Exercise("input", [18, 18], [43, 43], ["Shift+Home", "Ctrl+Shift+🡺", "Shift+Delete", "End", "🡸", "Shift+Insert"], 2240, "Stróż vel fax myjń pchnął kość w quiz gędźb.", "Stróż pchnął kość w quiz gędźb vel fax myjń."),
    new Exercise("input", [19, 19], [39, 39], ["Ctrl+Shift+🡸", "Ctrl+x", "Delete", "End", "Ctrl+Backspace", "Ctrl+v"], 3000, "Pójdźże, kiń flaszy tę chmurność w głąb głąb", "Pójdźże, kiń tę chmurność w głąb flaszy"),
    new Exercise("input", [15, 15], [15, 37], ["Shift+End", "Ctrl+Shift+🡸", "Ctrl+Shift+🡸", "Shift+🡺"], 1208, "Pijamalı hasta yağız şoföre çabucak güvendi.", null),
    new Exercise("input", [9, 9], [9, 41], ["Shift+End", "Shift+🡸", "Shift+🡸", "Shift+🡸"], 951, "Pijamalı hasta yağız şoföre çabucak güvendi.", null),
    new Exercise("input", [9, 9], [0, 35], ["Ctrl+a", "Ctrl+Shift+🡸", "Ctrl+Shift+🡸", "Shift+🡸"], 1319, "Pijamalı hasta yağız şoföre çabucak güvendi.", null),
].forEach(e => $exercises.append(e.$exercise ?? e))

// Focus the first one so that user might just hit Enter to begin
const $first = $("#exercises .exercise:first")
$first.find(".start").focus()

// Hide the other exercises but show then once the first exercise is completed
const $others = $first.siblings().hide()
$first.on("solved", function() {
    $others.show().css("opacity", 0).animate({"opacity": 1})
})

// Show correct language
refresh_translation()

// XX If <textarea> realized, we might use some of those lengths:
// On sangen hauskaa, että polkupyörä on maanteiden jokapäiväinen ilmiö.
// Wieniläinen siouxia puhuva ökyzombi diggaa Åsan roquefort-tacoja.
// Victor jagt zwölf Boxkämpfer quer über den großen Sylter Deich.
// Benjamín pidió una bebida de kiwi y fresa. Noé, sin vergüenza, la más exquisita champaña del menú.
