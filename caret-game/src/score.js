class Score {
    constructor() {
        const $score = this.$score = $("#score")
        this.score = 0
        this.queue = []
        this.animating = false
        $score.mouseenter(() => {
            // dodge to a random direction
            const distance = Math.floor(Math.random() * 400) - 100
            const distance2 = Math.floor(Math.random() * 400) - 100
            this.queue.unshift({top: '+=' + distance, left: '+=' + distance2})
            this.queue.push({top: '-=' + distance, left: '-=' + distance2})
            this.dodge()
        })
    }

    dodge() {
        if (this.animating) {
            return
        }
        const action = this.queue.shift()
        if (!action) {
            return
        }
        this.animating = true
        this.$score.animate(action, 1000, null, () => {
            this.animating = false
            this.dodge()
        })

    }

    add(points, animation) {
        if (this.score === 0) { // for the first time, give it a slow entrance
            animateCSS(this.$score, "backInUp", 4)
        } else {
            animateCSS(this.$score, animation)
        }
        this.score += points
        this.$score.html(`${this.score}× 💎`)
        // progress: ${Math.round($(".exercise[solved]").length / $(".exercise").length * 100)} %
    }

    highlight() {
        this.$score
            .animate({"left": "40%"}, 3000)
            .html("Final score: " + this.$score.html())
            .addClass("highlight")
    }
}