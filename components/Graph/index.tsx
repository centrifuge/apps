import * as React from 'react';
import { Line } from 'react-chartjs-2';

interface XValueSet {
  data: string[];
  backgroundColor: string;
  label: string;
}

export interface TimeSeriesData {
  labels: string[];
  xValues: XValueSet[];
}

const defaultLineData = {
  fill: false,
  lineTension: 0.1,
  pointHoverBorderColor: 'rgba(220,220,220,1)',
  borderCapStyle: 'butt',
  borderDash: [],
  borderDashOffset: 0.0,
  borderJoinStyle: 'miter',
  pointBackgroundColor: '#fff',
  pointBorderWidth: 1,
  pointHoverRadius: 5,
  pointHoverBorderWidth: 2,
  pointRadius: 1,
  pointHitRadius: 10
};

const defaultLineOptions = {
  scales: {
    yAxes: [
      {
        scaleLabel:{
          labelString: "DAI",
          fontSize: 14,
          display: true
        }
        
      }
    ],
    xAxes: [
      {
        gridLines: {
          display: false
        }
      }
    ]
  }
};

interface Props {
  timeSeriesData: TimeSeriesData;
}

export class Graph extends React.Component<Props> {
  state = { active: undefined };
  componentDidMount() {
  }

  render() {
    const { labels, xValues } = this.props.timeSeriesData;
    const datasets = xValues.map((xValueSet: XValueSet) => {
      return {
        ...xValueSet,
        ...defaultLineData,
        borderColor: xValueSet.backgroundColor,
        pointBorderColor: xValueSet.backgroundColor,
        pointHoverBackgroundColor: xValueSet.backgroundColor,
        pointHoverBorderColor: xValueSet.backgroundColor,
      };
    });

    const graphData = {
      labels,
      datasets
    };

    return (
      <Line height={100} data={graphData} options={defaultLineOptions} />
    );
  }
}
