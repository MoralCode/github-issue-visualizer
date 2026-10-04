/**
 * Generate interactive HTML visualization using Cytoscape.js
 */

import { DependencyGraph } from '../api/types';
import { Formatter } from './formatter';

export class InteractiveGenerator {
  /**
   * Generate interactive HTML visualization
   */
  generate(graph: DependencyGraph): string {
    const elements = this.buildCytoscapeElements(graph);
    const style = this.buildCytoscapeStyle();

    return this.buildHTML(elements, style, graph);
  }

  /**
   * Build Cytoscape elements (nodes and edges)
   */
  private buildCytoscapeElements(graph: DependencyGraph): any[] {
    const elements: any[] = [];

    for (const [nodeNumber, node] of graph.nodes) {
      elements.push({
        data: {
          id: `${nodeNumber}`,
          label: `#${nodeNumber}: ${Formatter.formatTitle(node.title, 50)}`,
          title: node.title,
          url: node.url,
          state: node.state,
          assignees: node.assignees.map((a) => a.login).join(', '),
          labels: node.labels.map((l) => l.name).join(', '),
        },
      });
    }

    for (const edge of graph.edges) {
      elements.push({
        data: {
          id: `${edge.from}-${edge.to}`,
          source: `${edge.from}`,
          target: `${edge.to}`,
          type: edge.type,
          source_type: edge.source,
        },
      });
    }

    return elements;
  }

  /**
   * Build Cytoscape style
   */
  private buildCytoscapeStyle(): any[] {
    return [
      {
        selector: 'node',
        style: {
          label: 'data(label)',
          'background-color': '#74c0fc',
          color: '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '13px',
          width: 'label',
          height: 'label',
          padding: '15px',
          'min-width': '140px',
          'min-height': '50px',
          'text-wrap': 'wrap',
          'text-max-width': '130px',
          shape: 'roundrectangle',
          'border-width': 2,
          'border-color': '#333',
        },
      },
      {
        selector: 'node[state = "closed"]',
        style: {
          'background-color': '#2da44e',
          'border-color': '#1a7f37',
        },
      },
      {
        selector: 'edge',
        style: {
          width: 2,
          'line-color': (ele: any) => {
            return ele.data('type') === 'sub-issue' ? '#999' : '#666';
          },
          'line-style': (ele: any) => {
            return ele.data('type') === 'sub-issue' ? 'dashed' : 'solid';
          },
          'target-arrow-color': '#666',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
          'border-color': '#0066cc',
        },
      },
    ];
  }

  /**
   * Build complete HTML page
   */
  private buildHTML(elements: any[], style: any[], graph: DependencyGraph): string {
    const elementsJson = JSON.stringify(elements, null, 2);
    const styleJson = JSON.stringify(style, null, 2);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Issue Dependency Graph</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.28.1/cytoscape.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    #header {
      background: #24292e;
      color: white;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    #header h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }

    #metrics {
      display: flex;
      gap: 30px;
      font-size: 14px;
    }

    #metrics .metric {
      display: flex;
      flex-direction: column;
    }

    #metrics .metric .label {
      color: #8b949e;
      font-size: 12px;
      margin-bottom: 4px;
    }

    #metrics .metric .value {
      font-size: 20px;
      font-weight: bold;
    }

    #cy {
      flex: 1;
      background: white;
    }

    #controls {
      background: white;
      padding: 15px 20px;
      border-top: 1px solid #e1e4e8;
      display: flex;
      gap: 15px;
      align-items: center;
    }

    button {
      background: #0366d6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    button:hover {
      background: #0256c7;
    }

    #info {
      position: fixed;
      top: 120px;
      right: 20px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 400px;
      display: none;
    }

    #info.show {
      display: block;
    }

    #info h3 {
      margin-bottom: 10px;
      color: #24292e;
    }

    #info .info-item {
      margin: 8px 0;
      font-size: 14px;
    }

    #info .info-item .label {
      font-weight: 600;
      color: #586069;
    }

    #info .close {
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      color: #586069;
      padding: 4px 8px;
    }

    .legend {
      display: flex;
      gap: 20px;
      font-size: 13px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 2px solid #333;
    }
  </style>
