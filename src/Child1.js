// Child1.js
import React, { Component } from "react";
import * as d3 from "d3";
import "./Child1.css";

class Child1 extends Component {
    constructor(props) {
        super(props);
        this.state = {
            company: "Apple", // Default Company
            selectedMonth: "November", // Default Month
        };
        this.chartRef = React.createRef();
    }

    componentDidMount() {
        this.createChart();
    }

    componentDidUpdate(prevProps, prevState) {
        // Only update the chart if data, company, or month has changed
        if (
            prevProps.csv_data !== this.props.csv_data ||
            prevState.company !== this.state.company ||
            prevState.selectedMonth !== this.state.selectedMonth
        ) {
            this.updateChart();
        }
    }

    // Handle company selection
    handleCompanyChange = (event) => {
        this.setState({ company: event.target.value });
    };

    // Handle month selection
    handleMonthChange = (event) => {
        this.setState({ selectedMonth: event.target.value });
    };

    // Filter data based on selected company and month
    getFilteredData = () => {
        const { csv_data } = this.props;
        const { company, selectedMonth } = this.state;

        // Convert month name to month number (0-11)
        const monthNumber = new Date(`${selectedMonth} 1, 2020`).getMonth();

        return csv_data
            .filter(
                (d) =>
                    d.Company === company &&
                    d.Date.getMonth() === monthNumber
            )
            .sort((a, b) => a.Date - b.Date);
    };

    // Initialize the chart
    createChart = () => {
        const svg = d3
            .select(this.chartRef.current)
            .append("svg")
            .attr("width", "100%")
            .attr("height", 500)
            .attr("viewBox", `0 0 900 500`) // Increased width to 900
            .attr("preserveAspectRatio", "xMidYMid meet");

        // Append group for chart elements
        svg.append("g").attr("class", "x-axis");
        svg.append("g").attr("class", "y-axis");
        svg.append("path").attr("class", "line open");
        svg.append("path").attr("class", "line close");
        svg.append("g").attr("class", "circles open");
        svg.append("g").attr("class", "circles close");

        // Tooltip setup
        const tooltip = svg.append("g").attr("class", "tooltip").style("opacity", 0);
        tooltip.append("rect")
            .attr("width", 180)
            .attr("height", 100)
            .attr("class", "tooltip-rect");

        tooltip.append("text")
            .attr("x", 10)
            .attr("y", 20)
            .attr("class", "tooltip-date");

        tooltip.append("text")
            .attr("x", 10)
            .attr("y", 40)
            .attr("class", "tooltip-open");

        tooltip.append("text")
            .attr("x", 10)
            .attr("y", 60)
            .attr("class", "tooltip-close");

        tooltip.append("text")
            .attr("x", 10)
            .attr("y", 80)
            .attr("class", "tooltip-diff");

        // No Data Message
        svg.append("text")
            .attr("x", 450) // Center horizontally
            .attr("y", 250) // Center vertically
            .attr("text-anchor", "middle")
            .attr("class", "no-data-message")
            .style("display", "none") // Hidden by default
            .text("No data available for the selected company and month.");

        // Append legend group
        svg.append("g").attr("class", "legend");

        // Initial update
        this.updateChart();
    };

