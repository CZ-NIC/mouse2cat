const $template_exercise = $("#template-exercise")
const score = new Score()

class Exercise {
    /**
     * @param {string} tag
     * @param {[number, number]} start_range
     * @param {[number, number]} target_range
     * @param {string[]} keys_solution
     * @param {float} target_time
     * @param {string} start_text
     * @param {string|null} target_text
     *
     * Note you can record a new Exercise with the use of F7 and F9 and: new Exercise("input", [0, 0], [99, 99], [], 0, "")
     * // XX <textarea> cols (and <input> size) are not honoured (better in FF than in Chrome) so we must enforce it manually if <textarea> is ever used
     * @param target_text
     *
     * When solved, it triggers "solved" event.
     */
    constructor(tag, start_range, target_range, keys_solution, target_time, start_text, target_text = null) {
        // instance variables
        this.keys_solution = keys_solution
        this.start_range = start_range
        this.target_range = target_range
        this.text = start_text
        target_text = this.target_text = target_text ? target_text : start_text // no text change needed
        this.target_time = target_time

        // print out the exercise
        this.$exercise = $template_exercise.clone()
            .attr("id", null)
        // .appendTo($exercises)

        // link DOM elements
        const $representative = this.$exercise.find(".representative")
            .html(this.keys_solution.map(k => `<kbd>${k}</kbd> `))
        this.$start_button = this.$exercise.find(".start")
            .click(() => this.start()) // be ready to start when the button is clicked
        this.$status = this.$exercise.find(".status")
        this.$show = this.$exercise.find(".show")
            .click(() => $representative.show() && this.$show.prop("disabled", true)) // reveal the solution


        // prepare tag containing the sample (input or textarea)
        this.$field = this.$exercise.find(tag + ".sample")
        this.restore_state(true, false)
        // and remove the other one (textarea or input)
        this.$field.siblings(".sample").remove()

        // beautify the assignment
        this.$exercise.find(".assignment").html(
            target_text.substring(0, target_range[0])
            + "<span class='highlight'>" + target_text.substring(...target_range) + "</span>"
            + target_text.substring(target_range[1])
        )
    }

    /**
     * Give the user the possibility to reveal the solution
     */
    show_help() {
        this.$show.show(1000)
    }

    start() {
        this.restore_state(true, false)
        this.$field.prop("disabled", false).focus()
            .click(() => {
                this.restore_state(true, true)
                this.add_info("DO NOT USE MOUSE")
                animateCSS(this.$start_button, "headShake")
                this.show_help()
            })
            .selectRange(...this.start_range)
        let time_start, time_current
        const keys_used = []


        // XX showing the SPACE char

        this.$field.off('keydown').on('keydown', e => {
            if (e.key === "F7") {
                // Start recording – reset before start
                time_start = null
                keys_used.length = 0
                this.start_range = [this.$field[0].selectionStart, this.$field[0].selectionEnd]
                this.$status.html("")
                this.text = this.$field.val()
            }
            if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
                // modifiers are written with the key, ignore for now
                return
            }
            const key = this.describe_key(e)
            keys_used.push(key)
            this.add_info("<kbd>" + key + "</kbd>")
        })

