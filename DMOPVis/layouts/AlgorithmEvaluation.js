function roundToString(num, precision) {
	const factor = Math.pow(10,precision);
	var roundedNumber = (Math.round(num*factor)/factor).toFixed(precision);	
	var ret = roundedNumber.slice(0,-1);
	var lastDigit = parseInt(roundedNumber.slice(-1));
	if ((lastDigit >= 1)&&(lastDigit <= 4)) lastDigit = 0;
	else if ((lastDigit >= 6)&&(lastDigit <= 9)) lastDigit = 5;
	return ret+lastDigit.toString();
}

function fillSolutionAlgorithmData(results,resultsFilename,decisionVariables) {
	//I'm working with a resolution of 0.005, so I have to round solutions to fit this resolution. 
	//A possible solution in this case would be consider all solutions in the [0.000,0.005) (at most 4 solutions) as 0.000.
	//In this case, I shall find a way to show these intermediate solutions (maybe show the average function value.
	var resultsBySolution = d3.group(results,
										function(d){return roundToString(+d[decisionVariables[0]],3)+','+roundToString(+d[decisionVariables[1]],3);},
										function(d){return d['ts'];});
	
	d3.select('#variationChartG').selectAll('rect').each(function(d,i) {
		var coord = roundToString(+d[decisionVariables[0]],3)+','+roundToString(+d[decisionVariables[1]],3);
		if (resultsBySolution.has(coord)) {
			var rect = d3.select(this);
			var value = resultsBySolution.get(coord);
			d['algData-'+resultsFilename] = value;
		}
	});
}

function fillLineVariationChartAlgorithm(algName,decisionVariables,selectedSeries) {
	d3.selectAll('#lineVariationChartG').selectAll('.serieComponent').remove(); //removing all series 
	if ((!selectedSeries)||(Object.keys(selectedSeries).length == 0)) return; //nothing to show!
	
	//Axis
	var timestamps = Object.keys(selectedSeries[Object.keys(selectedSeries)[0]].filteredValues);
	var xValues = timestamps.map(function(d){return +d.substring(2);});
	var xScale = d3.scalePoint().domain(xValues).range([0,widthLineVariationChart]);
	var xAxis = d3.axisBottom().scale(xScale).tickValues(xValues);
	
	d3.select('#lineVariationXAxisG').call(xAxis);
	var allValues = [];
	var max = Number.MIN_SAFE_INTEGER;
	var measureConsidered = d3.select('#measureSelect2D').node().value;
	
	var globalScale = d3.select('#globalScaleInput').property('checked');
	if (globalScale) {
		var rects = d3.select('#variationChartG').selectAll('rect');
		var columns = null;
		rects.each(function(d,i){
			if (d['algData-'+algName] != null) {
				d['algData-'+algName].forEach(function(e){
					max = Math.max(max,e.length);
				});
			}
		})
	}else {
		for (value of Object.values(selectedSeries)) {
			var columns = Object.values(value.filteredValues).map(function(d){return +d['ngens'];});
			columns.forEach(function(d){max = Math.max(max,d);});
		}
	}
	var yScale = d3.scaleLinear().domain([0,max]).range([heightLineVariationChart,0]).nice();
	var yAxis = d3.axisLeft().scale(yScale).tickValues(generateValues(0,max,(max/numTicks)));
	d3.select('#lineVariationYAxisG').call(yAxis);
	
	var line = d3.line().x(function(d){return 32+xScale(+d[0].substring(2));});
	
	line.y(function(d){return 10+yScale(+d[1]['ngens']);});
			
	var vertexScale = function(measure) {
		return {x:32+xScale(+measure[0].substring(2)),y:10+yScale(+measure[1]['ngens'])};
	}
	
	d3.select('#lineVariationChartG').selectAll('.serieComponent').data(Object.entries(selectedSeries)).enter()
		.append('g')
			.classed('serieComponent',true)
			.attr('id',function(d){return 'serieComponent-'+d[0];})
			.attr('solutionId',function(d){return d[0];})
			.append('path')
				.classed('serie',true)
				.classed('selected',true)
				.attr('id',function(d){return 'serie-'+d[0];})
				.attr('d',function(d,i){return line(Object.entries(d[1].filteredValues));})
				.attr('stroke',function(d,i){return seriesColors[d[0]];})
				.attr('color',function(d,i){return seriesColors[d[0]];})
				.attr('stroke-width','2.5px')
				.attr('fill','none')
				.on('mouseover',function(ev,d) {
					var valuesToShow = Object.entries(d[1].filteredValues).map(function(d){
						var text = d[0]+': '+d[1]['ngens'].toFixed(3);
						if (d[1]['ngens'] == 1)
							text = '<font color="yellow">'+text+'</font>';
						return text;
					});
					var title = '<strong>'+d[0]+' ('+d[1][decisionVariables[0]]+','+d[1][decisionVariables[1]]+')</strong>';
					var tooltipInfo = {
						msg: title+'<br>'+valuesToShow.join().replace(/,/g,'<br>'),
						width: 4.2*title.length,
						height: 14*(Object.entries(d[1].filteredValues).length+1) //I add 1 to include the id, which is not an entry of vl.
					};
					overSerie(null,ev,d[0],tooltipInfo,true);
				})
				.on('mouseout',function(ev,d) {
					overSerie(null,ev,d[0],null,false);
				});
		d3.select('#lineVariationChartG').selectAll('.serieComponent').selectAll('.vertex').data(function(d){return Object.entries(d[1].filteredValues);}).enter()
				.append('circle')
					.classed('vertex',true)
					.classed('selected',true)
					.attr('id',function(d,i){return 'vertex-'+d3.select(this.parentNode).attr('solutionId')+'-'+i;})
					.attr('cx',function(d){return vertexScale(d).x;})
					.attr('cy',function(d){return vertexScale(d).y;})
					.attr('r',function(d) {
						return sizeVertex;
					})
					.attr('stroke',function(d) {
						return d3.select(this.parentNode).select('#serie-'+d3.select(this.parentNode).attr('solutionId')).attr('color');
					})
					.attr('fill',function(d) {
						return d3.select(this.parentNode).select('#serie-'+d3.select(this.parentNode).attr('solutionId')).attr('color');
					})
					.attr('color',function(d) {return d3.select(this.parentNode).select('#serie-'+d3.select(this.parentNode).attr('solutionId')).attr('color');})
					.on('mouseover',function(ev,d) {
						var text = d[0]+': '+d[1]['ngens'].toFixed(3);
						var textLength = text.length;
						if (d[1]['gens'].length > 0) {
							textLength = Math.max('Generations: '.length,textLength);
							text += '<br>Generations: <br>'
							d[1]['gens'].forEach(function(g){
								var ltext = g['gen'] + ' (';
								decisionVariables.forEach(function(dv){ltext += ' '+g[dv]+' ';});
								ltext += ')';
								textLength = Math.max(ltext.length,textLength);
								text += ltext + '<br>'
							});
						}
						var tooltipInfo = {
							msg: text,
							width: 6.2*textLength,
							height: 22 + (d[1]['gens'].length*16)
						};
						overPoint(null,ev,d3.select(this).attr('id'),tooltipInfo,true);
					})
					.on('mouseout',function(ev,d) {
						overPoint(null,ev,d3.select(this).attr('id'),'',false);
					})
}

