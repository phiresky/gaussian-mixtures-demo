import * as React from "react";
import * as ReactDOM from "react-dom";
import 'bootstrap';
import 'bootstrap/css/bootstrap.css!';
import * as $ from "jquery";
import Plotly from "plotly.js/dist/plotly";

function raw(literals: any, ...placeholders: any[]) {
	let result = "";
	for (let i = 0; i < placeholders.length; i++)
		result += literals.raw[i] + placeholders[i];
    return result + literals.raw[literals.length - 1];
}
const xMin = -6, yMin=-6, xMax = 6, yMax = 6, step = 0.2;
const gaussVarNames = "w,x,y,a,b,d".split(",");
const gaussMin = [0,xMin, yMin, -6,-6,-6];
const gaussMax = [2, xMax, yMax, 6,6,6];
const defaultConfig = {
	gausses: [
		[1.2, -2, 2, 1, 0, 3],
		[1.2, 2, 2, 1, 0, 3],
		[1.5, -2, -2, 2.5, -3, 6],
		[1.5, 2, -2, 2.5, 3, 6]
	]
};
type Config = typeof defaultConfig;

class Gauss {
	w: number;
	x: number;
    y: number;
    a: number;
    b: number;
    c: number;
    d: number;
    i11: number;
    i12: number;
    i21: number;
    i22: number;
    factor: number;
	constructor(conf: number[]) {
		[this.w, this.x, this.y, this.a, this.b, this.d] = conf;
		this.c = this.b;
		const a = this.a, b = this.b, c = this.c, d = this.d;

        const d6 = a * d - c * b;
        this.i11 = d / d6;
        this.i12 = (-1 * b) / d6;
        this.i22 = a / d6;
        this.i21 = (-1 * c) / d6;
        this.factor = this.w * 1.0 / Math.sqrt(39.478417604357432 * d6);
    }

    eval(x: number, y: number) {
        let d4 = 0.0;
        const dx = x - this.x;
        const dy = y - this.y;
        d4 = -0.5 * (dx * dx * this.i11 + dx * dy * this.i12 + dy * dx * this.i21 + dy * dy * this.i22);
        return this.factor * Math.exp(d4);
    }
}
class GaussGui extends React.Component<{ onVariableChange: (inx: number, val: string) => void, vals: (number|string)[] }, {}> {
	render() {
		const s = this.state;
		return (
			<div className="row">
				{this.props.vals.map((v, i) =>
					<div key={i} className="col-sm-2"><label>{" " + gaussVarNames[i] + " = "}
						<input type="number" className="number" value={v+""} onChange={ev => this.props.onVariableChange(i, (ev.target as any).value) } />
					</label>
					<input type="range" className="slider" value={v+""} step={0.1} min={gaussMin[i]} max={gaussMax[i]} 
						onChange={ev => this.props.onVariableChange(i, (ev.target as any).value) } />
					</div>
				) }
			</div>
		);
	}
}
class Gui extends React.Component<{}, Config> {
	leftGraph: any; rightGraph: any; foldGraph: any; slider: any;
	gaussInstances: Gauss[];
	constructor(props: {}) {
		super(props);
		this.state = defaultConfig;
		this.gaussInstances = this.state.gausses.map(g => new Gauss(g));
	}
	onChangeGauss(gauss: number, variable: string, value: string|number) {
		const gausses = this.state.gausses.slice();
		gausses[gauss] = gausses[gauss].slice();
		gausses[gauss][variable] = value;
		this.gaussInstances[gauss] = new Gauss(gausses[gauss].map(v => +v));
		this.setState({ gausses });
	}
	render() {
		return (
			<div>
				<div className="page-header"><h1>Gaussian Mixtures demo</h1></div>
				{this.state.gausses.map((gauss, i) => <GaussGui key={i} vals={gauss} onVariableChange={this.onChangeGauss.bind(this, i) } />) }
				<hr />
				<div ref="plot" />
				<footer><small><a href="https://github.com/phiresky/gaussian-mixtures-demo">Source on GitHub</a></small></footer>
			</div>
		)
	}
	componentDidMount() {
		console.log(this.refs["plot"]);
		Plotly.plot(this.refs["plot"], [], {
			//autosize: true, doesn't work
			width: 1000,
			height: 500,
			scene: {
				aspectmode: "manual",
				aspectratio: {x:1,y:1,z:0.3},
				zaxis:{range:[0,0.2]},
				camera:{eye:{y:1,x:1,z:0.6}, center:{x:0, y:0, z:-0.2}}
			},
			margin: {
				l: 0,
				r: 0,
				b: 0,
				t: 0
			}
		}, {displayModeBar: false});
		this.componentDidUpdate(null, null);
	}
	componentDidUpdate(prevProps: {}, prevState: Config) {
		const z:number[][] = [];
		const xcoords:number[] = [], ycoords: number[] = [];
		for(let y = yMin; y < yMax; y += step) {
			ycoords.push(y);
			const cur:number[] = [];
			for(let x = xMin; x < xMax; x += step) {
				xcoords.push(x);
				cur.push(this.gaussInstances.map(g => g.eval(x,y)).reduce((a,b)=>a+b));
			}
			z.push(cur);	
		}
		const plot = this.refs["plot"] as any;
		plot.data = [{
			x:xcoords,y:ycoords,z,
			type: 'surface'
		}];
		Plotly.redraw(plot);
	}
}

(window as any).gui = ReactDOM.render(<Gui/>, document.getElementById("reactContent"));