        // start the counting once the user finished touching first non-modifier key
        // (do not count the time they decide what to do yet)
        this.$field.off('keyup').on('keyup', e => {
            if (!time_start) {
                if (e.key === "F7") {
                    // recording start
                    return
                }
                if (e.key === "Enter") {
                    // when I click on the 'start' button with 'Enter' or 'Return',
                    // the key is misled as a part of the exercise
                    // If an exercise stars with an 'Enter', this will pose a problem.
                    // Interestingly, this is not the case for the 'Space' key.
                    return
                }
                time_start = performance.now()
                setTimeout(() => {
                    if (!this.check_resolved()) {
                        // user doesn't know how to do that, reveal the help button
                        this.show_help()
                    }
                }, 5000)
            }
            if (e.key === "F9") {
                // Record current state as a new Exercise object
                $("<p/>", {"html": this.repr(keys_used, Math.round(time_current | 0))}).dblclick(function() {
                    $(this).hide()
                }).appendTo($("#recording"))
                return
            }
            time_current = performance.now() - time_start
            if (this.check_resolved()) {
                // end the exam
                this.restore_state(false, true, false)

                // analyze results
                // XX 'keys' might be 'key' (at other places too)
                const res = `${keys_used.length} ${gettext("keys")} / ${this.humanize_time(time_current)}`
                // check if user time is notably slower than the model
                const slow_malus = this.target_time * 2 + 1 < time_current ? 1 : 0

                /* XX Alternative comparison:
                // The solution might be better if the model solution needs fewer keystrokes.
                // The solution might be better if the user needed as many keystrokes as the model,
                // but that were different ones and took him more time.

                || (keys_used.length === this.keys_solution.length
                    && time_current > this.target_time
                    && !arraysEqual(keys_used, this.keys_solution))
                 */

                // examine solution
                if (keys_used.length > this.keys_solution.length) {
                    this.add_info(`<br>${"You used"}: ${res} ... ${"might be better"}: <b>${this.keys_solution.length} ${gettext("keys")}</b> / ${this.humanize_time(this.target_time)}. ${"Try again"}?`)
                    this.show_help()
                    this.add_score(keys_used.length > this.keys_solution.length + 3 ? 1 : 5 - slow_malus, "headShake")
                } else {
                    // The solution is perfect if exactly same keystrokes were used. XX change-> if exactly the same number of
                    // Or different ones that took less time than the model ones.
                    if (keys_used.length < this.keys_solution.length) {
                        this.add_info(`<br>${res} – MORE THAN COOL! YOU'RE BETTER THAN THE MODEL SOLUTION WHICH USED ${this.keys_solution.length} KEYS!`)
                        this.add_score(50, "tada")
                    } else {
                        this.add_info(`<br>${res} – COOL!`)
                        this.add_score(10 - slow_malus, "tada")
                    }
                    this.$exercise.nextAll(".exercise:first").find(".start").focus() // focus next exercise button
                }
                if (!$("#exercises > .exercise:not([solved])").length) {
                    // all exercises were solved, highlight the score
                    score.highlight()
                }
            }
        })
    }

    add_score(points, animation) {
        animateCSS(this.$start_button, animation)
        if (this.$exercise.attr("solved")) {
            return  // cannot receive points again
        }
        this.$exercise.attr("solved", 1).prepend(`<div class='score'>${points}× 💎</div>`).trigger("solved")
        score.add(points, animation)
    }

    add_info(text) {
        this.$status.html(this.$status.html() + " " + text)
    }

    humanize_time(t) {
        return Math.round((t) / 10) / 100 + " s";
    }

    describe_key(e) {
        let key = e.key;
        // change key to symbol if available
        [
            ["ArrowLeft", "🡸"],
            ["ArrowRight", "🡺"],
            ["ArrowUp", "🡹"],
            ["ArrowDown", "🡻"],
            [" ", "Space"],
        ].forEach(([match, symbol]) => key = (key === match) ? symbol : key);
        // append modifiers to key
        [
            [e.altKey, "Alt"],
            [e.shiftKey, "Shift"],
            [e.ctrlKey, "Ctrl"],
            [e.metaKey, "Meta"]
        ].forEach(([mod, name]) => {
            if (mod) {
                key = name + "+" + key
            }
        })
        return key
    }

    /**
     * @returns True if the caret is at the desired position and current text looks exactly like this.target_text
     */
    check_resolved() {
        const f = this.$field[0]
        const [start, end] = this.target_range
        return f.selectionStart === start && f.selectionEnd === end && this.$field.val() === this.target_text
    }

    restore_state(restore_text, focus, restore_status = true) {
        this.$field.prop("disabled", true).off("keyup")
        if (restore_text) {
            this.$field.val(this.text)
        }
        if (focus) {
            this.$start_button.focus()
        }
        if (restore_status) {
            this.$status.html("")
        }
    }

    /**
     * @returns {String} representation of the current object, in a constructor-like form
     */
    repr(keys_used, time) {
        const f = this.$field[0]
        const $f = this.$field
        const [start_text, end_text] = this.text === $f.val() ? [this.text, ""] : [this.text, $f.val()]
        return `new Exercise("input", [${this.start_range}], [${f.selectionStart}, ${f.selectionEnd}], [${keys_used.map(k => `"${k}"`)}], ${time}, "${start_text}", "${end_text}")`
    }
}