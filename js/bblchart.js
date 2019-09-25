var bblChart = {};

(function (self) {
    self.init = function (target, data, text) {
        // Get chart container
        let chartContainer = document.querySelector(target);

        if (chartContainer) { // If container exists draw chart
            // TEMPORARY FIX \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
            // Temp fix for small screen size load issue
            var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            if (viewportWidth < 1009) {
                setTimeout(function () {
                    self.draw(target, data, text, chartContainer);
                }, 500);
            } else self.draw(target, data, text, chartContainer);
            // TEMPORARY FIX END ///////////////////////////////////////////////////////////

            // redraw on resize
            window.addEventListener('resize', function () {
                self.draw(target, data, text, chartContainer);
            });
        } else console.log('no chart container');
    };

    // Draw graph for current chart
    self.draw = function (target, data, text, chartContainer) {
        // Reset content of graph before each draw (stops duplication)
        self.reset(target);
        chartContainer.style.height = chartContainer.offsetWidth + "px";
        let chartInner = d3.select(target + ' .chartInner');
        chartInner.append("svg");
        data.forEach(item => {
            // For each circle in the current data-item calculate positioning
            item.circles.forEach(circle => {
                self.positionCircle(chartInner, item, circle, chartContainer, text);

                if (circle.slice) {
                    self.calcSegment(circle, chartInner, chartContainer, item, text);
                }

                if (text === true) { // If text bool set true draw labels on circles
                    self.positionText(chartInner, item, circle, chartContainer, text);
                }
            });
        });
    };

    // Position & size circles based on x, y and radius. 
    self.positionCircle = function (inner, item, circle, container, text) {
        inner.selectAll("svg").append("circle")
            .attr("cx", function () {
                return self.calcPosition(circle.x, circle.r, container);
            })
            .attr("cy", function () {
                return self.calcPosition(circle.y, circle.r, container);
            })
            .attr("r", function () {
                var radVal;
                circle.r ? radVal = (container.offsetWidth / 1000) * circle.r : radVal = (container.offsetWidth / 1000) * 50;
                return radVal;
            })
            .attr("data-circlename", item.idstring)
            .attr("data-toggle", "tooltip")
            .attr("title", function () {
                let string;
                if (circle.type) {
                    string = item.name + ' - ' + circle.type;
                } else if (!text) {
                    string = item.name;
                } else return;
                return string;
            })
            .attr("data-circletype", circle.type)
            .attr("class", "circles")
            .style("fill", circle.fill)
            .style("stroke", circle.strokeColor);
    };

    self.reset = function (target) {
        let chartInner = d3.select(target + ' .chartInner');
        chartInner.selectAll("svg").remove();
        chartInner.selectAll("circle").remove();
    };

    self.positionText = function (inner, item, circle, container) {
        inner.selectAll("svg").append("text")
            .text((d) => {
                return item.name;
            })
            .attr("data-circlename", () => {
                return item.idstring;
            })
            .attr("x", () => {
                return self.calcPosition(circle.x, circle.r, container);
            })
            .attr("y", () => {
                return self.calcPosition(circle.y, circle.r, container, 0.5);
            })
            .attr("class", "bubble-label")
            .attr("font-size", "12px")
            .attr("font-family", "sans-serif")
            .attr("text-anchor", "middle")
            .attr("fill", circle.strokeColor);
    };

    self.calcPosition = function (axis, radius, container, modifier) {
        modifier ? axis = axis + modifier : null;
        var val = (container.offsetWidth / 100) * axis;
        if (axis + (radius / 10) >= 100) {
            val = (container.offsetWidth / 100) * (100 - (radius / 10) - 1);
        } else if (axis - (radius / 10) <= 0) {
            val = (container.offsetWidth / 100) * (0 + (radius / 10) + 1);
        }
        return val;
    };

    self.calcSegment = function (c, inner, container, item, text) {
        var x = self.calcPosition(c.x, c.r, container),
            y = self.calcPosition(c.y, c.r, container),
            r = c.r,
            sAngle = 0,
            eAngle = self.mapRange(c.slice = c.slice === 100 ? 99.9 : c.slice, 0, 100, 0, 360); // 
        r ? r = (container.offsetWidth / 1000) * r : r = (container.offsetWidth / 1000) * 50;
        inner.selectAll("svg").append("path")
            .attr("d", self.describeArc(x, y, r, sAngle, eAngle))
            .attr("fill", "rgba(0,0,0,.2)")
            .attr("data-toggle", "tooltip")
            .attr("title", function () {
                if (!text) {
                    return item.name + " - "+ c.sliceText +": " + c.slice + "%";
                } else {
                    return c.sliceText + " : " + c.slice + " % ";
                }
                
            });
    };

    self.mapRange = function (num, min, max, newMin, newMax) {
        return (num - min) * (newMax - newMin) / (max - min) + newMin;
    };

    self.polarToCartesian = function (centerX, centerY, radius, angleInDegrees) {
        var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    self.describeArc = function (x, y, radius, startAngle, endAngle) {
        var start = self.polarToCartesian(x, y, radius, endAngle);
        var end = self.polarToCartesian(x, y, radius, startAngle);

        var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

        var arc = [
            "M", start.x, start.y,
            "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
            "L", x, y,
            "L", start.x, start.y
        ].join(" ");
        return arc;
    };


})(bblChart);

var toggleChecks = document.querySelectorAll('.circleCheckBox');

toggleChecks.forEach((toggleCheck) => {
    toggleCheck.addEventListener('change', (e) => {
        //console.log('checked');
        var name = e.currentTarget.getAttribute('data-circlename');
        var svgItems = document.querySelectorAll('svg [data-circlename="' + name + '"]');
        svgItems.forEach((svgItem) => {
            if (!svgItem.classList.contains('d-none')) {
                svgItem.classList.add('d-none');
            } else {
                svgItem.classList.remove('d-none');
            }
        });
    });
});