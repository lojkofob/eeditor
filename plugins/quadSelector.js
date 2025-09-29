var QuadSelectorWithKitten = (() => {

    var par = new ENode({ __z: -11000, __size: [1, 1] });
    var x1 = 0, y1 = 0, kx = 0, ky = 0, x2 = 0, y2 = 0, tmp;

    var n = par.__addChildBox(new LineNode({
        curveData: [],
        __keepDragThenMouseOut: 1,
        addPointsNodes() { },
        __size: [5, 5],
        __shader: 'dashed',
        sha: 0, sva: 0,
        __alpha: 0.4,

        __updateSelection() {

            if (n.selectionType) {
                $each(n.poses, p => {
                    p.n.__isQuadSelected = p.x2 < n.xmax && p.x1 > n.xmin &&
                        p.y2 < n.ymax && p.y1 > n.ymin;
                });
            } else {
                $each(n.poses, p => {
                    p.n.__isQuadSelected = p.x2 > n.xmin && p.x1 < n.xmax &&
                        p.y2 > n.ymin && p.y1 < n.ymax;
                });
            }
        },


        __drag(x, y, dx, dy, e) {

            kx += dx; ky -= dy;
            x2 = x1 + kx; y2 = y1 + ky;
            n.xmin = mmin(x1, x2);
            n.xmax = mmax(x1, x2);
            n.ymin = mmin(-y1, -y2);
            n.ymax = mmax(-y1, -y2);

            n.curveData = [
                x2, y2,
                x2, y1,
                x1, y1,
                x1, y2,
                x2, y2
            ];
            n.q.__size = [n.xmax - n.xmin, n.ymax - n.ymin];
            n.q.__ofs = [n.xmin, n.ymin, -1];

            n.xmin *= layoutsResolutionMult;
            n.xmax *= layoutsResolutionMult;
            n.ymin *= layoutsResolutionMult;
            n.ymax *= layoutsResolutionMult;
            n.__updateSelection();

        },

        reactivate() {
            if (n.active) {
                setCurrentDraggingObject(n);
                draggableObjects.__startDragPosition = 0;
            }
        },

        activate(nodes, selectionType) {
            if (!n.active) {
                n.active = 1;
                n.selectionType = selectionType;

                n.q.__color = n.selectionType == 0 ? '#bbf' : '#fff';

                addToScene(par);
                n.reactivate();

                kx = ky = 0;
                x1 = n.mousedown.x;
                y1 = -n.mousedown.y;

                n.__drag(0, 0, 0, 0);
                n.nodes = nodes;
                n.cachePoses();
            }
        },

        updatePos(dx, dy) {
            x1 += dx;
            y1 += dy;
            kx -= dx;
            ky -= dy;
            n.cachePoses();
            n.__drag(0, 0, 0, 0);
        },

        deactivate() {
            if (n.active) {
                n.active = 0;
                par.__parent.__removeChild(par);
                if (curDraggingObject == n) {
                    setCurrentDraggingObject(0, 1);
                }
                $each(n.poses, p => { delete p.n.__isQuadSelected; });
            }
        },

        cachePoses() {
            $each(n.poses, p => { delete p.n.__isQuadSelected; });
            n.poses = $map(n.nodes, n => {
                var bb = n.__getScreenBoundingBox(1);
                return {
                    n: n,
                    x1: bb[0].x,
                    x2: bb[1].x,
                    y1: bb[0].y,
                    y2: bb[1].y
                };
            });
        }
    }));
    //     n.__render = function(){
    //         debugger;
    //         
    //     };
    BUS.__addEventListener(
        'PROJECT_OPENED', a => {
            n.q = n.__addChildBox({
                __alpha: 0.3,
                sha: 0, 
                sva: 0,
                __img: "qbord_8_w",
                __corner: [4, 4]
            });
        });

    return n;

})();