</head>
<body>
  <div id="header">
    <h1>GitHub Issue Dependency Graph</h1>
    <div id="metrics">
      <div class="metric">
        <span class="label">Total Issues</span>
        <span class="value">${graph.metrics.totalIssues}</span>
      </div>
      <div class="metric">
        <span class="label">Dependencies</span>
        <span class="value">${graph.metrics.totalDependencies}</span>
      </div>
    </div>
  </div>

  <div id="cy"></div>

  <div id="controls">
    <button onclick="resetView()">Reset View</button>
    <button onclick="fitToScreen()">Fit to Screen</button>
    <button onclick="exportPNG()">Export as PNG</button>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color" style="background: #74c0fc"></div>
        <span>Open</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #2da44e; border-color: #1a7f37"></div>
        <span>Closed</span>
      </div>
    </div>
  </div>

  <div id="info">
    <button class="close" onclick="closeInfo()">✕</button>
    <h3 id="info-title"></h3>
    <div id="info-content"></div>
  </div>

  <script>
    const cy = cytoscape({
      container: document.getElementById('cy'),
      elements: ${elementsJson},
      style: ${styleJson},
      layout: { name: 'preset' },
      wheelSensitivity: 0.2
    });

    // Smart layout: degree-tiered for main graph, pairs + singles off to the side
    (function layoutGraph() {

      // --- 1. Find connected components (undirected) ---
      function getComponents() {
        var visited = new Set();
        var components = [];
        cy.nodes().forEach(function(node) {
          if (visited.has(node.id())) return;
          var comp = [];
          var queue = [node];
          while (queue.length > 0) {
            var n = queue.shift();
            if (visited.has(n.id())) return;
            visited.add(n.id());
            comp.push(n);
            n.neighborhood('node').forEach(function(nb) {
              if (!visited.has(nb.id())) queue.push(nb);
            });
          }
          components.push(comp);
        });
        return components;
      }

      var components = getComponents();
      // Classify by component size
      var mainComps  = components.filter(function(c) { return c.length > 2; });
      var pairs      = components.filter(function(c) { return c.length === 2; });
      var singles    = components.filter(function(c) { return c.length === 1; });

      // --- 2. Layout main-graph nodes: tier rows by degree (high → top) ---
      var NODE_W = 240;
      var NODE_H = 70;
      var TIER_GAP = 50;   // vertical gap between tiers
      var COMP_GAP = 120;  // vertical gap between separate main components

      var mainBottomY = 60;

      mainComps.forEach(function(comp) {
        // Build degree-bucket tiers
        var tierMap = {};
        comp.forEach(function(n) {
          var d = n.degree();
          if (!tierMap[d]) tierMap[d] = [];
          tierMap[d].push(n);
        });
        // Sort tiers: highest degree first (top of screen)
        var tiers = Object.keys(tierMap)
          .map(Number)
          .sort(function(a, b) { return b - a; })
          .map(function(d) { return tierMap[d]; });

        var maxTierWidth = 0;
        tiers.forEach(function(t) {
          maxTierWidth = Math.max(maxTierWidth, t.length * NODE_W);
        });

        var y = mainBottomY;
        tiers.forEach(function(tier) {
          var totalW = tier.length * NODE_W;
          var startX = -totalW / 2 + NODE_W / 2;
          tier.forEach(function(n, i) {
            n.position({ x: startX + i * NODE_W, y: y });
          });
          y += NODE_H + TIER_GAP;
        });

        mainBottomY = y + COMP_GAP;
      });

      // Determine right-hand side x start from the widest main component
      var mainMaxX = 0;
      if (mainComps.length > 0) {
        mainComps.forEach(function(comp) {
          comp.forEach(function(n) {
            mainMaxX = Math.max(mainMaxX, n.position('x') + NODE_W / 2);
          });
        });
      }
      var sideX = mainMaxX + 180;
      var sideY = 60;

      // --- 3. Layout pairs: two nodes side-by-side, stacked vertically ---
      var PAIR_W = 240;
      var PAIR_GAP = 30;

      pairs.forEach(function(pair) {
        pair[0].position({ x: sideX,           y: sideY });
        pair[1].position({ x: sideX + PAIR_W,  y: sideY });
        sideY += NODE_H + PAIR_GAP;
      });

      // --- 4. Layout singles: 3-column grid below the pairs ---
      var singlesStartY = sideY + (pairs.length > 0 ? 40 : 0);
      var COLS = 3;
      var CELL_W = 220;
      var CELL_H = 90;

      singles.forEach(function(single, i) {
        single[0].position({
          x: sideX + (i % COLS) * CELL_W,
          y: singlesStartY + Math.floor(i / COLS) * CELL_H,
        });
      });

      cy.fit(null, 60);
    })();

    cy.on('tap', 'node', function(evt) {
      const node = evt.target;
      const data = node.data();

      document.getElementById('info-title').textContent = data.title;
      document.getElementById('info-content').innerHTML = \`
        <div class="info-item"><span class="label">Issue:</span> #\${data.id}</div>
        <div class="info-item"><span class="label">Assignees:</span> \${data.assignees || 'None'}</div>
        <div class="info-item"><span class="label">Labels:</span> \${data.labels || 'None'}</div>
        <div class="info-item"><a href="\${data.url}" target="_blank">View on GitHub →</a></div>
      \`;
      document.getElementById('info').classList.add('show');
    });

    function closeInfo() {
      document.getElementById('info').classList.remove('show');
    }

    function resetView() {
      cy.zoom(1);
      cy.center();
    }

    function fitToScreen() {
      cy.fit(null, 50);
    }

    function exportPNG() {
      const png = cy.png({ scale: 2 });
      const link = document.createElement('a');
      link.href = png;
      link.download = 'dependency-graph.png';
      link.click();
    }
  </script>
</body>
</html>`;
  }
}