function updateLineVariationChartScaleAlgorithm(algName,globalScale,selectedSeries) {
	var max = Number.MIN_SAFE_INTEGER;
	if ((!selectedSeries)||(Object.keys(selectedSeries).length == 0)) return; //nothing to show!
	
	//Axis
	var timestamps = Object.keys(selectedSeries[Object.keys(selectedSeries)[0]].filteredValues);
	var xValues = timestamps.map(function(d){return +d.substring(2);});
	var xScale = d3.scalePoint().domain(xValues).range([0,widthLineVariationChart]);
	
	if (globalScale) {
		var rects = d3.select('#variationChartG').selectAll('rect');
		var columns = null;
		rects.each(function(d){
			if (d['algData-'+algName] != null) {
				d['algData-'+algName].forEach(function(e){
					max = Math.max(max,e.length);
				});
			}
		});
	}else {
		for (value of Object.values(selectedSeries)) {
			var columns = Object.values(value.filteredValues).map(function(d){return +d['ngens'];});
			columns.forEach(function(d){max = Math.max(max,d);});
		}
	}
	var yScale = d3.scaleLinear().domain([0,max]).range([heightLineVariationChart,0]).nice();
	
	var yAxis = d3.axisLeft().scale(yScale).tickValues(generateValues(0,max,(max/numTicks)));
	d3.select('#lineVariationYAxisG').call(yAxis);
	
	var line = d3.line()
			.x(function(d){return 32+xScale(+d[0].substring(2));})
			.y(function(d){return 10+yScale(+d[1]['ngens']);});
	
	var vertexScale = function(measure) {
		return {x:32+xScale(+measure[0].substring(2)),y:10+yScale(+measure[1]['ngens'])};
	}
			
	var serieComponents = d3.select('#lineVariationChartG').selectAll('.serieComponent');	
	serieComponents.selectAll('path').attr('d',function(d,i){return line(Object.entries(d[1].filteredValues));});	
	serieComponents.selectAll('.vertex').attr('cy',function(d){return vertexScale(d).y;});
}

//Solution selection distribution Chart Parameters
var widthSelectionDistributionChart = 400;
var heightSelectionDistributionChart = 500;

