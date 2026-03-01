/**
 * Chart Parsing Module
 * 
 * Parses Word charts and converts them to visualization formats.
 */

export interface ChartData {
  title?: string;
  type: ChartType;
  categories: string[];
  series: ChartSeries[];
}

export type ChartType = 
  | 'bar' 
  | 'column' 
  | 'line' 
  | 'pie' 
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'radar'
  | 'stock';

export interface ChartSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface EChartsOption {
  title?: { text?: string; left?: string | number };
  tooltip?: Record<string, unknown>;
  legend?: Record<string, unknown>;
  xAxis?: Record<string, unknown> | Record<string, unknown>[];
  yAxis?: Record<string, unknown> | Record<string, unknown>[];
  series?: Record<string, unknown>[];
}

export interface ParsedChart {
  success: boolean;
  chartData?: ChartData;
  echartsOption?: EChartsOption;
  error?: string;
}

class ChartParser {
  /**
   * Parse chart data from Word XML
   */
  parseFromWordXML(xml: string): ParsedChart {
    try {
      const chartData = this.extractChartData(xml);
      if (!chartData) {
        return { success: false, error: 'No chart data found' };
      }

      const echartsOption = this.toECharts(chartData);
      
      return {
        success: true,
        chartData,
        echartsOption
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Parse error'
      };
    }
  }

  /**
   * Extract chart data from XML
   */
  private extractChartData(xml: string): ChartData | null {
    // Check if this is a chart
    if (!xml.includes('<c:chart') && !xml.includes('Chart')) return null;

    // Extract chart type
    const typeMatch = xml.match(/<c:type>([^<]+)<\/c:type>/);
    const type = this.mapChartType(typeMatch?.[1] || 'bar');

    // Extract title
    const titleMatch = xml.match(/<c:title[^>]*>[^<]*<c:t>([^<]+)<\/c:t>/);
    const title = titleMatch?.[1];

    // Extract categories (X axis)
    const categories = this.extractCategories(xml);

    // Extract series
    const series = this.extractSeries(xml);

    if (categories.length === 0 && series.length === 0) {
      return null;
    }

    return {
      title,
      type,
      categories,
      series
    };
  }

  /**
   * Extract categories
   */
  private extractCategories(xml: string): string[] {
    const categories: string[] = [];
    const catStart = xml.indexOf('<c:cat>');
    if (catStart === -1) return categories;

    const catEnd = xml.indexOf('</c:cat>', catStart);
    const catSection = xml.slice(catStart, catEnd + 7);

    const ptMatches = catSection.matchAll(/<c:pt[^>]*><c:v>([^<]+)<\/c:v>/g);
    for (const match of ptMatches) {
      categories.push(match[1]);
    }

    return categories;
  }

  /**
   * Extract series data
   */
  private extractSeries(xml: string): ChartSeries[] {
    const series: ChartSeries[] = [];
    
    // Find all series sections
    let serStart = xml.indexOf('<c:ser>');
    while (serStart !== -1) {
      const serEnd = xml.indexOf('</c:ser>', serStart);
      if (serEnd === -1) break;
      
      const serXml = xml.slice(serStart, serEnd + 8);
      
      // Get series name
      const nameMatch = serXml.match(/<c:tx[^>]*>(?:[^<]*<c:v>([^<]+)<\/c:v>)?/);
      const name = nameMatch?.[1] || `Series ${series.length + 1}`;

      // Get values
      const values: number[] = [];
      const valMatches = serXml.matchAll(/<c:pt[^>]*idx="(\d+)"[^>]*>[^<]*<c:v>([^<]+)<\/c:v>/g);
      
      for (const match of valMatches) {
        const idx = parseInt(match[1]);
        const value = parseFloat(match[2]);
        if (!isNaN(value)) {
          values[idx] = value;
        }
      }

      if (values.length > 0) {
        series.push({ name, values: values.filter(v => v !== undefined) });
      }

      serStart = xml.indexOf('<c:ser>', serEnd);
    }

    return series;
  }

