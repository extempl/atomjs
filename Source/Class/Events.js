/*
---

name: "Class.Events"

description: ""

license: "[GNU Lesser General Public License](http://opensource.org/licenses/lgpl-license.php)"

requires:
	- atom
	- Class

inspiration:
  - "[MooTools](http://mootools.net)"

provides: Class.Events

...
*/

new function () {

var Class = atom.Class;

var fire = function (name, fn, args, onfinish) {
	var result = fn.apply(this, Array.from(args || []));
	if (typeof result == 'string' && result.toLowerCase() == 'removeevent') {
		onfinish.push(this.removeEvent.context(this, [name, fn]));
	}
};

var removeOn = function(string){
	return (string || '').replace(/^on([A-Z])/, function(full, first){
		return first.toLowerCase();
	});
};

var initEvents = function (object) {
	if (!object._events) object._events = { $ready: {} };
};

var nextTick = function (fn) {
	nextTick.fn.push(fn);
	if (!nextTick.id) {
		nextTick.id = function () {
			nextTick.reset().invoke();
		}.delay(1);
	}
};
nextTick.reset = function () {
	var fn = nextTick.fn;
	nextTick.fn = [];
	nextTick.id = 0;
	return fn;
};
nextTick.reset();

atom.extend(Class, {
	Events: Class({
		addEvent: function(name, fn) {
			initEvents(this);

			var i, l, onfinish = [];
			if (arguments.length == 1 && typeof name != 'string') {
				for (i in name) {
					this.addEvent(i, name[i]);
				}
			} else if (Array.isArray(name)) {
				for (i = 0, l = name.length; i < l; i++) {
					this.addEvent(name[i], fn);
				}
			} else {
				name = removeOn(name);
				if (name == '$ready') {
					throw new TypeError('Event name «$ready» is reserved');
				} else if (!fn) {
					throw new TypeError('Function is empty');
				} else {
					Object.ifEmpty(this._events, name, []);

					this._events[name].include(fn);

					var ready = this._events.$ready[name];
					if (ready) fire.apply(this, [name, fn, ready, onfinish]);
					onfinish.invoke();
				}
			}
			return this;
		},
		removeEvent: function (name, fn) {
			initEvents(this);

			if (arguments.length == 1 && typeof name != 'string') {
				for (i in name) {
					this.addEvent(i, name[i]);
				}
			} else if (Array.isArray(name)) {
				for (var i = name.length; i--;) {
					this.removeEvent(name[i], fn);
				}
				return this;
			} else {
				name = removeOn(name);
				if (name == '$ready') {
					throw new TypeError('Event name «$ready» is reserved');
				}
				if (arguments.length == 1) {
					this._events[name] = [];
				} else if (name in this._events) {
					this._events[name].erase(fn);
				}
			}
			return this;
		},
		isEventAdded: function (name) {
			initEvents(this);
			
			var e = this._events[name];
			return !!(e && e.length);
		},
		fireEvent: function (name, args) {
			initEvents(this);
			
			name = removeOn(name);
			var funcs = this._events[name];
			if (funcs) {
				var onfinish = [],
					l = funcs.length,
					i = 0;
				for (;i < l; i++) fire.call(this, name, funcs[i], args || [], onfinish);
				onfinish.invoke();
			}
			return this;
		},
		readyEvent: function (name, args) {
			initEvents(this);
			
			nextTick(function () {
				name = removeOn(name);
				this._events.$ready[name] = args || [];
				this.fireEvent(name, args || []);
			}.context(this));
			return this;
		}
	})
});

};