
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

interface WorldMapProps {
  lat: number;
  lng: number;
}

const WorldMap: React.FC<WorldMapProps> = ({ lat, lng }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 450;
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('width', '100%')
      .style('height', 'auto');

    svg.selectAll('*').remove();

    const projection = d3.geoMercator()
      .scale(130)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    // Fetch world map data
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data: any) => {
      const countries = feature(data, data.objects.countries) as any;

      svg.append('g')
        .selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', '#1e293b')
        .attr('stroke', '#334155')
        .attr('stroke-width', 0.5);

      // Add the marker
      const [x, y] = projection([lng, lat]) || [0, 0];

      // Pulsing effect
      const markerGroup = svg.append('g');

      markerGroup.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 8)
        .attr('fill', '#38bdf8')
        .attr('opacity', 0.3)
        .append('animate')
          .attr('attributeName', 'r')
          .attr('values', '8;15;8')
          .attr('dur', '2s')
          .attr('repeatCount', 'indefinite');

      markerGroup.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4)
        .attr('fill', '#0ea5e9');
    });
  }, [lat, lng]);

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default WorldMap;