function buildSelectionDistributionChart(div) {
	
	var selectionDistributionChartDiv = d3.select('#'+div);
	if (selectionDistributionChartDiv.empty()) {
		d3.select('#LineVariationChartCel').append('br');
		d3.select('#LineVariationChartCel').append('br');
		selectionDistributionChartDiv = d3.select('#LineVariationChartCel')
												.append('div')
												.attr('id',div)
												.attr('class','layout')
												.style('height',heightSelectionDistributionChart+'px');
	}
	
	//Title
	selectionDistributionChartDiv.selectAll("*").remove();
	selectionDistributionChartDiv.append('text').classed('title',true).text('Selection Distribution');
	selectionDistributionChartDiv.append('br');
	
	//Lines area
	var selectionDistributionChartSVG = selectionDistributionChartDiv.append('svg').attr('id','selectionDistributionChartSVG')
										 .attr('width',widthSelectionDistributionChart+60)
	var selectionDistributionChartG = selectionDistributionChartSVG.append('g').attr('id','selectionDistributionChartG')
										 .attr('transform','translate(' + 10 + ',' + 10 + ')');
	
}

function fillSelectionDistributionChart(algName,decisionVariables,selectedSeries,numGenerations) {
	
	d3.selectAll('#selectionDistributionChartG').selectAll('.serieComponent').remove(); //removing all series 
	if ((!selectedSeries)||(Object.keys(selectedSeries).length == 0)) {
		selectionDistributionChartSVG = d3.select('#selectionDistributionChartSVG')
									.attr('height',0+'px');
		return; //nothing to show!
	}
	//Vertical labels: timestamps
	var timestamps = Object.keys(selectedSeries[Object.keys(selectedSeries)[0]].filteredValues);
	var yValues = timestamps.map(function(d){return +d.substring(2);});
	var yScale = d3.scalePoint().domain(yValues).range([0,heightSelectionDistributionChart]);
	
	//Horizontal labels: generations
	var xValues = Array.from(Array(numGenerations).keys());
	var xScale = d3.scalePoint().domain(xValues).range([0,widthSelectionDistributionChart]);
	
	var allValues = [];
	var max = Number.MIN_SAFE_INTEGER;
	
	var selectedMeasure = d3.select('#measureSelect2D').node().value;
	
	var sizeChart = 28+timestamps.length*10;
	var numberCharts = Object.entries(selectedSeries).length;
	
	//Adjusting height of window according to the number of solutions to be shown.
	selectionDistributionChartDiv = d3.select('#SelectionDistributionChart')
									.style('height',heightSelectionDistributionChart+'px')
									.style('width',widthSelectionDistributionChart+60+'px')
									.style('overflow-y','auto')
									.style('overflow-x','none');
	
	selectionDistributionChartSVG = d3.select('#selectionDistributionChartSVG')
									.attr('width',widthSelectionDistributionChart)
									.attr('height',(numberCharts*sizeChart));
	
	d3.select('#selectionDistributionChartG').selectAll('.serieComponent').data(Object.entries(selectedSeries)).enter()
		.append('g')
			.classed('serieComponent',true)
			.attr('id',function(d){return 'serieComponent-'+d[0];})
			.attr('solutionId',function(d){return d[0];})
			.attr('transform',function(d,i){
								return 'translate('+0+','+i*sizeChart+')';
							  })
			.append('text').classed('solutionLabel',true).text(function(d){
				var coord = '(';
				decisionVariables.forEach(function(dv){coord += d[1][dv]+','});
				coord = coord.slice(0,-1) + ')';
				return coord;
			})

	d3.select('#selectionDistributionChartG').selectAll('.serieComponent').each(
		function(s) {
			var serieComponent = d3.select(this);
			var solutionId = serieComponent.attr('solutionId');
			serieComponent.selectAll('ts').data(Object.entries(s[1]['filteredValues'])).enter()
					.append('g')
					.attr('id',function(d,i){return 'row-'+solutionId+'-'+d[0];})
					.classed('row',true);
			
			serieComponent.selectAll('.row').each(function(row,i){
				d3.select(this).append('text')
						.classed('axisLabel',true)
						.attr('transform',function(d){return 'translate('+0+','+(14+i*10)+')';})
						.text(function(d){return row[0];});
				xValues.forEach(function(gen,j){
					var rect = d3.select('#row-'+solutionId+'-'+row[0]);
					rect = rect.append('rect')
							.attr('id',function(g){return 'cell-'+solutionId+'-'+gen;})
							.attr('x',function(d){return 8+j*10;})
							.attr('y',function(d){return 5+i*10;})
							.attr('width',10)
							.attr('height',10);
					var ts = +(row[0].substring(2));
					var genData = row[1]['gens'].map(function(e){return +e['gen']});
					rect.attr('stroke','#000000').attr('stroke-width','0.2').attr('stroke-opacity','0.5')
					if (genData.includes((ts*numGenerations)+gen))
						rect.attr('fill','#5a5aff');
					else
						rect.attr('fill','#ffffff')
				});
			});
			xValues.forEach(function(gen,j){
				serieComponent.append('text')
						.classed('axisLabel',true)
						.attr('transform',function(d){
											var numberTS = Object.entries(s[1]['filteredValues']).length;
											return 'translate('+(13+j*10)+','+(14+numberTS*10)+')';
										  })
						.text(function(d){return j+1;});
			});
		}
	);
	return;
}