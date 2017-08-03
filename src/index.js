class SlideManager {
	constructor(el, opt = {}) {
		if (!el) {
			console.error('You must pass an element')

			return
		}
		if (!opt.callback) {
			console.error('You must give a callback')

			return
		}

		this.el = el
		this.changing = false
		this.index = 0
		this.max = opt.length || this.el.children.length

		this.options = {
			loop: opt.loop || false,
			random: opt.random || false,
			vertical: opt.vertical || false,
			callback: opt.callback,
			auto: opt.auto || false,
			interval: opt.interval || 5,
			init: opt.init === false ? opt.init : true,
			swipe: opt.swipe === false ? opt.swipe : true,
			threshold: opt.threshold || 60
		}

		if (opt.startAt !== this.index && opt.startAt > 0) {
			if (opt.startAt > this.max) this.index = this.max
			else this.index = opt.startAt
		}

		this.counter = 0
		this.raf = null
		this.paused = false

		this.touch = {
			startX: 0,
			startY: 0,
			endX: 0,
			endY: 0
		}

		this.diagonalMax = 100

		if (this.options.init) this.init()
	}


	// Public functions
	init() {
		if (this.max === 0) return null

		if (this.options.auto) this.startAuto()
		if (this.options.swipe) this.events()

		return this
	}

	pause() {
		this.paused = true
	}

	resume() {
		this.paused = false

		this.startAuto()
	}

	destroy() {
		if (this.max === 0) return null

		this.changing = false
		this.paused = false

		if (this.options.swipe) {
			this.el.removeEventListener('mousedown', this.touchStart, false)
			this.el.removeEventListener('mouseup', this.touchEnd, false)

			this.el.removeEventListener('touchstart', this.touchStart, false)
			this.el.removeEventListener('touchend', this.touchEnd, false)
		}

		cancelAnimationFrame(this.raf)
		this.raf = null
		this.counter = 0

		return this
	}

	getIndex() {
		return this.index
	}

	goTo(index) {
		if (index === this.index || this.isChanging()) return

		const checkedIndex = this.checkLoop(index),
			event = this.createEvent(checkedIndex)

		if (checkedIndex === this.index) {
			this.changing = false

			return
		}

		this.index = checkedIndex
		this.options.callback(event)
	}

	done() {
		this.changing = false
	}


	// Private functions
	events() {
		this.el.addEventListener('mousedown', this.touchStart.bind(this), false)
		this.el.addEventListener('mouseup', this.touchEnd.bind(this), false)

		this.el.addEventListener('touchstart', this.touchStart.bind(this), false)
		this.el.addEventListener('touchend', this.touchEnd.bind(this), false)
	}

	touchStart(event) {
		this.touch.startX = event.type === 'touchstart' ? event.touches[0].screenX : event.screenX
		this.touch.startY = event.type === 'touchstart' ? event.touches[0].screenY : event.screenY
	}

	touchEnd(event) {
		this.touch.endX = event.type === 'touchend' ? event.changedTouches[0].screenX : event.screenX
		this.touch.endY = event.type === 'touchend' ? event.changedTouches[0].screenY : event.screenY

		this.handleSwipe()
	}

	isGoingToX() {
		if ((this.touch.endX < this.touch.startX && this.touch.startX - this.touch.endX <= this.diagonalMax) || (this.touch.endX > this.touch.startX && this.touch.endX - this.touch.startX <= this.diagonalMax)) return true

		return false
	}

	isGoingToY() {
		if ((this.touch.endY < this.touch.startY && this.touch.startY - this.touch.endY <= this.diagonalMax) || (this.touch.endY > this.touch.startY && this.touch.endY - this.touch.startY <= this.diagonalMax)) return true

		return false
	}

	handleSwipe() {
		if (this.changing) return

		if (this.options.vertical) {
			if (this.touch.endY < this.touch.startY && this.touch.startY - this.touch.endY >= this.options.threshold) {
				if (this.isGoingToX()) {
					this.counter = 0
					this.callback(1)
				}
			}
			if (this.touch.endY > this.touch.startY && this.touch.endY - this.touch.startY >= this.options.threshold) {
				if (this.isGoingToX()) {
					this.counter = 0
					this.callback(-1)
				}
			}
		} else {
			if (this.touch.endX < this.touch.startX && this.touch.startX - this.touch.endX >= this.options.threshold) {
				if (this.isGoingToY()) {
					this.counter = 0
					this.callback(-1)
				}
			}
			if (this.touch.endX > this.touch.startX && this.touch.endX - this.touch.startX >= this.options.threshold) {
				if (this.isGoingToY()) {
					this.counter = 0
					this.callback(1)
				}
			}
		}
	}

	startAuto() {
		if (!this.paused) {
			this.counter++

			if (this.counter >= this.options.interval * 60) {
				if (!this.changing) this.callback(-1)

				this.counter = 0
			}

			this.raf = requestAnimationFrame(this.startAuto.bind(this))
		}
	}

	isChanging() {
		if (this.changing) return true

		this.changing = true

		return false
	}

	newIndex(delta) {
		return this.checkLoop(delta > 0 ? this.index - 1 : this.index + 1)
	}

	newRandomIndex() {
		let randIndex

		do {
			randIndex = Math.floor(Math.random() * this.max)
		} while (randIndex === this.index)

		return randIndex
	}

	checkLoop(index) {
		return index < 0 ? this.options.loop ? this.max - 1 : 0 : index > this.max - 1 ? this.options.loop ? 0 : this.max - 1 : index
	}

	createEvent(newIndex) {
		let direction = newIndex > this.index ? 1 : -1

		if (this.index === 0 && newIndex === this.max) direction = -1
		else if (this.index === this.max && newIndex === 0) direction = 1

		return {
			current: newIndex,
			previous: this.index,
			direction
		}
	}

	callback(delta) {
		if (this.isChanging()) return

		const index = this.options.random ? this.newRandomIndex() : this.newIndex(delta),
			event = this.createEvent(index)

		if (index === this.index) {
			this.changing = false

			return
		}

		this.index = index
		this.options.callback(event)
	}
}

export { SlideManager as default };
