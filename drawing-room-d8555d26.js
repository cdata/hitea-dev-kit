/**
 * Given an EventTarget, listen for events that request a store and provide
 * a configured store to the originating event dispatcher.
 */
const provide = (scope, store) => {
    const connectStore = (event) => {
        const { requestor } = event.detail;
        event.stopImmediatePropagation();
        requestor.connectStore(store);
    };
    scope.addEventListener('store-requested', connectStore);
};

var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _state, _verbose, _logger;
const $name = Symbol('name');
const defaultLogger = (actionName, state) => console.warn(`Action<${actionName}>`, state);
const action = (name, action) => {
    action[$name] = name;
    return action;
};
const isNamedAction = (action) => {
    return action[$name] != null;
};
class Store extends EventTarget {
    constructor(initialState, options = {}) {
        super();
        _state.set(this, void 0);
        _verbose.set(this, void 0);
        _logger.set(this, void 0);
        __classPrivateFieldSet(this, _state, initialState);
        __classPrivateFieldSet(this, _verbose, !!options.verbose);
        const { logger, middleware } = options;
        __classPrivateFieldSet(this, _logger, logger != null
            ? (actionName, state) => logger(defaultLogger, actionName, state)
            : defaultLogger);
        let store = this;
        if (middleware != null) {
            for (const ware of middleware) {
                store = ware(store);
            }
        }
        return store;
    }
    get state() {
        return __classPrivateFieldGet(this, _state);
    }
    async dispatch(action) {
        const newState = await action(() => this.state, (action) => this.dispatch(action));
        if (newState == null) {
            return;
        }
        if (__classPrivateFieldGet(this, _verbose)) {
            const name = isNamedAction(action) ? action[$name] : 'ANONYMOUS';
            __classPrivateFieldGet(this, _logger).call(this, name, newState);
        }
        __classPrivateFieldSet(this, _state, newState);
        this.dispatchEvent(new CustomEvent('state-change'));
    }
}
_state = new WeakMap(), _verbose = new WeakMap(), _logger = new WeakMap();

const rgb565ToInt = (r, g, b) => ((r & 0x1f) << 11) + ((g & 0x3f) << 5) + (b & 0x1f);
const intToRgb565 = (rgb565) => ({
    r: (rgb565 >> 11) & 0x1f,
    g: (rgb565 >> 5) & 0x3f,
    b: rgb565 & 0x1f,
});
const rgbToInt = (r, g, b) => ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
const intToRgb = (rgb) => ({
    r: (rgb >> 16) & 0xff,
    g: (rgb >> 8) & 0xff,
    b: rgb & 0xff,
});
const intRgbToRgb565 = (rgb) => {
    const { r: r0, g: g0, b: b0 } = intToRgb(rgb);
    const { r, g, b } = rgbToRgb565(r0, g0, b0);
    return rgb565ToInt(r, g, b);
};
const intRgb565ToRgb = (rgb565) => {
    const { r: r0, g: g0, b: b0 } = intToRgb565(rgb565);
    const { r, g, b } = rgb565ToRgb(r0, g0, b0);
    return rgbToInt(r, g, b);
};
const rgbToRgb565 = (r, g, b) => ({
    r: Math.round((r / 0xff) * 0x1f) | 0,
    g: Math.round((g / 0xff) * 0x3f) | 0,
    b: Math.round((b / 0xff) * 0x1f) | 0,
});
const rgb565ToRgb = (r, g, b) => ({
    r: Math.round((r / 0x1f) * 0xff) | 0,
    g: Math.round((g / 0x3f) * 0xff) | 0,
    b: Math.round((b / 0x1f) * 0xff) | 0,
});
const rgb565MappedRgb = (rgb) => intRgb565ToRgb(intRgbToRgb565(rgb));
const intToCssHex = (int) => {
    let hexString = (int & 0xffffff).toString(16);
    while (hexString.length < 6) {
        hexString = `0${hexString}`;
    }
    return `#${hexString}`;
};
// (self as any).rgb565ToRgb = rgb565ToRgb;
// (self as any).rgbToRgb565 = rgbToRgb565;
// (self as any).intRgb565ToRgb = intRgb565ToRgb;
// (self as any).intRgbToRgb565 = intRgbToRgb565;
// (self as any).rgb565MappedRgb = rgb565MappedRgb;

const emptySelection = () => ({
    start: {
        x: 0,
        y: 0,
    },
    end: {
        x: 1,
        y: 1,
    },
});
// http://androidarts.com/palette/16pal.htm
const defaultPalette = () => ({
    id: null,
    colors: [
        rgb565MappedRgb(0x000000),
        rgb565MappedRgb(0x9d9d9d),
        rgb565MappedRgb(0xffffff),
        rgb565MappedRgb(0xbe2633),
        rgb565MappedRgb(0xe06f8b),
        rgb565MappedRgb(0x493c2b),
        rgb565MappedRgb(0xa46422),
        rgb565MappedRgb(0xeb8931),
        rgb565MappedRgb(0xf7e26b),
        rgb565MappedRgb(0x2f484e),
        rgb565MappedRgb(0x44891a),
        rgb565MappedRgb(0xa3ce27),
        rgb565MappedRgb(0x1b2632),
        rgb565MappedRgb(0x005784),
        rgb565MappedRgb(0x31a2f2),
        rgb565MappedRgb(0xb2dcef),
    ],
});
const store = new Store({
    drawingRoom: {
        activeTool: 'pen',
        activePalette: 0,
        activeColor: 0,
        userIsDragging: false,
        taskQueue: [],
        spriteSheet: {
            columns: 8,
            rows: 16,
            tilePixelWidth: 8,
            tilePixelHeight: 8,
            palettes: [defaultPalette()],
            layers: [
                {
                    id: null,
                    pixels: [],
                },
            ],
            colorScheme: {
                defaultPalette: null,
                tiles: [],
            },
        },
        selection: emptySelection(),
    },
}, {
    verbose: false,
});

provide(self, store);
import('./drawing-room-app-8c22d750.js');

export { intRgbToRgb565 as a, intRgb565ToRgb as b, action as c, intToRgb as d, emptySelection as e, intToCssHex as i };
//# sourceMappingURL=drawing-room-d8555d26.js.map
