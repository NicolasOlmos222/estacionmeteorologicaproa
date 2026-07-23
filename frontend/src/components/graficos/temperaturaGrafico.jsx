/* App.js */

//var CanvasJSReact = require('@canvasjs/react-charts');

var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

class App extends Component {	
	render() {
		const options = {
			animationEnabled: true,
			theme: "light2",
			title: {
				text: "Temperatura en las últimas 24 horas"
			},
			axisY: {
				title: "Temperatura °C",
				logarithmic: true
			},
			data: [{
				type: "spline",
				showInLegend: true,
				legendText: "Temperatura en grados celcius por hora",
				dataPoints: [
                    clima.temperatura(id)
				  { x: new Date(2001, 0), y: temperatura},
				]
			}]
		}

		return (
		<div>
			<CanvasJSChart options = {options} 
				onRef={ref => this.chart = ref}
			/>
			{/*You can get reference to the chart instance as shown above using onRef. This allows you to access all chart properties and methods*/}
		</div>
		);
	}
}

export default App;                              