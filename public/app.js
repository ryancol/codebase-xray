// Slice 1: fetch the file tree and render it as a draggable, zoomable
// force-directed graph. Folders and files are nodes; "contains" edges
// connect a folder to its direct children.

function flatten(tree) {
  const nodes = [];
  const links = [];

  function visit(node, parent) {
    nodes.push({ id: node.path || '.', name: node.name, type: node.type });
    if (parent) {
      links.push({ source: parent.path || '.', target: node.path || '.' });
    }
    if (node.children) {
      for (const child of node.children) visit(child, node);
    }
  }

  visit(tree, null);
  return { nodes, links };
}

function waitForLayout() {
  // Ensures the SVG has a real, laid-out size before we measure it —
  // reading clientWidth/clientHeight too early (before the first paint)
  // can return 0, which would collapse the force layout to the corner.
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function main() {
  const [res] = await Promise.all([fetch('/api/tree'), waitForLayout()]);
  const tree = await res.json();

  document.getElementById('repo-name').textContent = `Exploring: ${tree.name}`;

  const { nodes, links } = flatten(tree);

  const svg = d3.select('#graph');
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const container = svg.append('g');

  svg.call(
    d3.zoom()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => container.attr('transform', event.transform))
  );

  const simulation = d3
    .forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d) => d.id).distance(60).strength(0.8))
    .force('charge', d3.forceManyBody().strength(-180))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius(28));

  const link = container
    .append('g')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('class', 'link');

  const node = container
    .append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .call(drag(simulation));

  node
    .append('circle')
    .attr('r', (d) => (d.type === 'folder' ? 10 : 7))
    .attr('fill', (d) => (d.type === 'folder' ? 'var(--folder)' : 'var(--file)'));

  node
    .append('text')
    .attr('class', 'node-label')
    .attr('dx', 12)
    .attr('dy', 4)
    .text((d) => d.name);

  simulation.on('tick', () => {
    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    node.attr('transform', (d) => `translate(${d.x},${d.y})`);
  });

  function drag(sim) {
    function dragstarted(event) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event) {
      if (!event.active) sim.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
  }
}

main();