  /**
   * Map Word chart type to our type
   */
  private mapChartType(wordType: string): ChartType {
    const mapping: Record<string, ChartType> = {
      'bar': 'bar',
      'barClustered': 'bar',
      'barStacked': 'bar',
      'col': 'column',
      'colClustered': 'column',
      'colStacked': 'column',
      'line': 'line',
      'lineMarkers': 'line',
      'pie': 'pie',
      'pie3d': 'pie',
      'doughnut': 'doughnut',
      'area': 'area',
      'areaStacked': 'area',
      'scatter': 'scatter',
      'scatterMarker': 'scatter',
      'radar': 'radar',
      'radarMarkers': 'radar'
    };

    return mapping[wordType.toLowerCase()] || 'bar';
  }

  /**
   * Convert to ECharts option
   */
  toECharts(chartData: ChartData): EChartsOption {
    const { title, type, categories, series } = chartData;
    
    const option: EChartsOption = {
      title: title ? { text: title, left: 'center' } : undefined,
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      series: series.map(s => ({
        name: s.name,
        type: this.toEChartsType(type),
        data: s.values,
        emphasis: { focus: 'series' }
      }))
    };

    // Add X axis for appropriate chart types
    if (['bar', 'column', 'line', 'area'].includes(type)) {
      option.xAxis = { type: 'category', data: categories };
      option.yAxis = { type: 'value' };
    } else if (type === 'pie' || type === 'doughnut') {
      option.series = series.map(s => ({
        name: s.name,
        type: 'pie',
        data: categories.map((c, i) => ({ name: c, value: s.values[i] })),
        radius: type === 'doughnut' ? ['40%', '70%'] : '50%'
      }));
      delete option.xAxis;
      delete option.yAxis;
    }

    return option;
  }

  /**
   * Map our type to ECharts type
   */
  private toEChartsType(type: ChartType): string {
    const mapping: Record<string, string> = {
      'bar': 'bar',
      'column': 'bar',
      'line': 'line',
      'pie': 'pie',
      'doughnut': 'pie',
      'area': 'line',
      'scatter': 'scatter',
      'radar': 'radar',
      'stock': 'line'
    };
    return mapping[type] || 'bar';
  }

  /**
   * Convert to Chart.js format
   */
  toChartJS(chartData: ChartData): Record<string, unknown> {
    const { type, categories, series } = chartData;
    
    return {
      type: this.toChartJSType(type),
      data: {
        labels: categories,
        datasets: series.map(s => ({
          label: s.name,
          data: s.values,
          backgroundColor: this.generateColors(s.values.length),
          borderColor: this.generateColors(s.values.length, 1),
          borderWidth: 1
        }))
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: !!chartData.title, text: chartData.title }
        }
      }
    };
  }

  /**
   * Map to Chart.js type
   */
  private toChartJSType(type: ChartType): string {
    const mapping: Record<string, string> = {
      'bar': 'bar',
      'column': 'bar',
      'line': 'line',
      'pie': 'pie',
      'doughnut': 'doughnut',
      'area': 'line',
      'scatter': 'scatter',
      'radar': 'radar'
    };
    return mapping[type] || 'bar';
  }

  /**
   * Generate colors for charts
   */
  private generateColors(count: number, alpha?: number): string | string[] {
    const baseColors = [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 206, 86)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)',
      'rgb(199, 199, 199)',
      'rgb(83, 102, 255)',
      'rgb(40, 159, 64)',
      'rgb(210, 99, 132)'
    ];
    
    const suffix = alpha !== undefined ? alpha : 0.2;
    const actualColors = baseColors.map(c => {
      if (suffix === 0.2) return c.replace('rgb', 'rgba').replace(')', ', 0.2)');
      if (suffix === 1) return c;
      return c.replace('rgb', 'rgba').replace(')', `, ${suffix})`);
    });
    
    return count === 1 ? actualColors[0] : actualColors.slice(0, count);
  }
}

export function parseChart(xml: string): ParsedChart {
  const parser = new ChartParser();
  return parser.parseFromWordXML(xml);
}

export function toECharts(chartData: ChartData): EChartsOption {
  const parser = new ChartParser();
  return parser.toECharts(chartData);
}

export function toChartJS(chartData: ChartData): Record<string, unknown> {
  const parser = new ChartParser();
  return parser.toChartJS(chartData);
}

export { ChartParser };
