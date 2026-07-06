function generateValues(start,stop,step) {
	var ret = Array.from({length:(stop-start)/step+1},function(value, index) {return (start + (index) * step);});
	return ret;
}
	
function generateValues2(start,stop,step) {
	var ret = [];
	var value = start;
	ret.push(value);
	do {
		value += step;
		ret.push(value);
	}while (value < stop);
	return ret;
}	

function mean(array) {
	//Assumes array with length >= 1
	return array.reduce(function(sum,item){return sum + item},0)/array.length;
}

function standardDeviation(array) {
	//Assumes array with length >= 1
	if ((!array)||(array.length == 0)) return 0;
	var m = mean(array);
	return Math.sqrt(array.reduce(function(sumSqr,item){return sumSqr + (item - m)**2;},0)/array.length);
}

function now() {
	return (new Date()).getTime()
}

//Obtained from https://bito.ai/resources/rgb-to-hex-javascript-javascript-explained/
function rgbToHex(color) {
  let red = color['r'].toString(16).padStart(2,'0'); // FF
  let green = color['g'].toString(16).padStart(2,'0'); // C0
  let blue = color['b'].toString(16).padStart(2,'0'); // CB
  return '#' + red + green + blue; // #FFC0CB
}

//Obtained from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}


//Adapted from https://stackoverflow.com/questions/35753003/how-to-generate-a-list-of-successive-colors-in-javascript
function buildColors(start, end, n) {
	var startRGB = hexToRgb(start);
	var endRGB = hexToRgb(end);
	//Distance between each color
    var steps = {
		r: (endRGB['r']-startRGB['r'])/n,  
    	g: (endRGB['g']-startRGB['g'])/n,  
		b: (endRGB['b']-startRGB['b'])/n  
	};
    //Build array of colors
    var colors = [startRGB];
    for(var ii = 0; ii < n - 1; ++ii) {
      colors.push({
        r: Math.floor(colors[ii]['r'] + steps['r']),
        g: Math.floor(colors[ii]['g'] + steps['g']),
        b: Math.floor(colors[ii]['b'] + steps['b'])
      });
    }
    return colors.map(function(color){return rgbToHex(color);});
  };

/*

function euclideanDistance(i,j,coordsHeader) {
	var distance = 0;
	coordsHeader.forEach(function(d){ distance += Math.pow((+i[d])-(+j[d]),2); });
	return Math.sqrt(distance);
}

function GDVariability(solution,completeData,selectedMeasure,selectedFunction,selectedTimestamp) {
	//Extracting pareto front.
	var linesPerDL = d3.nest()
						.key(function(d) {return +d[selectedMeasure+'-'+selectedFunction+'-'+selectedTimestamp];})
						.entries(completeData);
	var paretoFront = linesPerDL.sort(function(a,b){return ((+a.key)-(+b.key));})[0].values;
	
	var coordsHeader = d3.keys(paretoFront[0]).filter(function(d){return d.startsWith('x')});
	var initialDistance = euclideanDistance(solution,paretoFront[0],coordsHeader);
	
	var closestParetoFrontElement = {
			'elem': paretoFront[0],
			'distance': initialDistance
	};	
	paretoFront.forEach(function(paretoElement,i,a){
		var dist = euclideanDistance(solution,paretoElement,coordsHeader);
		if (dist < closestParetoFrontElement.distance) {
			closestParetoFrontElement.elem = paretoElement;
			closestParetoFrontElement.distance = dist;
		}
	});
	return closestParetoFrontElement;
}

function calculateGD(completeData,selectedMeasure,selectedFunction) {
	//Get all timestamps
	var tsValues = d3.keys(completeData[0]).filter(function(d){return d.startsWith('f1');}).map(function(d,i){return i;});
	//Get coordinates columns
	var coordsHeader = d3.keys(completeData[0]).filter(function(d){return d.startsWith('x')});
	
	tsValues.forEach(function(ts){
		var linesPerMeasure = d3.nest()
						.key(function(d) {return +d[selectedMeasure+'-'+selectedFunction+'-'+ts];})
						.entries(completeData);
		var paretoFront = linesPerMeasure.sort(function(a,b){return ((+a.key)-(+b.key));})[0].values;
		
		completeData.forEach(function(solution){
			var initialDistance = euclideanDistance(solution,paretoFront[0],coordsHeader);
			var closestParetoFrontElement = {'elem': paretoFront[0],'distance': initialDistance};	
			paretoFront.forEach(function(paretoElement){
				var dist = euclideanDistance(solution,paretoElement,coordsHeader);
				if (dist < closestParetoFrontElement.distance) {
					closestParetoFrontElement.elem = paretoElement;
					closestParetoFrontElement.distance = dist;
				}
			});
			solution['gd-'+selectedFunction+'-'+ts] = closestParetoFrontElement.distance;
		});
	});
}

function exportToCsv(filename,rows) {
	var processRow = function(row) {
		var finalVal = '';
		for (const[key,vl] of Object.entries(row)) {
			finalVal += vl + ',';
		}
		finalVal = finalVal.slice(0,-1);
		return finalVal + '\n';
	};

	var csvFile = '';
	for (const[key,vl] of Object.entries(rows[0]))
		csvFile += key + ',';
	csvFile = csvFile.slice(0,-1) + '\n';
		
	for (var i = 0; i < rows.length; i++) {
		csvFile += processRow(rows[i]);
	}
	
	var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
	if (navigator.msSaveBlob) { // IE 10+
		navigator.msSaveBlob(blob, filename);
	} else {
		var link = document.createElement("a");
		if (link.download !== undefined) { // feature detection
			// Browsers that support HTML5 download attribute
			var url = URL.createObjectURL(blob);
			link.setAttribute("href", url);
			link.setAttribute("download", filename);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}
}

*/