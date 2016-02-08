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
const xMin = -6, yMin = -6, xMax = 6, yMax = 6, step = 0.2;
const gaussVarNames = "w,x,y,a,b,d".split(",");
enum GaussVars { w, x, y, a, b, d }
const gaussMin = [0, xMin, yMin, -6, -6, -6];
const gaussMax = [2, xMax, yMax, 6, 6, 6];
const defaultGausses = [
	[1.2, -2, 2, 1, 0, 3],
	[1.5, 2, -2, 2.5, 3, 6],
	[1.2, 2, 2, 1, 0, 3],
	[1.5, -2, -2, 2.5, -3, 6],
];
const defaultNewGauss = () => [0.5,
	Math.random() * (xMax - xMin) + xMin,
	Math.random() * (yMax - yMin) + yMin, 1, 0, 1].map(x => +x.toFixed(1));
const defaultConfig = {
	gausses: defaultGausses.slice(0, 2),
	errors: [false, false]
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

        const determinant = a * d - c * b;
        this.i11 = d / determinant;
        this.i12 = -b / determinant;
        this.i22 = a / determinant;
        this.i21 = -c / determinant;
        this.factor = this.w / Math.sqrt(39.478417604357432 * determinant);
    }

    eval(x: number, y: number) {
        const dx = x - this.x;
        const dy = y - this.y;
        const d = -0.5 * (dx * dx * this.i11 + dx * dy * this.i12 + dy * dx * this.i21 + dy * dy * this.i22);
        return this.factor * Math.exp(d);
    }
}
class GaussGui extends React.Component<{ onVariableChange: (inx: number, val: string) => void, vals: (number | string)[], name: string }, {}> {
	render() {
		const s = this.state;
		const vals = this.props.vals;
		const invalid = (+vals[GaussVars.a] * +vals[GaussVars.d] - (+vals[GaussVars.b]) ** 2) <= 0; // determinant ≤ 0
		return (
			<div className={`row ${invalid ? 'alert-danger' : ''}`}>
				{vals.map((v, i) =>
					<div key={i} className="col-sm-2"><label>{(i == 0 ? this.props.name : "") + " " + gaussVarNames[i] + " = "}
						<input type="number" className="number" value={v + ""} onChange={ev => this.props.onVariableChange(i, (ev.target as any).value) } />
					</label>
						<input type="range" className="slider" value={v + ""} step={0.1} min={gaussMin[i]} max={gaussMax[i]}
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
	onChangeGauss(i: number, variable: string, value: string | number) {
		const gausses = this.state.gausses.slice();
		gausses[i] = gausses[i].slice();
		gausses[i][variable] = value;
		this.gaussInstances[i] = new Gauss(gausses[i].map(v => +v));

		this.setState({ gausses });
	}
	onAddGauss() {
		const gausses = this.state.gausses.slice();
		const i = gausses.length;
		gausses.push((defaultGausses[i] || defaultNewGauss()).slice());
		this.gaussInstances[i] = new Gauss(gausses[i].map(v => +v));
		this.setState({ gausses });
	}
	onRemoveGauss() {
		if (this.state.gausses.length <= 1) return;
		this.gaussInstances.pop();
		this.setState({ gausses: this.state.gausses.slice(0, this.state.gausses.length - 1) });
	}
	render() {
		return (
			<div>
				<div className="page-header"><h1>Gaussian Mixtures demo</h1></div>
				<div className="row" style={{ marginBottom: 10 }}>
					<button className="btn btn-default" onClick={this.onAddGauss.bind(this) }>Add</button>{" "}
					<button className="btn btn-default" onClick={this.onRemoveGauss.bind(this) }>Remove</button>
				</div>
				{this.state.gausses.map((gauss, i) => <GaussGui key={i} name={1 + i + "."} vals={gauss} onVariableChange={this.onChangeGauss.bind(this, i) } />) }
				<hr />
				<div ref="plot" />
				<footer><small><a href="https://github.com/phiresky/gaussian-mixtures-demo">Source on GitHub</a></small></footer>
			</div>
		)
	}
	componentDidMount() {
		Plotly.plot(this.refs["plot"], [], {
			//autosize: true, doesn't work
			width: 1000,
			height: 500,
			scene: {
				aspectmode: "manual",
				aspectratio: { x: 1, y: 1, z: 0.3 },
				zaxis: { range: [0, 0.2] },
				camera: { eye: { y: 1, x: 1, z: 0.6 }, center: { x: 0, y: 0, z: -0.2 } }
			},
			margin: { l: 0, r: 0, b: 0, t: 0 }
		}, { displayModeBar: false });
		this.componentDidUpdate(null, null);
	}
	componentDidUpdate(prevProps: {}, prevState: Config) {
		const plot = this.refs["plot"] as any;
		const xCount = (xMax - xMin) / step, yCount = (yMax - yMin) / step;
		const z: number[][] = plot.data.z || new Array(yCount);
		const xcoords: number[] = plot.data.x || new Array(xCount),
			ycoords: number[] = plot.data.y || new Array(yCount);
		let yi = 0, xi = 0;
		for (let y = yMin; y < yMax; y += step) {
			ycoords[yi] = y;
			const cur: number[] = z[yi] || (z[yi] = new Array(xCount));
			for (let x = xMin; x < xMax; x += step) {
				xcoords[xi] = x;
				let sum = 0;
				for (const g of this.gaussInstances) {
					const v = g.eval(x, y);
					if (!isNaN(v)) sum += v;
				}
				cur.push(sum);
				xi++;
			}
			yi++;
		}
		plot.data = [{
			x: xcoords, y: ycoords, z,
			type: 'surface'
		}];
		Plotly.redraw(plot);
	}
}

(window as any).gui = ReactDOM.render(<Gui/>, document.getElementById("reactContent"));
