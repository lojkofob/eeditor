
var LottieObject = (() => {

    ObjectDefineProperties(NodePrototype, {
        __lottie: {
            get() {
                return this.____lottieObject;
            },
            set(v) {
                var t = this;
                if (t.____lottieObject == v)
                    return;

                if (t.____lottieObject) {
                    t.____lottieObject.__removeFromParent();
                    delete t.____lottieObject;
                }

                if (v instanceof LottieObject) {
                    t.____lottieObject = v;
                }
                else if (v) {
                    t.____lottieObject = new LottieObject(this)
                    t.__addChildBox(t.____lottieObject);
                    t.____lottieObject.__init(v);
                }

            }
        }
    });

    return makeClass(function (parentNode, v) {
        var t = this;
        HTMLNode.call(t, v);
        t.__parent = parentNode;
        t.__noEvents = 1;
    }, {

        __init(v) {
            var t = this;
            if (isString(v)) {
                v = {
                    __name: v
                };
            }
            t.__opts = v;
            var n = v.__name;
            delete v.__name;

            mergeObj(t, v);

            if (n) {
                t.__name = n;
                v.__name = n;
            }
            return this;
        },

        __play() {
            if (this.__htmlElement)
                this.__htmlElement.play();
        },

        __clone() {
            return this.__toJson();
        },

        __toJson() {
            var t = this, o = t.__opts || 0;
            return $filterObject({
                __name: t.____name
            }, a => a);
        }

    }, {

        __name: createSomePropertyWithGetterAndSetter(
            function () {
                return this.____name;
            },
            function (v) {
                var t = this;
                if (isObject(v)) {
                    t.__opts = v;
                    v = v.path;
                }
                t.____name = v;
                t.__reset();

                var o = t.__opts || 0, sz = this.__size, html_id = `lottie-${this.id}`;

                

                html.__addHtmlToBody(`<lottie-player
                                    id="${html_id}"
                                    src="${v}"
                                    autoplay="${ifdef(o.__autoplay, 1)}"
                                    loop="${ifdef(o.__loop, 0)}"
                                    speed=${ifdef(o.__speed, 1)}
                                    background="${o.__background||'transparent'}",
                                ></lottie-player>`);

                t.__htmlElement = html.__getElementById(html_id);

                t.__htmlElement.__parentElement = html.__getBody();

                t.__htmlElement.play();
            }
        )
    }, HTMLNode);

})(); 