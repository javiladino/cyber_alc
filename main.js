const svg = d3.select("svg"),
      width = +svg.attr("width"),
      height = +svg.attr("height");

const margin = {top: 50, right: 30, bottom: 40, left: 150};
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

let yearLabel = svg.append("text")
  .attr("class", "year-label")
  .attr("x", width - 100)
  .attr("y", height - 50)
  .attr("text-anchor", "end");

d3.csv("ataques_latam.csv", d3.autoType).then(data => {
  // Agrupar acumulativamente por año y país
  const years = [...new Set(data.map(d => d.year))].sort();
  const countries = [...new Set(data.map(d => d.country))];

  const nested = years.map(year => {
    const filtered = data.filter(d => d.year <= year);
    const totals = d3.rollup(filtered, v => d3.sum(v, d => d.attacks), d => d.country);
    return {
      year,
      values: Array.from(totals, ([country, attacks]) => ({ country, attacks }))
                  .sort((a, b) => b.attacks - a.attacks)
                  .slice(0, 10)
    };
  });

  // Escalas
  const x = d3.scaleLinear().range([0, chartWidth]);
  const y = d3.scaleBand().range([0, chartHeight]).padding(0.1);
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  function update(frame) {
    const { year, values } = nested[frame];
    x.domain([0, d3.max(values, d => d.attacks)]);
    y.domain(values.map(d => d.country));
    color.domain(values.map(d => d.country));

    // JOIN
    const bars = g.selectAll("rect").data(values, d => d.country);

    // EXIT
    bars.exit().remove();

    // ENTER + UPDATE
    bars.enter().append("rect")
        .attr("y", d => y(d.country))
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", 0)
        .attr("fill", d => color(d.country))
      .merge(bars)
        .transition().duration(500)
        .attr("y", d => y(d.country))
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.attacks));

    // Etiquetas
    const labels = g.selectAll("text.label").data(values, d => d.country);
    labels.exit().remove();

    labels.enter().append("text")
        .attr("class", "label")
        .attr("x", 5)
        .attr("y", d => y(d.country) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .text(d => d.country)
      .merge(labels)
        .transition().duration(500)
        .attr("y", d => y(d.country) + y.bandwidth() / 2);

    yearLabel.text(year);
  }

  // Animar
  let frame = 0;
  function animate() {
    update(frame);
    frame++;
    if (frame < nested.length) {
      setTimeout(animate, 1000);
    }
  }

  animate();
});