    // Update the chart based on current state and props
    updateChart = () => {
        const data = this.getFilteredData();

        const svg = d3.select(this.chartRef.current).select("svg");
        const margin = { top: 50, right: 200, bottom: 50, left: 60 }; // Increased right margin to 200
        const width = 900 - margin.left - margin.right; // Adjusted width based on new SVG width
        const height = 500 - margin.top - margin.bottom;

        // Toggle No Data message visibility
        if (data.length === 0) {
            svg.select(".no-data-message").style("display", "block");
            // Hide chart elements
            svg.select(".x-axis").style("display", "none");
            svg.select(".y-axis").style("display", "none");
            svg.select(".line.open").style("display", "none");
            svg.select(".line.close").style("display", "none");
            svg.select(".circles.open").style("display", "none");
            svg.select(".circles.close").style("display", "none");
            svg.select(".legend").style("display", "none");
            svg.select(".tooltip").style("display", "none");
            return;
        } else {
            svg.select(".no-data-message").style("display", "none");
            // Show chart elements
            svg.select(".x-axis").style("display", "block");
            svg.select(".y-axis").style("display", "block");
            svg.select(".line.open").style("display", "block");
            svg.select(".line.close").style("display", "block");
            svg.select(".circles.open").style("display", "block");
            svg.select(".circles.close").style("display", "block");
            svg.select(".legend").style("display", "block");
            svg.select(".tooltip").style("display", "block");
        }

        // Define scales
        const xScale = d3
            .scaleTime()
            .domain(d3.extent(data, (d) => d.Date))
            .range([margin.left, width + margin.left]);

        const yMin = d3.min(data, (d) => Math.min(d.Open, d.Close));
        const yMax = d3.max(data, (d) => Math.max(d.Open, d.Close));

        const yScale = d3
            .scaleLinear()
            .domain([yMin - 10, yMax + 10])
            .range([height + margin.top, margin.top]);

        // Define axes
        const xAxis = d3
            .axisBottom(xScale)
            .ticks(d3.timeDay.every(2))
            .tickFormat(d3.timeFormat("%d-%b"));
        const yAxis = d3.axisLeft(yScale);

        // Render axes
        svg.select(".x-axis")
            .attr("transform", `translate(0, ${height + margin.top})`)
            .call(xAxis)
            .selectAll("text")
            .attr("class", "axis-text");

        svg.select(".y-axis")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(yAxis)
            .selectAll("text")
            .attr("class", "axis-text");

        // Define lines
        const lineOpen = d3
            .line()
            .x((d) => xScale(d.Date))
            .y((d) => yScale(d.Open))
            .curve(d3.curveMonotoneX);

        const lineClose = d3
            .line()
            .x((d) => xScale(d.Date))
            .y((d) => yScale(d.Close))
            .curve(d3.curveMonotoneX);

        // Render lines
        svg.select(".line.open")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#b2df8a")
            .attr("stroke-width", 2)
            .attr("d", lineOpen);

        svg.select(".line.close")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#e41a1c")
            .attr("stroke-width", 2)
            .attr("d", lineClose);

        // Tooltip setup
        const tooltip = svg.select(".tooltip");
        tooltip.style("opacity", 0); // Ensure tooltip is hidden initially

        // Functions to handle tooltip interactions
        const mouseover = () => {
            tooltip.style("opacity", 1);
        };

        const mousemove = (event, d, type) => {
            const [x, y] = d3.pointer(event);
            tooltip.attr("transform", `translate(${x + 20}, ${y - 40})`);
            tooltip.select(".tooltip-date").text(`Date: ${d3.timeFormat("%d-%b-%Y")(d.Date)}`);
            tooltip.select(".tooltip-open").text(`Open: ${d.Open.toFixed(2)}`);
            tooltip.select(".tooltip-close").text(`Close: ${d.Close.toFixed(2)}`);
            tooltip.select(".tooltip-diff").text(`Diff: ${(d.Close - d.Open).toFixed(2)}`);
        };

        const mouseout = () => {
            tooltip.style("opacity", 0);
        };

        // Render circles for Open prices
        svg.select(".circles.open")
            .selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", (d) => xScale(d.Date))
            .attr("cy", (d) => yScale(d.Open))
            .attr("r", 4)
            .attr("fill", "#b2df8a")
            .attr("class", "data-circle open-circle")
            .on("mouseover", () => mouseover())
            .on("mousemove", (event, d) => mousemove(event, d, "Open"))
            .on("mouseout", mouseout);

        // Render circles for Close prices
        svg.select(".circles.close")
            .selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", (d) => xScale(d.Date))
            .attr("cy", (d) => yScale(d.Close))
            .attr("r", 4)
            .attr("fill", "#e41a1c")
            .attr("class", "data-circle close-circle")
            .on("mouseover", () => mouseover())
            .on("mousemove", (event, d) => mousemove(event, d, "Close"))
            .on("mouseout", mouseout);

        // Add legend inside the chart area (top-right corner)
        const legend = svg.select(".legend");
        legend.selectAll("*").remove(); // Clear previous legend

        legend
            .attr("transform", `translate(${width + margin.left - 150}, ${margin.top})`);

        const legendData = [
            { name: "Open", color: "#b2df8a" },
            { name: "Close", color: "#e41a1c" },
        ];

        const legendItem = legend.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 25})`)
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                // Highlight the corresponding line
                svg.select(`.line.${d.name.toLowerCase()}`)
                    .attr("stroke-width", 4);
            })
            .on("mouseout", function(event, d) {
                // Reset the line stroke width
                svg.select(`.line.${d.name.toLowerCase()}`)
                    .attr("stroke-width", 2);
            });

        legendItem.append("rect")
            .attr("x", 0)
            .attr("y", -10)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", (d) => d.color)
            .attr("class", "legend-rect");

        legendItem.append("text")
            .attr("x", 30)
            .attr("y", 0)
            .text((d) => d.name)
            .attr("class", "legend-text")
            .attr("aria-label", (d) => d.name);
    };

    render() {
        const companies = ["Apple", "Microsoft", "Amazon", "Google", "Meta"];
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        return (
            <div className="child1">
                <div className="controls">
                    <div className="company-selector">
                        <span className="company-selector-span">Select Company:</span>
                        {companies.map((company) => (
                            <label key={company} className="company-label">
                                <input
                                    type="radio"
                                    value={company}
                                    checked={this.state.company === company}
                                    onChange={this.handleCompanyChange}
                                />
                                {company}
                            </label>
                        ))}
                    </div>
                    <div className="month-selector">
                        <label className="month-selector-label">
                            Select Month:
                            <select
                                value={this.state.selectedMonth}
                                onChange={this.handleMonthChange}
                                className="month-selector-select"
                            >
                                {months.map((month) => (
                                    <option key={month} value={month}>
                                        {month}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
                <div ref={this.chartRef} className="chart-container"></div>
            </div>
        );
    }
}

export default Child1;
