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
			vertical: opt.vertical || false,
			callback: opt.callback,
			auto: opt.auto || false,
			interval: opt.interval || 5
		}

		this.hammer = null
		this.onSwipe = this.onSwipe.bind(this)
		this.counter = 0
		this.raf = null
	}

	init() {
		if (this.max === 0) return

		this.hammer = new Hammer.Manager(this.el)
		this.hammer.add(new Hammer.Swipe({
			direction: this.options.vertical ? Hammer.DIRECTION_VERTICAL : Hammer.DIRECTION_HORIZONTAL
		}));
		this.hammer.on('swipe', this.onSwipe)

		if (this.options.auto) this.startAuto()

		return this
	}

	destroy() {
		if (this.max === 0) return

		this.hammer.off('swipe', this.onSwipe)
		this.hammer.destroy()
		this.hammer = null

		cancelAnimationFrame(this.raf)
		this.raf = null
		this.counter = 0

		return this
	}

	getIndex() {
		return this.index
	}

	goTo(index) {
		if (index == this.index) return
		if (this.isChanging()) return

		const checkedIndex = this.checkLoop(index)
	  const event = this.createEvent(checkedIndex)

		if (checkedIndex == this.index) {
			this.changing = false
			return
		}

	  this.index = checkedIndex
	  this.options.callback(event)
	}

	startAuto() {
		this.raf = requestAnimationFrame(this.startAuto.bind(this))

		this.counter++

		if (this.counter > this.options.interval * 60) {
			this.callback(-1)
			this.counter = 0
		}
	}

	isChanging() {
		if (this.changing) return true

		this.changing = true
		return false
	}

	onSwipe(event) {
		this.callback(this.options.vertical ? event.deltaY : event.deltaX)
	}

	newIndex(delta) {
		return this.checkLoop(delta > 0 ? this.index - 1 : this.index + 1)
	}

	checkLoop(index) {
		return index < 0 ? this.options.loop ? this.max - 1 : 0 : index > this.max - 1 ? this.options.loop ? 0 : this.max - 1 : index
	}

	createEvent(newIndex) {
		return {
			current: newIndex,
			previous: this.index,
			direction: newIndex >= this.index ? 1 : -1
		}
	}

	callback(delta) {
		if (this.isChanging()) return

		const index = this.newIndex(delta)
		const event = this.createEvent(index)

		if (index == this.index) {
			this.changing = false
			return
		}

		this.index = index
		this.options.callback(event)
	}
}