'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы several и through
 */
getEmitter.isStar = true;
module.exports = getEmitter;


class Event {
    constructor() {
        this.children = new Map();
        this.subscriptions = new Map();
    }

    addChild(event) {
        this.children.set(event, new Event());
    }

    addSubscription(subscr) {
        if (!this.subscriptions.has(subscr.context)) {
            this.subscriptions.set(subscr.context, []);
        }
        this.subscriptions
            .get(subscr.context)
            .push(subscr.handler);
    }

    removeSubscription(context) {
        if (this.subscriptions.has(context)) {
            this.subscriptions.delete(context);
        }
    }

    emit() {
        [...this.subscriptions.values()].forEach(
            handlers => handlers.forEach(h => h())
        );
    }
}


class Emitter {
    constructor() {
        this._root = new Event();
    }

    static _makeSubscription(context, handler) {
        return { context, handler: handler.bind(context) };
    }

    static _parseEventPath(path) {
        return path
            .split('.')
            .filter(Boolean);
    }

    _getOrCreateEvents(path) {
        const events = Emitter._parseEventPath(path);
        const result = [];
        let current = this._root;
        for (const event of events) {
            if (!current.children.has(event)) {
                current.addChild(event);
            }
            current = current.children.get(event);
            result.push(current);
        }

        return result;
    }

    _getOrCreateSpecificEvent(path) {
        return this._getOrCreateEvents(path)
            .pop();
    }

    /**
     * Подписаться на событие
     * @param {String} event
     * @param {Object} context
     * @param {Function} handler
     * @returns {Emitter}
     */
    on(event, context, handler) {
        const subscription = Emitter._makeSubscription(context, handler);
        this._getOrCreateSpecificEvent(event)
            .addSubscription(subscription);

        return this;
    }

    /**
     * Отписаться от события
     * @param {String} event
     * @param {Object} context
     * @returns {Emitter}
     */
    off(event, context) {
        event = this._getOrCreateSpecificEvent(event);
        const stack = [event];
        while (stack.length) {
            let current = stack.pop();
            current.removeSubscription(context);
            stack.push(...current.children.values());
        }

        return this;
    }

    /**
     * Уведомить о событии
     * @param {String} event
     * @returns {Emitter}
     */
    emit(event) {
        this._getOrCreateEvents(event)
            .reverse()
            .forEach(e => e.emit());

        return this;
    }

    /**
     * Подписаться на событие с ограничением по количеству полученных уведомлений
     * @star
     * @param {String} event
     * @param {Object} context
     * @param {Function} handler
     * @param {Number} times – сколько раз получить уведомление
     * @returns {Emitter}
     */
    several(event, context, handler, times) {
        if (times <= 0) {
            return this.on(event, context, handler);
        }
        const newHandler = () => {
            if (times > 0) {
                handler.call(context);
            }
            times--;
        };

        return this.on(event, context, newHandler);
    }

    /**
     * Подписаться на событие с ограничением по частоте получения уведомлений
     * @star
     * @param {String} event
     * @param {Object} context
     * @param {Function} handler
     * @param {Number} frequency – как часто уведомлять
     * @returns {Emitter}
     */
    through(event, context, handler, frequency) {
        if (frequency <= 0) {
            return this.on(event, context, handler);
        }
        let counter = 0;
        const newHandler = () => {
            counter %= frequency;
            if (counter === 0) {
                handler.call(context);
            }
            counter++;
        };

        return this.on(event, context, newHandler);
    }
}


/**
 * Возвращает новый emitter
 * @returns {Object}
 */
function getEmitter() {
    return new Emitter();
}
