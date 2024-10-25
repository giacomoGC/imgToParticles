import * as d3 from 'd3-delaunay';

export default function calculateVoronoiCells(offsets, width, height, numPoints) {
  const points = [];

  // Convert the 2D offsets into a format suitable for Voronoi
  for (let i = 0; i < numPoints; i++) {
    points.push([offsets[i * 3], offsets[i * 3 + 1]]);
  }

  // Generate Delaunay triangulation and Voronoi diagram
  const delaunay = d3.Delaunay.from(points);
  const voronoi = delaunay.voronoi([0, 0, width, height]);

  return voronoi;
}