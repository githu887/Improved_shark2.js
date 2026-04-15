elements.shark = {
    color: ["#5f8aa6", "#3f6f8f", "#2f5f7f"],
    category: "life",
    behavior: behaviors.WALL,
    state: "solid",
    density: 1050,

    tick: function(pixel) {

        const visionRange = 6;
        const smellRange = 12;

        let target = null;
        let targetType = null;
        let bestDist = Infinity;

        function dist(x1,y1,x2,y2){
            return Math.abs(x1-x2) + Math.abs(y1-y2);
        }

        // ===== DEATH CONDITIONS =====
        if (pixel.temp > 50 || pixel.temp < 0) {
            if (Math.random() < 0.02) {
                pixel.element = "meat";
                return;
            }
        }

        let below = pixelMap[pixel.x]?.[pixel.y + 1];
        if (!below || (below.element !== "water" && below.element !== "salt_water")) {
            if (Math.random() < 0.02) {
                pixel.element = "meat";
                return;
            }
        }

        // ===== SMELL (blood / life force priority) =====
        for (let dx = -smellRange; dx <= smellRange; dx++) {
            for (let dy = -smellRange; dy <= smellRange; dy++) {

                let x = pixel.x + dx;
                let y = pixel.y + dy;

                if (isEmpty(x,y)) continue;

                let p = pixelMap[x]?.[y];
                if (!p) continue;

                if (p.element === "blood" || p.element === "life_force" || p.element === "lifeforce") {
                    let d = dist(pixel.x,pixel.y,x,y);
                    if (d < bestDist) {
                        bestDist = d;
                        target = {x,y};
                        targetType = "smell";
                    }
                }
            }
        }

        // ===== VISION (fish + human head/body system) =====
        for (let dx = -visionRange; dx <= visionRange; dx++) {
            for (let dy = -visionRange; dy <= visionRange; dy++) {

                let x = pixel.x + dx;
                let y = pixel.y + dy;

                if (isEmpty(x,y)) continue;

                let p = pixelMap[x]?.[y];
                if (!p) continue;

                let d = dist(pixel.x,pixel.y,x,y);

                // 🐟 fish = normal priority prey
                if (p.element === "fish") {
                    if (d < bestDist) {
                        bestDist = d;
                        target = {x,y};
                        targetType = "fish";
                    }
                }

                // 🧍 HUMAN SYSTEM (head + body)
                if (p.element === "head" || p.element === "body") {

                    // HEAD = HIGH PRIORITY (brain/critical target)
                    if (p.element === "head") {
                        if (d < bestDist) {
                            bestDist = d;
                            target = {x,y};
                            targetType = "human_head";
                        }
                    }

                    // BODY = lower priority unless no head found
                    if (p.element === "body") {
                        if (!target || targetType !== "human_head") {
                            if (Math.random() < 0.03) {
                                if (d < bestDist) {
                                    bestDist = d;
                                    target = {x,y};
                                    targetType = "human_body";
                                }
                            }
                        }
                    }
                }
            }
        }

        // ===== MOVE =====
        let nx = pixel.x;
        let ny = pixel.y;

        if (target) {
            nx += Math.sign(target.x - pixel.x);
            ny += Math.sign(target.y - pixel.y);
        } else {
            let dirs = [[1,0],[-1,0],[0,1],[0,-1]];
            let d = dirs[Math.floor(Math.random()*dirs.length)];
            nx += d[0];
            ny += d[1];
        }

        if (isEmpty(nx, ny)) {
            movePixel(pixel, nx, ny);
        }

        // ===== EATING SYSTEM (HEAD/BODY LINKED KILL) =====
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {

                let x = pixel.x + dx;
                let y = pixel.y + dy;

                if (isEmpty(x,y)) continue;

                let p = pixelMap[x]?.[y];
                if (!p) continue;

                // fish eaten instantly
                if (p.element === "fish") {
                    deletePixel(x,y);
                }

                // human logic: head or body kills both nearby
                if (p.element === "head" || p.element === "body") {

                    // chance-based bite for realism
                    if (Math.random() < 0.25) {

                        deletePixel(x,y);

                        // try to remove connected part (simple realism link)
                        for (let ddx = -1; ddx <= 1; ddx++) {
                            for (let ddy = -1; ddy <= 1; ddy++) {
                                let nx2 = x + ddx;
                                let ny2 = y + ddy;

                                if (!isEmpty(nx2, ny2)) {
                                    let p2 = pixelMap[nx2][ny2];
                                    if (p2 && (p2.element === "head" || p2.element === "body")) {
                                        deletePixel(nx2, ny2);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};