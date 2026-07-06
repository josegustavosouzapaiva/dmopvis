function buildVariabilityChart(div,completeData,decisionVariables,objectives) {
	//Building blocks div
	//By now I'm working only with 2D charts, and so I'll get the first 2 decision variables only.
	var x1Values = completeData.map(function(d){return +d[decisionVariables[0]];}).filter(function(v,i,a){return a.indexOf(v) === i;});
	var x2Values = completeData.map(function(d){return +d[decisionVariables[1]];}).filter(function(v,i,a){return a.indexOf(v) === i;});
	var chartWidth = x1Values.length;
	var chartHeight = x2Values.length;
	
	var variationChartDiv = d3.select('#'+div);
	if (variationChartDiv.empty())
		variationChartDiv = d3.select('#Variability2DChartCel')
									.append('div')
									.attr('id',div)
									.attr('class','layout');
	variationChartDiv.selectAll("*").remove();
	variationChartDiv.append('text').classed('title',true).text('Variability 2D Landscape');
	
	variationChartDiv.append('br');
	
	var measures = [{text:'Non-domination Level',value:'dl'},{text:'Pareto Set Membership',value:'pm'}];
	variationChartDiv.append('label').attr('for','measureSelect2D').classed('labelWidget',true).text('Measure: ');
	var measureSelect = variationChartDiv.append('select').attr('id','measureSelect2D');//.append('optgroup');
	measureSelect.selectAll('option').data(measures).enter()
				.append('option').text(function(d){return d.text;})
				.attr('value',function(d){return d.value;})
	measureSelect.on('change',function(d){
		var text = d3.select('#selectedValues').text().split(',');
		var s = Math.trunc(+text[0]);
		var e = Math.trunc(+text[1]);
		var tsValues = Array.from({length:(e-s)+1},function(v,i){return (s+i);});
		var priority = d3.select('#prioritySelect').node().value;
		var alpha = d3.select('#fadingFactorInput').node().value;
		fillVariabilityChart(decisionVariables,objectives,tsValues,priority,alpha);
	});
	variationChartDiv.append('input')
		.attr('id','swapColors2DInput')
		.attr('type','checkbox')
		.on('change',function(d){
			var swap = d3.select(this).property('checked');
			var measureScale;
			if (d3.select('#measureSelect2D').node().value.endsWith('.csv')) {
				var rangeColors = buildColors('#9ecae1','#08519c',5);
				var values = d3.select('#measureSliderSVG').data['selectedMeasureSlideValues'];
				var s = Math.max(1,Math.trunc(values[0]));
				var e = Math.trunc(values[1]);
				var selectedValuesRange = Array.from({length:(e-s)+1},function(v,i){return (s+i);});
				measureScale = (swap) ? d3.scaleQuantile().domain(d3.extent(values)).range(rangeColors.reverse()) : d3.scaleQuantile().domain(d3.extent(values)).range(rangeColors);
			
				d3.select('#variationChartG').selectAll('rect')
					.attr('fill',function(d,i){
									if (d3.select(this).attr('id') in selectedSeries) return 'red';
									else {
										var measure = (+d3.select(this).attr('measureValue'));
										if ((measure != null)&&((measure >= s)&&(measure <= e)))
											return measureScale(+d3.select(this).attr('measureValue'));
										else //IMPROVE THIS CODE!!
											return 'white';
											//if (swap) return 'blue';
											//else return 'white';
									}
								})
					.attr('stroke',function(d){
									if (d3.select(this).attr('id') in selectedSeries) return 'red';
									else {
										var measure = (+d3.select(this).attr('measureValue'));
										if ((measure != null)&&((measure >= s)&&(measure <= e)))
											return measureScale(+d3.select(this).attr('measureValue'));
										else
											return 'white';
											//if (swap) return 'blue';
											//else return 'white';
									}
								})
					.attr('color',function(d){
									if (d3.select(this).attr('id') in selectedSeries) return 'red';
									else {
										var measure = (+d3.select(this).attr('measureValue'));
										if ((measure != null)&&((measure >= s)&&(measure <= e)))
											return measureScale(+d3.select(this).attr('measureValue'));
										else
											return 'white';
											//if (swap) return 'blue';
											//else return 'white';
									}
								});
			}else {
				var range = d3.select('#rangeValues').attr('value').split(',');
				var colorInterpolator = (swap) ? d3.interpolate('blue','white') : d3.interpolate('white','blue');
				measureScale = d3.scaleSequential().domain(d3.extent(range)).interpolator(colorInterpolator);
				
				d3.select('#variationChartG').selectAll('rect')
				.attr('fill',function(d,i){
								if (d3.select(this).attr('id') in selectedSeries) return 'red';
								else return measureScale(+d3.select(this).attr('measureValue'));
							})
				.attr('stroke',function(d){
								if (d3.select(this).attr('id') in selectedSeries) return 'red';
								else return measureScale(+d3.select(this).attr('measureValue'));
							})
				.attr('color',function(d){return measureScale(+d3.select(this).attr('measureValue'));});
			}
		});
	variationChartDiv.append('label')
		.attr('for','swapColors2DInput')
		.classed('labelWidget',true)
		.text('Invert Color Scale')
	
	variationChartDiv.append('input')
		.attr('id','brushInput')
		.attr('type','checkbox')
		.on('change',function(d){
			var brushSelected = d3.select(this).property('checked');
			clickBrush(brushSelected);
		});
	variationChartDiv.append('label')
		.attr('for','brushInput')
		.classed('labelWidget',true)
		.text('Region Select');
		
	variationChartDiv.append('br');
	
	variationChartDiv.append('svg')
					.attr('width',0)
					.attr('id','measureSliderSVG')
					.attr('height',50)
					.style('text-align','center')
					.append('g').attr('id','measureSliderG').attr('transform','translate(11,11)');
					
	var variationChartSVG = variationChartDiv.append('svg').attr('id','variationChartSVG')
										 .attr('height',chartHeight*hRect+60)
										 .attr('width',chartWidth*wRect+60);
	var variationChartG = variationChartSVG.append('g').attr('id','variationChartG')
										 .attr('transform','translate('+30+','+10+')');
										 
	variationChartG.attr('chartHeight',chartHeight);
	variationChartG.attr('chartWidth',chartWidth);
	
	//Rects
	variationChartG.selectAll('rect').data(completeData).enter()
			.append('rect')
			.attr('id',function(d,i){return 'v'+Math.trunc(i/chartHeight)+'-'+(i%chartHeight);})
			.attr('x',function(d,i){return Math.trunc(i/chartHeight)*wRect;})
			.attr('y',function(d,i){return (i%chartHeight)*hRect;})
			.attr('width',wRect)
			.attr('height',hRect)
	
	//Axis
	var x1Extent = d3.extent(completeData,function(d){return +d[decisionVariables[0]];});
	var x1set = Array.from(new Set(completeData.map(function(d){return +d[decisionVariables[0]];})));
	var xScale = d3.scaleLinear().domain(x1Extent).range([0,chartWidth*wRect]).nice();
	var xAxis = d3.axisBottom().scale(xScale).tickValues(x1set.filter(function(d,i) {return ((i%4)==0);}));
	var xAxisG = variationChartSVG.append('g').attr('id','xAxis');
	xAxisG.attr('transform','translate('+30+','+(chartHeight*hRect)+')')
	xAxisG.append('text').classed('axisLabel',true).attr('transform','translate('+(chartWidth*wRect/2)+','+30+')').text(decisionVariables[0]);
	
	var x2Extent = d3.extent(completeData,function(d){return +d[decisionVariables[1]];});
	var x2set = Array.from(new Set(completeData.map(function(d){return +d[decisionVariables[1]];})));
	var yScale = d3.scaleLinear().domain(x2Extent).range([0,chartHeight*hRect]).nice();
	var yAxis = d3.axisLeft().scale(yScale).tickValues(x2set.filter(function(d,i) {return ((i%4)==0);}));
	var yAxisG = variationChartSVG.append('g').attr('id','yAxis')
	yAxisG.attr('transform','translate('+25+','+10+')');
	yAxisG.append('text').classed('axisLabel',true).attr('transform','translate('+0+','+(chartHeight*hRect/2)+'),rotate(-90)').text(decisionVariables[1]);
}

function clickBrush(optionSelected) {
	var brushOverlay = d3.select('.brush');
	if (!optionSelected)
		brushOverlay.lower();
	else
		brushOverlay.raise();
	brushOverlay.call(d3.brush().move,null);
}

function processMeasures(decisionVariables,objectives,timestamps,priority,alpha) {
	var measures = {};
	//TO DO: change variable range to a dictionary, keeping the range of all considered measures. That is because some of the measures are not 
	//suitable for calculating variability, such as pareto set membership, and in such cases we may prefer to use only total, for example.
	var range = [Number.MAX_VALUE,Number.MIN_VALUE];
	selectedMeasure = d3.select('#measureSelect2D').node().value;//.split('-')[0];
	//Processing data
	if (selectedMeasure.endsWith('.csv')) {
		var algName = selectedMeasure.split('-')[1];
		selectedMeasure = selectedMeasure.split('-')[0];
		var minValue = Number.MAX_SAFE_INTEGER;
		var maxValue = Number.MIN_SAFE_INTEGER;
		d3.select('#variationChartG').selectAll('rect').each(function(d,i) {
			var filteredValues = {};
			var totalGen = 0;
			measures[d3.select(this).attr('id')] = {};
			measures[d3.select(this).attr('id')][decisionVariables[0]] = +d[decisionVariables[0]];
			measures[d3.select(this).attr('id')][decisionVariables[1]] = +d[decisionVariables[1]];
			var generations = [];
			timestamps.forEach(function(t){
								var obj = {};
								obj['gens'] = [];
								obj['ngens'] = 0;
								if ((d['algData-'+algName] != null)&&(d['algData-'+algName].get(t.toString()) != null)) {
									obj['gens'] = d['algData-'+algName].get(t.toString()).map(function(v) {
										var obj = {};
										obj['gen'] = v['gen'];
										decisionVariables.forEach(function(d){obj[d] = v[d];});
										generations.push(+v['gen']);
										return obj;
									});
									obj['ngens'] = d['algData-'+algName].get(t.toString()).length;
									totalGen += d['algData-'+algName].get(t.toString()).length;
								}		
								filteredValues['ts'+t] = obj;
							});
			
			measures[d3.select(this).attr('id')]['fs'] = d3.min(generations);
			measures[d3.select(this).attr('id')]['ls'] = d3.max(generations);
			measures[d3.select(this).attr('id')]['ngens'] = totalGen;
			if (generations.length > 1) {
				var genc = generations[0];
				var totalGlobal = 1;
				var totalConsec = 1;
				for (i=1;i<(generations.length);i++){
					if (generations[i] == (genc+1))
						totalConsec++;
					else {
						if (totalConsec > totalGlobal)
						   totalGlobal = totalConsec;
						totalConsec = 1 
					}
					genc = generations[i];
				}
			}
			if (totalConsec > totalGlobal)
				totalGlobal = totalConsec;
			measures[d3.select(this).attr('id')]['ss'] = totalGlobal;
			
			measures[d3.select(this).attr('id')]['filteredValues'] = filteredValues;
			minValue = (measures[d3.select(this).attr('id')][selectedMeasure] != null) ? Math.min(minValue,measures[d3.select(this).attr('id')][selectedMeasure]) : minValue;
			maxValue = (measures[d3.select(this).attr('id')][selectedMeasure] != null) ? Math.max(maxValue,measures[d3.select(this).attr('id')][selectedMeasure]) : maxValue;
		});
		range = [minValue,maxValue];
	}else {
		d3.select('#variationChartG').selectAll('rect').each(function(d,i) {
			var filteredValues = {};
			timestamps.forEach(function(t){
						var obj = {};
						objectives.forEach(function(objective){obj[objective] = +d[objective+'-'+t];}); 
						obj['dl'] = +d['dl-'+t];
						obj['dc'] = +d['dc-'+t];
						obj['pm'] = (obj['dl'] == 1) ? 1 : 0;
						filteredValues['ts'+t] = obj;
			});
			var measureMap = Object.values(filteredValues).map(function(d){return d[selectedMeasure];});
			var measureVariability = 0;
			var paretoMemberVariability = 0;
			switch (priority) {
				case 'eq':
					paretoMemberVariability = measureMap.filter(function(d){return d == 1;}).length;
					measureVariability = standardDeviation(measureMap)/mean(measureMap);
					break;
				case 'mr':
					var sa = 0, na = 0;
					paretoMemberVariability = Object.values(filteredValues).map(function(d){return (d[selectedMeasure] != 1) ? 0 : 1;});
					paretoMemberVariability.forEach(function(d,i){
						sa += Math.pow(alpha,(paretoMemberVariability.length-(i+1)))*d;
						na += Math.pow(alpha,(paretoMemberVariability.length-(i+1)));
					});
					paretoMemberVariability = sa/na;
					var fadingMeasureMap = [];
					var idx = 0;
					while (idx < measureMap.length) {
						sa = Math.pow(alpha,(measureMap.length-idx))*measureMap[idx];
						na = Math.pow(alpha,(measureMap.length-idx));
						fadingMeasureMap.push(sa);
						idx++;
					}
					measureVariability = standardDeviation(fadingMeasureMap)/mean(fadingMeasureMap);					
					break;
				case 'lr':
					var sa = 0, na = 0;
					paretoMemberVariability = Object.values(filteredValues).map(function(d){return (d[selectedMeasure] != 1) ? 0 : 1;});
					paretoMemberVariability.forEach(function(d,i){
						sa += Math.pow(alpha,(i+1))*d;
						na += Math.pow(alpha,(i+1));
					});
					paretoMemberVariability = sa/na;
					var fadingMeasureMap = [];
					var idx = 0;
					while (idx < measureMap.length) {
						sa = Math.pow(alpha,(idx))*measureMap[idx];
						na = Math.pow(alpha,(idx));
						fadingMeasureMap.push(sa);
						idx++;
					}
					measureVariability = standardDeviation(fadingMeasureMap)/mean(fadingMeasureMap);
					break;	
			}
			measures[d3.select(this).attr('id')] = {};
			measures[d3.select(this).attr('id')][decisionVariables[0]] = +d[decisionVariables[0]];
			measures[d3.select(this).attr('id')][decisionVariables[1]] = +d[decisionVariables[1]];
			measures[d3.select(this).attr('id')]['dl'] = measureVariability;
			measures[d3.select(this).attr('id')]['pm'] = paretoMemberVariability;
			measures[d3.select(this).attr('id')]['filteredValues'] = filteredValues;
			range[0] = Math.min(range[0],measureVariability);
			range[1] = Math.max(range[1],measureVariability);
		});
	}
	//TO DO: the idea is to replace the above if so we can get the range according to the selected measure.
	//TO DO URGENT: Check why 3D layout is not working properly when using pareto membership. It happens when the selected measures of 2D and 3D differs from each other.
	if (selectedMeasure == 'pm') {
		range[0] = 0;
		range[1] = 9;
	}
	measures['range'] = range;
	return measures;
}

function fillVariabilityChart(decisionVariables,objectives,timestamps,priority,alpha) {
	var selectedMeasure = d3.select('#measureSelect2D').node().value.split('-')[0];
	//Processing data
	measures = processMeasures(decisionVariables,objectives,timestamps,priority,alpha);
	var swap = d3.select('#swapColors2DInput').property('checked');
	if (d3.select('#measureSelect2D').node().value.endsWith('.csv')) {
		var rangeColors = buildColors('#9ecae1','#08519c',5);
		var values = measures['range'];
		var selectedValuesRange = Array.from({length:(values[1]-values[0])+1},function(v,i){return (values[0]+i);});
		var measureScale = (swap) ? d3.scaleQuantile().domain(d3.extent(values)).range(rangeColors.reverse()) : d3.scaleQuantile().domain(d3.extent(values)).range(rangeColors);
		var width = Math.min(values[1]*1.5,600);
		var gRange = d3.select('#measureSliderSVG').attr('width',width+80)
		
		const sliderMeasureRange = d3.sliderBottom()
		.min(values[0])
		.max(values[1])
		.width(width)
		.ticks(Math.floor(selectedValuesRange*0.05))
		.default(values)
		.step(1)
		.fill('blue')
		.on('onchange',function(val) {
			var s = Math.max(1,Math.trunc(val[0]));
			var e = Math.trunc(val[1]);
			var values = Array.from({length:(e-s)+1},function(v,i){return (s+i);});
			var swap = d3.select('#swapColors2DInput').property('checked');
			var rangeColors = buildColors('#9ecae1','#08519c',5);
			measureScale = (swap) ? d3.scaleQuantile().domain(d3.extent(values)).range(rangeColors.reverse()) : d3.scaleQuantile().domain(d3.extent(values)).range(rangeColors);
			d3.select('#variationChartG').selectAll('rect')
				.attr('fill',function(d){
								if (d3.select(this).attr('id') in selectedSeries) return 'red';
								else {
									var valueColor = 'white';
									if (d3.select(this).attr('id') in measures) {
										measure = +d3.select(this).attr('measureValue');
										if ((measure != null)&&((measure >= s)&&(measure <= e))) //we want values outside the range to always be white/blue, and not the first/last color
											valueColor = measureScale(measure);
										return valueColor;
									}
								}
							})
				.attr('stroke',function(d){
								if (d3.select(this).attr('id') in selectedSeries) return 'red';
								else {
									var valueColor = 'white';
									if (d3.select(this).attr('id') in measures) {
										measure = +d3.select(this).attr('measureValue');
										if ((measure != null)&&((measure >= s)&&(measure <= e))) //we want values outside the range to always be white/blue, and not the first/last color
											valueColor = measureScale(measure);
										return valueColor;
									}
								}
							})
				.attr('color',function(d){
									var valueColor = 'white';
									if (d3.select(this).attr('id') in measures) {
										measure = +d3.select(this).attr('measureValue');
										if ((measure != null)&&((measure >= s)&&(measure <= e))) //we want values outside the range to always be white/blue, and not the first/last color
											valueColor = measureScale(measure);
										return valueColor;
									}
								});
			d3.select('#measureSliderSVG').data['selectedMeasureSlideValues'] = [s,e];
		});
		//DOM insertion
		gRange.select('#measureSliderG').selectAll('*').remove();
		gRange.select('#measureSliderG').call(sliderMeasureRange);
		d3.select('#measureSliderSVG').data['selectedMeasureSlideValues'] = sliderMeasureRange.value();
	}else {
		var colorInterpolator = (swap) ? d3.interpolate('blue','white') : d3.interpolate('white','blue');
		measureScale = d3.scaleSequential().domain(d3.extent(measures['range'])).interpolator(colorInterpolator);
	}
	
	var variationChartSVG = d3.select('#variationChartSVG');
	
	//Adding color information to the layout, so we can retrieve it to swap colors
	var rangeInput = variationChartSVG.select('#rangeValues');
	if (rangeInput.empty()) rangeInput = variationChartSVG.append('input').attr('id','rangeValues').attr('type','hidden')
	rangeInput.attr('value',measures['range']);

	//Ploting updated data
	d3.select('#variationChartG').selectAll('rect').each(function(d,i) {
		//Updating series values according to the timestamp selection
		var rect = d3.select(this);
		var measure = 0;
		var valueColor = 'white';
		if (d3.select(this).attr('id') in measures) {
			measure = measures[rect.attr('id')][selectedMeasure];
			if ((measure != null)&&(measure != 0)) valueColor = measureScale(measure);
		}
		rect.attr('measureValue',measure)
			.attr('fill',valueColor)
			.attr('stroke',valueColor)
			.attr('color',valueColor)
			.on('mouseover',function(ev) {
				var currentMeasure = +d3.select(this).attr('measureValue');
				toolTip.style('opacity',.9)
				.style('left',(ev.x+5)+'px')
				.style('top',(ev.y-15)+'px')
				.style('width','140px')
				.style('height','40px');
				var textTooltip = decisionVariables[0]+': '+(+d[decisionVariables[0]]).toFixed(3);
				textTooltip += '<br>'+decisionVariables[1]+': '+(+d[decisionVariables[1]]).toFixed(3);
				if (Number.isInteger(currentMeasure))
					textTooltip += '<br>Value: '+currentMeasure;
				else
					textTooltip += '<br>Value: '+currentMeasure.toFixed(4);
				toolTip.html(textTooltip);
				if ((rect.attr('id') in selectedSeries)) {
					toolTip.style('background','red');
					overSerie(null,ev,rect.attr('id'),null,true);
				}else toolTip.style('background','#444444');
				rect.attr('fill','yellow').attr('stroke','yellow');
			})
			.on('mouseout',function(ev){
				toolTip.style('opacity',0);
				toolTip.style('background','#444444');
				if (rect.attr('id') in selectedSeries) overSerie(null,ev,d3.select(this).attr('id'),null,false);
				var color = rect.attr('color');
				if ((rect.attr('id') in selectedSeries))
					rect.attr('fill','red').attr('stroke','red');
				else rect.attr('fill',color).attr('stroke',color);
			})
			.on('click',function() {
				if (render3DChart) { //TO DO: improve this 'if' structure!
					var div3d = 'Variability3DChart';
					var myPlot = document.getElementById(div3d);
					var xValues = myPlot.data[1].x;
					var yValues = myPlot.data[1].y;
					var zValues = myPlot.data[1].z;
					var idValues = myPlot.data[1].ids;
					var markerValue = myPlot.data[1].marker;
				}
				if (!(rect.attr('id') in selectedSeries)) {
					selectedSeries[rect.attr('id')] = measures[rect.attr('id')];
					seriesColors[rect.attr('id')] = colorPalette[(indexColors++)%colorPalette.length];
					var rects = d3.selectAll('#'+rect.attr('id'));
					rects.attr('fill','red').attr('stroke','red');
					if (render3DChart) {
						xValues.push(+d[decisionVariables[1]]);
						yValues.push(+d[decisionVariables[0]]);
						var indX = myPlot.data[0].y.indexOf(+d[decisionVariables[0]]);
						var indY = myPlot.data[0].x.indexOf(+d[decisionVariables[1]]);
						var zValue = myPlot.data[0].z[indX][indY];
						zValues.push(zValue);
						idValues.push(rect.attr('id'));
						markerValue.size.push(markerSize3D);
						markerValue.color.push('red');
						markerValue.line.color.push('red');
					}
				}else {
					var rects = d3.selectAll('#'+rect.attr('id'));
					rects.each(function(d){
						var r = d3.select(this);
						var valueColor = r.attr('color');
						r.attr('fill',valueColor).attr('stroke',valueColor);
					});
					delete selectedSeries[rect.attr('id')];
					delete seriesColors[rect.attr('id')];
					if (render3DChart) {
						index = idValues.indexOf(rect.attr('id'));
						if (index != -1) {
							xValues.splice(index,1);
							yValues.splice(index,1);
							zValues.splice(index,1);
							idValues.splice(index,1);
							markerValue.size.splice(index+1,1);
							markerValue.color.splice(index+1,1);
							markerValue.line.color.splice(index+1,1);
						}
					}
				}
				if (render3DChart) {
					var update = {
						x: xValues,
						y: yValues,
						z: zValues,
						ids: idValues,
						marker: markerValue
					};
					Plotly.restyle(div3d,'data',[update],[1]);
				}
				fillSelectedSeries('SelectedSeries',decisionVariables,objectives,selectedMeasure);
				if (renderLineVariationChart) {
					var completeMeasure = d3.select('#measureSelect2D').node().value;
					if (completeMeasure.endsWith('.csv')) {
						var algName = completeMeasure.split('-')[1];
						var numGenerations = 10;
						fillLineVariationChartAlgorithm(algName,decisionVariables,selectedSeries);
						fillSelectionDistributionChart(algName,decisionVariables,selectedSeries,numGenerations);
					}else
						fillLineVariationChart(decisionVariables,selectedSeries);
				}
				if (renderObjectiveVariabilityPC) fillObjectiveVariabilityPC(decisionVariables,objectives,selectedMeasure,selectedSeries);
				if (renderObjectivesTradeoffRadarChart) fillObjectiveFunctionsRadarChart(decisionVariables,objectives,selectedSeries);
				if (renderDecisionObjectivePC) fillDecisionObjectivePC(decisionVariables,objectives,selectedMeasure,selectedSeries);
			})
			.on('contextmenu',function(ev) {
				ev.preventDefault();
				Object.keys(selectedSeries).forEach(function(d){
												var r = d3.select('#'+d);
												var valueColor = r.attr('color');
												r.attr('fill',valueColor).attr('stroke',valueColor);
												});
				for (serie in selectedSeries) {
					d3.selectAll('.serieComponent').remove();
					d3.selectAll('#leg-'+serie).remove();
				}
				selectedSeries = {};
				if (render3DChart) {
					//deleting marked points only
					var div3d = 'Variability3DChart';
					var myPlot = document.getElementById(div3d);
					var firstX = myPlot.data[0].x[0];
					var firstY = myPlot.data[0].y[0];
					var update = {
						x: [firstX],
						y: [firstY],
						z: [0.0],
						ids: ['0'],
						marker: {
							color: ['rgb(256, 0, 0)'],
							size: [0.1],
							symbol: 'circle',
							line: {
							color: 'rgb(256,0,0)',
							width: 1},
							opacity: 1}
					};
					//The following 6 lines should not be done, but for an unknow reason, the 3D chart does not update if I don't add them...
					myPlot.data[1].x = [firstX];
					myPlot.data[1].y = [firstY];
					myPlot.data[1].z = [0.0];
					myPlot.data[1].ids = ['0'];
					myPlot.data[1].marker.color = ['red'];
					myPlot.data[1].marker.line.color = ['red'];
					myPlot.data[1].marker.size = [0.1];
					
					Plotly.restyle(div3d,'data',[update],[1]);
				}
				fillSelectedSeries('SelectedSeries',decisionVariables,objectives,selectedMeasure);
				if (renderLineVariationChart) {
					var measure = d3.select('#measureSelect2D').node().value;
					if (measure.endsWith('.csv')) {
						var algName = measure.split('-')[1];
						fillLineVariationChartAlgorithm(algName,decisionVariables,selectedSeries);
						var numGenerations = 10;
						fillSelectionDistributionChart(algName,decisionVariables,selectedSeries,numGenerations);
					}else
						fillLineVariationChart(decisionVariables,selectedSeries);
				}
				if (renderObjectiveVariabilityPC) fillObjectiveVariabilityPC(decisionVariables,objectives,selectedMeasure,selectedSeries);
				if (renderObjectivesTradeoffRadarChart) fillObjectiveFunctionsRadarChart(decisionVariables,objectives,selectedSeries);
				if (renderDecisionObjectivePC) fillDecisionObjectivePC(decisionVariables,objectives,selectedMeasure,selectedSeries);
			})
		if (rect.attr('id') in selectedSeries) {
			selectedSeries[rect.attr('id')] = measures[rect.attr('id')];
			rect.attr('fill','red').attr('stroke','red');
		}
	});
	
	var variationChartG = d3.select('#variationChartG');
	var chartHeight = variationChartG.attr('chartHeight');
	var chartWidth = variationChartG.attr('chartWidth');
	
	if (variationChartSVG.select('.brush').empty()) {
		variationChartSVG	
			.append('g')
			.attr('class','brush')
			.call(d3.brush()
				.extent([[30,10],[30+(chartWidth*wRect),10+(chartHeight*hRect)]])
				.on('end',function({selection}) {
					if (selection) {
						const [[x0,y0],[x1,y1]] = selection;
						var selectedPoints = variationChartG.selectAll('rect')
							.filter(function(d,i){
								var node = d3.select(this);
								var xNode = (+node.attr('x')+30);
								var yNode = (+node.attr('y')+10);
								var insideX = xNode < x1 && xNode + wRect > x0
								var insideY = yNode < y1 && yNode + hRect > y0;
								return (insideX && insideY);
						});
						var selectedMeasure = d3.select('#measureSelect2D').node().value;
						var text = d3.select('#selectedValues').text().split(',');
						var s = Math.trunc(+text[0]);
						var e = Math.trunc(+text[1]);
						var tsValues = Array.from({length:(e-s)+1},function(v,i){return (s+i);});
						var priority = d3.select('#prioritySelect').node().value;
						var alpha = d3.select('#fadingFactorInput').node().value;
						selectMultiplePoints(selectedPoints,decisionVariables,objectives,selectedMeasure,tsValues,priority,alpha);
					}
				}
			)
		);
		clickBrush(false);
	}
	if (renderLineVariationChart) {
		var measure = d3.select('#measureSelect2D').node().value;
		if (measure.endsWith('.csv')) {
			var algName = measure.split('-')[1];
			fillLineVariationChartAlgorithm(algName,decisionVariables,selectedSeries);
			var numGenerations = 10;
			fillSelectionDistributionChart(algName,decisionVariables,selectedSeries,numGenerations);
		}else
			fillLineVariationChart(decisionVariables,selectedSeries);
	}
	if (renderObjectiveVariabilityPC) fillObjectiveVariabilityPC(decisionVariables,objectives,selectedMeasure,selectedSeries);
	if (renderObjectivesTradeoffRadarChart) fillObjectiveFunctionsRadarChart(decisionVariables,objectives,selectedSeries);
	if (renderDecisionObjectivePC) fillDecisionObjectivePC(decisionVariables,objectives,selectedMeasure,selectedSeries);
}

function selectMultiplePoints(selection,decisionVariables,objectives,selectedMeasure,timestamps,priority,alpha) {
	
	selectedMeasure = d3.select('#measureSelect2D').node().value;
	//Processing data
	var measures = processMeasures(decisionVariables,objectives,timestamps,priority,alpha);
	if (render3DChart) { //TO DO: improve this 'if' structure!
		var div3d = 'Variability3DChart';
		var myPlot = document.getElementById(div3d);
		var xValues = myPlot.data[1].x;
		var yValues = myPlot.data[1].y;
		var zValues = myPlot.data[1].z;
		var idValues = myPlot.data[1].ids;
		var markerValue = myPlot.data[1].marker;
	}
	selection.each(function(d) {
		var rect = d3.select(this);
		if (!(rect.attr('id') in selectedSeries)) {
			selectedSeries[rect.attr('id')] = measures[rect.attr('id')];
			seriesColors[rect.attr('id')] = colorPalette[(indexColors++)%colorPalette.length];
			var rects = d3.selectAll('#'+rect.attr('id'));
			rects.attr('fill','red').attr('stroke','red');
			if (render3DChart) {
				xValues.push(+d[decisionVariables[1]]);
				yValues.push(+d[decisionVariables[0]]);
				var indX = myPlot.data[0].y.indexOf(+d[decisionVariables[0]]);
				var indY = myPlot.data[0].x.indexOf(+d[decisionVariables[1]]);
				var zValue = myPlot.data[0].z[indX][indY];
				zValues.push(zValue);
				idValues.push(rect.attr('id'));
				markerValue.size.push(markerSize3D);
				markerValue.color.push('red');
				markerValue.line.color.push('red');
			}
		}else {}
	});
	if (render3DChart) {
		var update = {
			x: xValues,
			y: yValues,
			z: zValues,
			ids: idValues,
			marker: markerValue
		};
		Plotly.restyle(div3d,'data',[update],[1]);
	}
	fillSelectedSeries('SelectedSeries',decisionVariables,objectives,selectedMeasure);
	if (renderLineVariationChart) {
		var measure = d3.select('#measureSelect2D').node().value;
		if (measure.endsWith('.csv')) {
			var algName = measure.split('-')[1];
			fillLineVariationChartAlgorithm(algName,decisionVariables,selectedSeries);
			var numGenerations = 10;
			fillSelectionDistributionChart(algName,decisionVariables,selectedSeries,numGenerations);
		}else
			fillLineVariationChart(decisionVariables,selectedSeries);
	}
	if (renderObjectiveVariabilityPC) fillObjectiveVariabilityPC(decisionVariables,objectives,selectedMeasure,selectedSeries);
	if (renderObjectivesTradeoffRadarChart) fillObjectiveFunctionsRadarChart(decisionVariables,objectives,selectedSeries);
	if (renderDecisionObjectivePC) fillDecisionObjectivePC(decisionVariables,objectives,selectedMeasure,selectedSeries);
}

//3D layout Parameters
var redrawing = false;
var markerSize3D = 8;
var width3DLayout = 860;
var height3DLayout = 800;

function build3DVariabilityChart(div,completeData,decisionVariables,objectives) {
	var chart3DDiv = d3.select('#'+div);
	if (chart3DDiv.empty()) chart3DDiv = d3.select('#Variability3DChartCel')
												.append('div')
												.attr('id',div)
												.attr('class','layout');
												
	var colorscaleValues = [[0.0, 'rgb(256,256,256)'],[1.0, 'rgb(0,0,242)']];
	var x1Values = completeData.map(function(d){return +d[decisionVariables[0]];}).filter(function(v,i,a){return a.indexOf(v) === i;});
	var x2Values = completeData.map(function(d){return +d[decisionVariables[1]];}).filter(function(v,i,a){return a.indexOf(v) === i;});
	var dimX = x1Values.length;
	var dimY = x2Values.length;
	var initialValues = Array(dimX);
	var sourcedata = Array(dimX);
	for (i=0;i<initialValues.length;i++) {
		initialValues[i] = Array(dimY).fill(0);
		sourcedata[i] = Array.from(x2Values,function(d,j){
										var data = completeData[i*dimX+j];
										return {id:'v'+i+'-'+j,sourceData: data};
									});
	}
	var dataPlot = {
			x: x2Values,
			y: x1Values,
			z: initialValues,
			sourcedata: sourcedata,
			type: 'surface',
			hovertemplate: decisionVariables[0]+': %{y}<br>'+decisionVariables[1]+': %{x}<br>Coef. Variation: %{z}<extra></extra>',
			showscale: true,
			autocolorscale: false,
			colorscale: colorscaleValues,
			cmin: 0.0,
			cmax: 1.0
		};
		
	var markedPoints = {
			x: [x2Values[0]],
			y: [x1Values[0]],
			z: [0.0],
			ids: ['0'],
			hovertemplate: decisionVariables[0]+': %{y}<br>'+decisionVariables[1]+': %{x}<br>Coef. Variation: %{z}<extra></extra>',
			mode: 'markers',
			marker: {
				color: ['rgb(256, 0, 0)'],
				size: [0.1],
				symbol: 'circle',
				line: {
				color: ['rgb(256, 0, 0)'],
				width: 1},
				opacity: 1},
			type: 'scatter3d'
	};
	
	var zAxislabel = 'Coef. Variation';
	var layout = {
			title: 'Variability 3D Landscape',
			hovermode: 'closest',
			autosize: false,
			width: width3DLayout,
			height: height3DLayout,
			margin: {l: 65, r: 50, b: 65, t: 90,},			
			scene: {
				xaxis: {title: decisionVariables[1]},
				yaxis: {title: decisionVariables[0]},
				zaxis: {title: zAxislabel}
			},
			font: {
				family: 'Arial, monospace',
				size: 20,
				color: 'black'
			},
			hoverlabel: {
				bgcolor: '#444444',
				font: {color: 'white'}
			}
			
	};
	var data = [dataPlot,markedPoints];
	Plotly.newPlot(div, data, layout);
	
	var measures = [{text:'Non-domination Level',value:'dl'},{text:'Pareto Set Membership',value:'pm'}];
	
	var table = chart3DDiv.select('table');
	
	if (table.empty()) {
		table = chart3DDiv.append('table');
		var tr = table.append('tr');
		var td = tr.append('td').attr('align','right');
		td.append('label').attr('for','measureHeight3D').classed('labelWidget',true).text('Height: ');
		var measureHeightSelect = td.append('select').attr('id','measureHeight3D');
		measureHeightSelect.selectAll('option').data(measures).enter()
					.append('option').text(function(d){return d.text;})
					.attr('value',function(d){return d.value;});
		measureHeightSelect.property('value',measures[0].value);
		measureHeightSelect.on('change',function(d){
			var selectedMeasure = d3.select('#measureSelect2D').node().value;
			var selectedFunction = d3.select('#functionSelect').node().value;
			var text = d3.select('#selectedValues').text().split(',');
			var s = Math.trunc(+text[0]);
			var e = Math.trunc(+text[1]);
			var tsValues = Array.from({length:(e-s)+1},function(v,i){return (s+i);});
			var priority = d3.select('#prioritySelect').node().value;
			var alpha = d3.select('#fadingFactorInput').node().value;
			var heightMeasure = d3.select(this).node().value;
			var colorMeasure = d3.select('#measureColor3D').node().value;
			if (render3DChart) fill3DVariabilityChart('Variability3DChart',decisionVariables,objectives,selectedMeasure,tsValues,priority,alpha,heightMeasure,colorMeasure);
		});
		
		td = tr.append('td').attr('rowspan',2);	
		td.append('input').attr('id','swapColors3DInput').attr('type','checkbox')
			.on('change',function(d){
				var swap = d3.select(this).property('checked');
				var colorscaleValues = (swap) ?  [[0.0, 'rgb(0,0,242)'],[1.0, 'rgb(256,256,256)']] : [[0.0, 'rgb(256,256,256)'],[1.0, 'rgb(0,0,242)']];
				var update = {
					colorscale: [colorscaleValues]
				};
				Plotly.restyle(div,update,[0]);
			});
		td.append('label').attr('for','swapColors3DInput').classed('labelWidget',true).text('Invert Color Scale')
		
		tr = table.append('tr');
		var td = tr.append('td').attr('align','right');
		
		td.append('label').attr('for','measureColor3D').classed('labelWidget',true).text('Color: ');
		var measureColorSelect = td.append('select').attr('id','measureColor3D');
		measureColorSelect.selectAll('option').data(measures).enter()
					.append('option').text(function(d){return d.text;})
					.attr('value',function(d){return d.value;});
		measureColorSelect.property('value',measures[1].value);
		measureColorSelect.on('change',function(d){
			var selectedMeasure = d3.select('#measureSelect2D').node().value;
			var selectedFunction = d3.select('#functionSelect').node().value;
			var text = d3.select('#selectedValues').text().split(',');
			var s = Math.trunc(+text[0]);
			var e = Math.trunc(+text[1]);
			var tsValues = Array.from({length:(e-s)+1},function(v,i){return (s+i);});
			var priority = d3.select('#prioritySelect').node().value;
			var alpha = d3.select('#fadingFactorInput').node().value;
			var heightMeasure = d3.select('#measureHeight3D').node().value;
			var colorMeasure = d3.select(this).node().value;
			if (render3DChart) fill3DVariabilityChart('Variability3DChart',decisionVariables,objectives,selectedMeasure,tsValues,priority,alpha,heightMeasure,colorMeasure);
		});
	}
}

function fill3DVariabilityChart(div,decisionVariables,objectives,selectedMeasure,timestamps,priority,alpha,height,color) {
	var completeData = d3.select('#'+div).node().data[0];
	var x1Values = completeData.x;
	var x2Values = completeData.y;
	var dimX = x1Values.length;
	var dimY = x2Values.length;
	var measures = processMeasures(decisionVariables,objectives,timestamps,priority,alpha);
	var range = d3.extent(Object.values(measures).map(function(d){return d['measureValue'];}));
	var measuresIndex = {};
	var measureValues = Array(dimX);
	var paretoMembershipValues = Array(dimX);
	for (i=0;i<measureValues.length;i++) {
		measureValues[i] = Array.from(x2Values,function(d,j){
			var id = completeData.sourcedata[i][j].id;
			return measures[id]['dl'];
		});
		paretoMembershipValues[i] = Array.from(x2Values,function(d,j){
			var id = completeData.sourcedata[i][j].id;
			return measures[id]['pm'];
		});
	}
	measuresIndex['dl'] = measureValues;
	measuresIndex['pm'] = paretoMembershipValues;
	
	range = d3.extent(measuresIndex[color].flat(1));
	var update = {
			'z': [measuresIndex[height]],
			surfacecolor:  [measuresIndex[color]],
			cmin: range[0],
			cmax: range[1]
		};
	Plotly.restyle(div,update,[0]);
	
	var myPlot = document.getElementById(div);
	
	//Updating z values of the marked points. As they belong to another trace, when users change timestamp values, the z values must change in all traces.
	var newZValue = [0];
	var markedPoints = myPlot.data[1].ids;
	for (i=1;i<markedPoints.length;i++) { //The first element is ignored, as it is just a point needed to plot the 3D graph, and is NOT part of data.
		var coordx = markedPoints[i].substring(1,markedPoints[i].indexOf('-'));
		var coordy = markedPoints[i].substring(markedPoints[i].indexOf('-')+1);
		newZValue.push(myPlot.data[0].z[coordx][coordy]);
	}
	Plotly.restyle(div,'z',[newZValue],[1]);
	var idOver = null;
	var lastClick = null; //this variable is used to simulate a double click, as it is not implemented in Plotly.js (last check in 26-09-2024)
	myPlot.on('plotly_hover', function(data) {
		var coord = data.points[0].pointNumber;
		switch (data.points[0].curveNumber) {
			case 0: //Surface layer
				id = myPlot.data[0].sourcedata[coord[1]][coord[0]].id;
				if (idOver != null) {
					overSerie(null,null,idOver,null,false);
					idOver = null;
				}
				break;
			case 1: //marked points layer
				try {
					id = data.points[0].data.ids[coord];
					if (idOver == null) {
						idOver = id;
						overSerie(null,null,idOver,null,true);
					}
				}catch(err) {
				 console.log('idOver: '+idOver);
				 console.log('id: '+id);
				 console.log(err.message);
				}
				break;
		}
	})
	.on('plotly_click', function(data) {
		//the following 5 lines simulate a double click, as it is not implemented in Plotly.js (last check in 26-09-2024)
		var clickTime = now();
		if(clickTime - lastClick >= 500) {
			lastClick = clickTime;
			return;
		}
		var id,dataPoint;
		var coord = data.points[0].pointNumber;
		switch (data.points[0].curveNumber) {
			case 0: //Surface layer
				id = myPlot.data[0].sourcedata[coord[1]][coord[0]].id;
				dataPoint = myPlot.data[0].sourcedata[coord[1]][coord[0]].sourceData;
				break;
			case 1: //marked points layer
				id = data.points[0].data.ids[coord];
				if ((id != null)||(id.indexOf('-') != -1)) {//For a reason that I don't know, when I delete a point, this event is called twice. As it excludes the point in the first call, this command returns null in the second call. If it happens, we just get out of the function.
					var coordx = id.substring(1,id.indexOf('-'));
					var coordy = id.substring(id.indexOf('-')+1);
					dataPoint = myPlot.data[0].sourcedata[coordx][coordy].sourceData;
				}else return;
				break;
		}
		var xValues = myPlot.data[1].x;
		var yValues = myPlot.data[1].y;
		var zValues = myPlot.data[1].z;
		var idValues = myPlot.data[1].ids;
		var markerValue = myPlot.data[1].marker;
		if (!(id in selectedSeries)) {
			selectedSeries[id] = measures[id];
			seriesColors[id] = colorPalette[(indexColors++)%colorPalette.length];
			var rects = d3.selectAll('#'+id);
			rects.attr('fill','red').attr('stroke','red');
			xValues.push(data.points[0].x);
			yValues.push(data.points[0].y);
			zValues.push(data.points[0].z);
			idValues.push(id);
			markerValue.size.push(markerSize3D);
			markerValue.color.push('red');
			markerValue.line.color.push('red');
		}else {
			var rects = d3.selectAll('#'+id);
			rects.each(function(d){
				var r = d3.select(this);
				var valueColor = r.attr('color');
				r.attr('fill',valueColor).attr('stroke',valueColor);
			});
			var index = Object.keys(selectedSeries).indexOf(id);
			delete selectedSeries[id];
			delete seriesColors[id];
			if (index != -1) {
				xValues.splice(index+1,1);
				yValues.splice(index+1,1);
				zValues.splice(index+1,1);
				idValues.splice(index+1,1);
				markerValue.size.splice(index+1,1);
				markerValue.color.splice(index+1,1);
				markerValue.line.color.splice(index+1,1);
			}
		}
		fillSelectedSeries('SelectedSeries',decisionVariables,objectives,selectedMeasure);
		if (renderLineVariationChart) fillLineVariationChart(decisionVariables,selectedSeries);
		if (renderObjectiveVariabilityPC) fillObjectiveVariabilityPC(decisionVariables,objectives,selectedMeasure,selectedSeries);
		if (renderObjectivesTradeoffRadarChart) fillObjectiveFunctionsRadarChart(decisionVariables,objectives,selectedSeries);
		if (renderDecisionObjectivePC) fillDecisionObjectivePC(decisionVariables,objectives,selectedMeasure,selectedSeries);
		
		var update = {
			x: xValues,
			y: yValues,
			z: zValues,
			ids: idValues,
			marker: markerValue
		};
		setTimeout(() => Plotly.restyle(div,'data',[update],[1]), 200);
	});
}

//Line Variation Chart Parameters
var widthLineVariationChart = 350;
var heightLineVariationChart = 200;
var numTicks = 5;

function buildLineVariationChart(div) {
	//building line chart div
	var lineChartDiv = d3.select('#'+div);
	if (lineChartDiv.empty()) lineChartDiv = d3.select('#LineVariationChartCel')
												.append('div')
												.attr('id',div)
												.attr('class','layout');
												
	//Title
	lineChartDiv.selectAll("*").remove();
	lineChartDiv.append('text').classed('title',true).text('Individual Variability');
	
	//Filters
	lineChartDiv.append('input')
		.attr('id','globalScaleInput')
		.attr('type','checkbox')
		.property('checked',false)
		.on('change',function(d){
			var selectedMeasure = d3.select('#measureSelect2D').node().value;
			if (selectedMeasure.endsWith('.csv')) {
				var algName = selectedMeasure.split('-')[1];
				updateLineVariationChartScaleAlgorithm(algName,d3.select(this).property('checked'),selectedSeries);
			}else
				updateLineVariationChartScale(d3.select(this).property('checked'),selectedSeries);
		});
	lineChartDiv.append('label')
		.attr('for','globalScaleInput')
		.classed('labelWidget',true)
		.text('Global Scale');
	
	lineChartDiv.append('br');
	
	//Lines area
	var lineChartSVG = lineChartDiv.append('svg').attr('id','lineVariationChartSVG')
										 .attr('height',heightLineVariationChart+90)
										 .attr('width',widthLineVariationChart+100);
	var lineChartG = lineChartSVG.append('g').attr('id','lineVariationChartG')
										 .attr('transform','translate(' + 45 + ',' + 10 + ')');
	//Axis
	lineChartG.append('g')
			   .attr('id','lineVariationXAxisG')
			   .attr('transform','translate(32,'+(heightLineVariationChart+12)+')');
	var xScale = d3.scalePoint().domain([]).range([0,widthLineVariationChart]);
	var xAxis = d3.axisBottom().scale(xScale);
	d3.select('#lineVariationXAxisG').call(xAxis);
	d3.select('#lineVariationXAxisG').append('text')
				.classed('axisLabel',true)
				.attr('transform','translate('+(widthLineVariationChart/2)+','+55+')')
				.text('Timestamps');
	
	lineChartG.append('g')
			   .attr('id','lineVariationYAxisG')
			   .attr('transform','translate(30,10)');
	var yScale = d3.scaleLinear().domain([]).range([heightLineVariationChart,0]);
	var yAxis = d3.axisLeft().scale(yScale);
	d3.select('#lineVariationYAxisG').call(yAxis);
	d3.select('#lineVariationYAxisG').append('text')
				.classed('axisLabel',true)
				.attr('transform','translate('+(-55)+','+(heightLineVariationChart/2)+'),rotate(-90)')
				.text('Dominance Level');
}

function fillLineVariationChart(decisionVariables,selectedSeries) {
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
	
	var selectedMeasure = d3.select('#measureSelect2D').node().value;
	if (selectedMeasure.endsWith('.csv')) {
		var algName = selectedMeasure.split('-')[1];
		fillLineVariationChartAlgorithm(decisionVariables,selectedSeries);
	}else {
	
	var measureConsidered = d3.select('#measureSelect2D').node().value;
	
	var globalScale = d3.select('#globalScaleInput').property('checked');
	
	if (globalScale) {
		var data = d3.select('#variationChartG').selectAll('rect').data();
		var columns = Object.keys(data[0]).filter(function(d){return d.startsWith(measureConsidered)});
		columns.forEach(function(column){
			var filteredColumn = data.map(function(d){return +d[column];});
			max = Math.max(max,d3.max(filteredColumn));
		});
	}else {
		for (value of Object.values(selectedSeries)) {
			var columns = Object.values(value.filteredValues).map(function(d){return +d[measureConsidered];});
			columns.forEach(function(d){max = Math.max(max,d);});
		}
	}
	var yScale = d3.scaleLinear().domain([0,max]).range([heightLineVariationChart,0]).nice();
	var yAxis = d3.axisLeft().scale(yScale).tickValues(generateValues(0,max,(max/numTicks)));
	d3.select('#lineVariationYAxisG').call(yAxis);
	
	var line = d3.line().x(function(d){return 32+xScale(+d[0].substring(2));});
	
	line.y(function(d){return 10+yScale(+d[1][measureConsidered]);});
			
	var vertexScale = function(measure) {
		return {x:32+xScale(+measure[0].substring(2)),y:10+yScale(+measure[1][measureConsidered])};
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
						var text = d[0]+': '+d[1][measureConsidered].toFixed(3);
						if (d[1][measureConsidered] == 1)
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
						if (d[1][measureConsidered] == 1) return sizeVertex*3;
						else return sizeVertex;
					})
					.attr('stroke',function(d) {
						if (d[1][measureConsidered] == 1) return '#FFC90E';//return 'yellow';
						else return d3.select(this.parentNode).select('#serie-'+d3.select(this.parentNode).attr('solutionId')).attr('color');
					})
					.attr('stroke-width',function(d) {
						if (d[1][measureConsidered] == 1) {
							return 4;
						}
						else return 1;
					})					
					.attr('fill',function(d) {
						if (d[1][measureConsidered] == 1) return '#FFC90E';//return 'yellow';
						return d3.select(this.parentNode).select('#serie-'+d3.select(this.parentNode).attr('solutionId')).attr('color');
					})
					.attr('color',function(d) {return d3.select(this.parentNode).select('#serie-'+d3.select(this.parentNode).attr('solutionId')).attr('color');})
					.on('mouseover',function(ev,d) {
						var text = d[0]+': '+d[1][measureConsidered].toFixed(3);
						var textLength = text.length;
						if (d[1][measureConsidered] == 1) text = '<font color="yellow">'+text+'</font>';
						var tooltipInfo = {
							msg: text,
							width: 6.2*textLength,
							height: 15
						};
						overPoint(null,ev,d3.select(this).attr('id'),tooltipInfo,true);
					})
					.on('mouseout',function(ev,d) {
						overPoint(null,ev,d3.select(this).attr('id'),'',false);
					})
	}
}

function updateLineVariationChartScale(globalScale,selectedSeries) {
	measureConsidered = d3.select('#measureSelect2D').node().value;
	var max = Number.MIN_SAFE_INTEGER;
	if ((!selectedSeries)||(Object.keys(selectedSeries).length == 0)) return; //nothing to show!
	
	//Axis
	var timestamps = Object.keys(selectedSeries[Object.keys(selectedSeries)[0]].filteredValues);
	var xValues = timestamps.map(function(d){return +d.substring(2);});
	var xScale = d3.scalePoint().domain(xValues).range([0,widthLineVariationChart]);
	
	if (globalScale) {
		var data = d3.select('#variationChartG').selectAll('rect').data();
		var columns = Object.keys(data[0]).filter(function(d){return d.startsWith(measureConsidered)});
		columns.forEach(function(column){
			var filteredColumn = data.map(function(d){return +d[column];});
			max = Math.max(max,d3.max(filteredColumn));
		});
	}else {
		for (value of Object.values(selectedSeries)) {
			var a = Object.values(value.filteredValues).map(function(d){return +d[measureConsidered];});
			a.forEach(function(d){if (d > max) max = d;});
		}
	}
	var yScale = d3.scaleLinear().domain([0,max]).range([heightLineVariationChart,0]).nice();
	
	var yAxis = d3.axisLeft().scale(yScale).tickValues(generateValues(0,max,(max/numTicks)));
	d3.select('#lineVariationYAxisG').call(yAxis);
	
	var line = d3.line()
			.x(function(d){return 32+xScale(+d[0].substring(2));})
			.y(function(d){return 10+yScale(+d[1][measureConsidered]);});
	
	var vertexScale = function(measure) {
		return {x:32+xScale(+measure[0].substring(2)),y:10+yScale(+measure[1][measureConsidered])};
	}
			
	var serieComponents = d3.select('#lineVariationChartG').selectAll('.serieComponent');	
	serieComponents.selectAll('path').attr('d',function(d,i){return line(Object.entries(d[1].filteredValues));});	
	serieComponents.selectAll('.vertex').attr('cy',function(d){return vertexScale(d).y;});
}

var widthList = 300;

function fillSelectedSeries(div,decisionVariables,objectives,selectedMeasure) {
	var selectedSeriesDiv = d3.select('#'+div);
	if (selectedSeriesDiv.empty()) selectedSeriesDiv = d3.select('#SelectedSeriesCel')
												.append('div')
												.attr('id',div)
												.attr('class','layout');
	selectedSeriesDiv.style('height','500px').style('width',(widthList+5));
	selectedSeriesDiv.selectAll('*').remove();
	var numSeries = Object.keys(selectedSeries).length;
	selectedSeriesDiv.append('text').classed('title',true).text('Selected Solutions: '+numSeries);
	selectedSeriesDiv.append('br');
	selectedSeriesDiv.append('input')
				.attr('type','button')
				.attr('value','Clear')
				.on('click',function() {
					d3.selectAll('.serieComponent').raise().selectAll('*').classed('selected',true);
					d3.selectAll('.optionList').selectAll('*').classed('selected',true);
				})
				
	selectedSeriesDiv.append('br');
	
	selectedSeriesDiv = selectedSeriesDiv.append('div')
												.append('div')
												.attr('id',div+'-List')
												.style('overflow-y','auto')
												.style('overflow-x','none');
												
	selectedSeriesDiv.style('height','1000px').style('width',(widthList));
	
	var selectedSeriesSVG = selectedSeriesDiv.append('svg').attr('id','selectedSeriesSVG')
										 .attr('height',30*numSeries)
										 .attr('width',widthList+60);
	var selectedSeriesG = selectedSeriesSVG.append('g')
									.attr('id','selectedSeriesG');
	
	var dynWidth = widthList;
	selectedSeriesG.selectAll('.optionList').data(Object.entries(selectedSeries)).enter()
		.append('g')
			.attr('class','optionList')
			.attr('id',function(d){return 'leg-'+d[0];})
			.attr('solutionId',function(d){return d[0];})
			.attr('transform',function(d,i){return 'translate('+15+','+(12+i*30)+')';})
			.on('click',function(_,d) {
				clickedLegend = d3.select(this);
				var clickedSeries = d3.selectAll('#serieComponent-'+d[0]);
				var v = true;
				clickedSeries.each(function() {
					var elemSelected = d3.select(this).selectAll('*');
					v = elemSelected.classed('selected');
					if (v)
						d3.select(this).lower();
					else
						d3.select(this).raise();
					elemSelected.classed('selected',!v);
					
				});
				clickedLegend.selectAll('*').classed('selected',!v);
			})
			.on('dblclick',function(_,d){
				clickedLegend = d3.select(this);
				var legends = d3.selectAll('.optionList');
				legends.each(function(dd) {
					var elem = d3.select(this).selectAll('*').classed('selected',false);
					var serie = d3.selectAll('#serieComponent-'+dd[0]);
					serie.selectAll('*').classed('selected',false);
				})
				clickedLegend.selectAll('*').classed('selected',true);
				var serie = d3.selectAll('#serieComponent-'+d[0]);
				serie.raise().selectAll('*').classed('selected',true).raise();
			})
			.on('mouseover',function(ev,d) {
				overSerie(null,ev,d[0],null,true);
			})
			.on('mouseout',function(ev,d) {
				overSerie(null,ev,d[0],null,false);
			})
			.append('rect')
				.classed('serie',true)
				.classed('selected',true)
				.attr('id',function(d){return 'rect-'+d[0];})
				.attr('height',15)
				.attr('width',15)
				.attr('fill',function(d,i){return seriesColors[d[0]];})
				.attr('stroke','black')
				
		selectedSeriesG.selectAll('.optionList')		
			.append('rect')
			.attr('class','highlightMark')
			.attr('id',function(d){return 'hm-'+d[0];})
			.attr('x',-10)
			.attr('y',0)
			.attr('height',15)
			.attr('width',5)
			.attr('fill','black')
			.attr('stroke','black')
			.attr('visibility','hidden');
		
		selectedSeriesG.selectAll('.optionList')				
			.append('text')
				.classed('serie',true)
				.classed('selected',true)
				.attr('for',function(d){return 'rect-'+d[0];})
				.attr('id',function(d){return 'txt-'+d[0];})
				.attr('x',20)
				.attr('y',13)
				.style('fill','black')
				.text(function(d){
						var numberDigits = ('('+d[1][decisionVariables[0]]+','+d[1][decisionVariables[1]]+')').length;
						dynWidth = Math.max(dynWidth,numberDigits*6.2);
						return '('+d[1][decisionVariables[0]]+','+d[1][decisionVariables[1]]+')';
					})
		selectedSeriesG.selectAll('.optionList')
			.append('image')
			.attr('xlink:href','../libs/bin.png')
			.attr('width',19)
			.attr('height',18)
			.attr('transform',function(d,i){
								var numberDigits = ('('+d[1][decisionVariables[0]]+','+d[1][decisionVariables[1]]+')').length;
								return 'translate('+(numberDigits*12.5)+','+0+')';
							})
			.on('click',function(_,d) {
				if (render3DChart) { //TO DO: improve this 'if' structure!
					var div3d = 'Variability3DChart';
					var myPlot = document.getElementById(div3d);
					var xValues = myPlot.data[1].x;
					var yValues = myPlot.data[1].y;
					var zValues = myPlot.data[1].z;
					var idValues = myPlot.data[1].ids;
					var markerValue = myPlot.data[1].marker;
					index = idValues.indexOf(d[0]);
					if (index != -1) {
						xValues.splice(index,1);
						yValues.splice(index,1);
						zValues.splice(index,1);
						idValues.splice(index,1);
						markerValue.size.splice(index+1,1);
						markerValue.color.splice(index+1,1);
						var update = {
							x: xValues,
							y: yValues,
							z: zValues,
							ids: idValues,
							marker: markerValue
						};
						Plotly.restyle(div3d,'data',[update],[1]);
					}
				}
				var rects = d3.selectAll('#'+d[0]);
				rects.each(function(){
					var r = d3.select(this);
					var valueColor = r.attr('color');
					r.attr('fill',valueColor).attr('stroke',valueColor);
				});
				delete selectedSeries[d[0]];
				delete seriesColors[d[0]];
				fillSelectedSeries('SelectedSeries',decisionVariables,objectives,selectedMeasure);
				if (renderLineVariationChart) {
					var measure = d3.select('#measureSelect2D').node().value;
					if (measure.endsWith('.csv')) {
						var algName = measure.split('-')[1];
						fillLineVariationChartAlgorithm(algName,decisionVariables,selectedSeries);
						var numGenerations = 10;
						fillSelectionDistributionChart(algName,decisionVariables,selectedSeries,numGenerations);
					}else
						fillLineVariationChart(decisionVariables,selectedSeries);
				}
				if (renderObjectiveVariabilityPC) fillObjectiveVariabilityPC(decisionVariables,objectives,selectedMeasure,selectedSeries);
				if (renderObjectivesTradeoffRadarChart) fillObjectiveFunctionsRadarChart(decisionVariables,objectives,selectedSeries);
				if (renderDecisionObjectivePC) fillDecisionObjectivePC(decisionVariables,objectives,selectedMeasure,selectedSeries);
	});
	//Resizing div width according to the largest number in terms of digits.
	selectedSeriesSVG.attr('width',dynWidth+60);
	selectedSeriesDiv.style('width',(dynWidth));
}

var heightParallelCoordinatesChart = 250;

function buildObjectiveFunctionsModule(div,decisionVariables,objectives) {
	// set the dimensions and margins
	width = 500 - margin.left - margin.right,
	height = 380 - margin.top - margin.bottom;
	var objectiveFunctionsDiv = d3.select('#'+div);
	if (objectiveFunctionsDiv.empty()) objectiveFunctionsDiv = d3.select('#'+div+'Cel')
												.append('div')
												.attr('id',div)
												.attr('class','layout')
												.attr('height',height)
												.attr('width',width);
	objectiveFunctionsDiv.selectAll("*").remove();
	objectiveFunctionsDiv.append('text').classed('title',true).text('Objective Functions Analysis');
	objectiveFunctionsDiv.append('br');
	if (renderObjectivesTradeoffRadarChart) buildObjectiveFunctionsRadarChart('ObjectiveFunctions','ObjectivesRadarChart',objectives);
	objectiveFunctionsDiv.append('br');
	if (renderObjectiveVariabilityPC) buildObjectiveVariabilityPC('ObjectiveFunctions','ObjectivesParallelCoordChart',objectives);	
	if (renderDecisionObjectivePC) buildDecisionObjectivePC('ObjectiveFunctions','DecisionObjectivePC',decisionVariables,objectives);
	
}

function buildObjectiveFunctionsRadarChart(parentDiv,div,objectives) {
	// set the dimensions and margins
	width = 500 - margin.left - margin.right,
	height = 380 - margin.top - margin.bottom;
	var radarChartDiv = d3.select('#'+div);
	if (radarChartDiv.empty()) radarChartDiv = d3.select('#'+parentDiv)
												.append('div')
												.attr('id',div)
												.attr('class','box')
												.attr('height',height)
												.attr('width',width);
	radarChartDiv.selectAll("*").remove();
	radarChartDiv.append('text').classed('title',true).text('Objectives Tradeoff');
	radarChartDiv.append('br');
}

//Only functions
function buildObjectiveVariabilityPC(parentDiv,div,objectives) {
	// set the dimensions and margins
	var width = 400 - margin.left - margin.right;
	var height = 300 - margin.top - margin.bottom;
	
	//append the svg object to the body of the page
	var parallelCoordDiv = d3.select('#'+div);
	if (parallelCoordDiv.empty()) parallelCoordDiv = d3.select('#'+parentDiv)
												.append('div')
												.attr('id',div)
												.attr('class','box');
	parallelCoordDiv.selectAll("*").remove();
	parallelCoordDiv.append('text').classed('title',true).text('Variability');
	parallelCoordDiv.append('br');
	var parallelCoordSVG = parallelCoordDiv.append('svg').attr('id','parallelCoordSVG')
												.attr('height',height)
												.attr('width',width);
	var parallelCoordG = parallelCoordSVG.append('g').attr('id','parallelCoordG')
										.attr('transform','translate('+margin.left+','+margin.top+')');
	
	var numberInstances = d3.select('#variationChartG').selectAll('rect').size();
	var defaultScale = {};
	objectives.forEach(function(obj) {
		defaultScale[obj+' Variability'] = [0,1];
	});
	
	parallelCoordSVG.attr('height',(height+100)+20*Object.keys(defaultScale).length);
	
	//Storing the scales on the g DOM element, so we can use these values when drawing the lines.
	d3.select('#parallelCoordG').data['defaultScaleVariability'] = defaultScale;
	
	dimensions = Object.keys(defaultScale);
	
	var verticalAxesScales = {};
	
	for (i in dimensions) {
		var name = dimensions[i];
		var domain = defaultScale[name];
		verticalAxesScales[name] = d3.scaleLinear().domain(domain).range([height,0]);
	}

	//Build the X scale to equally position each Y axis
	horizontalScale = d3.scalePoint().range([0,width]).padding(1).domain(dimensions);

	//Draw the axis
	parallelCoordG.selectAll('pcAxis')
		.data(dimensions).enter() //For each dimension of the dataset I add a 'g' element:
		.append('g')
		.classed('pcAxis',true)
		.attr('transform',function(d){return 'translate('+horizontalScale(d)+',30)';}) //Translate element to its horizontal position
		.each(function(d){d3.select(this).call(d3.axisLeft().scale(verticalAxesScales[d]));}) //Call function to build vertical axis
		.append('text').style('text-anchor','middle').classed('axisLabel',true) //Axis title
		.attr('x',function(d,i){
			var text = 'Dim. '+(i+1);
			return -(text.length/2);
		})
		.attr('y',-12)
		.text(function(d,i){return d.split(' ')[0];})
		.classed('axisLabel',true)
	
	parallelCoordG.selectAll('.tick').selectAll('text').style('font-size',20);
	
}

var highlighted = {};

function brushedPC({selection}, key) {
	if ((!selectedSeries)||(Object.keys(selectedSeries).length == 0)) return; //nothing to select!
	var height = 300 - margin.top - margin.bottom;
	var seriesComponents = d3.select('#decisionObjectivePCG').selectAll('.serieComponent');
	var defaultScale = d3.select('#decisionObjectivePCG').data['defaultScaleDecisionObjective'];
	dimensions = Object.keys(defaultScale);
	
	//For each dimension, build a linear scale. These scales will be used to inversely return the value mapped
	var verticalAxesScales = {};
	for (i in dimensions) {
		var name = dimensions[i];
		var domain = defaultScale[name];
		verticalAxesScales[name] = d3.scaleLinear().domain(domain).range([height,0]);		
	}
	seriesComponents.each(function(sc){
		var originalValue = sc[key];
		var range = (defaultScale[key][1] - defaultScale[key][0]);
		if (range == 0) range = 1;
		value = (originalValue - defaultScale[key][0])/range;
		value = verticalAxesScales[key](value);
		var serie = d3.select(this).select('.serie');
		if (!(key in highlighted)) highlighted[key] = [];
		if ((selection != null)&&(value >= selection[0])&&(value <= selection[1])) {
			if (!highlighted[key].includes(d3.select(this).attr('id'))) //adding to the highlights of that axis
				highlighted[key].push(d3.select(this).attr('id'));
		}else {
			if (highlighted[key].includes(d3.select(this).attr('id'))) { //removing from the highlights of that axis
				var index = highlighted[key].indexOf(d3.select(this).attr('id'));
				if (index != -1) highlighted[key].splice(index,1);
			}
		}
		var belonging = 0;
		for (k in highlighted) {
			if (highlighted[k].length == 0) delete highlighted[k];
			else if (highlighted[k].includes(d3.select(this).attr('id'))) belonging++;
		}
		
		var color = d3.select(this).selectAll('.serie').attr('color');
		serie.style('stroke',color);
		if ((belonging > 0)&&(belonging == Object.keys(highlighted).length)) {
			serie.style('stroke','black');
			d3.select(this).raise();
		}
	});
}

//Decision + Function (1 per timestamp)
function buildDecisionObjectivePC(parentDiv,div,decisionVariables,objectives) {
	// set the dimensions and margins
	var width = 400 - margin.left - margin.right;
	var height = 300 - margin.top - margin.bottom;
	
	//append the svg object to the body of the page
	var parallelCoordDiv = d3.select('#'+div);
	if (parallelCoordDiv.empty()) parallelCoordDiv = d3.select('#'+parentDiv)
												.append('div')
												.attr('id',div)
												.attr('class','box');
	
	parallelCoordDiv.selectAll("*").remove();
	parallelCoordDiv.append('text').classed('title',true).text('Decision-Objective');
	parallelCoordDiv.append('br');
	var decisionObjectivePCSVG = parallelCoordDiv.append('svg').attr('id','decisionObjectivePCSVG')
												.attr('height',height)
												.attr('width',width);
	var brushWidth = 30;
	const brush = d3.brushY()
					.extent([
						[-(brushWidth/2),0],
						[(brushWidth/2),(height)]
					])
					.on('start brush end', brushedPC);
	
	var decisionObjectivePCG = decisionObjectivePCSVG.append('g').attr('id','decisionObjectivePCG')
										.attr('transform','translate('+margin.left+','+margin.top+')');

	var data = d3.select('#variationChartG').selectAll('rect').data();
	
	var defaultScale = {};
	
	//Adding decision variables
	decisionVariables.forEach(function(v) {
		values = data.map(function(d){return +d[v];});
		defaultScale[v] = d3.extent(values);
	})
	
	objectives.forEach(function(obj) {
		var columns = Object.keys(data[0]).filter(function(d){return d.startsWith(obj)});	
		values = [];
		columns.forEach(function(c){
			v = data.map(function(d){return +d[c];});
			v.forEach(function(d){
				values.push(d);
			});
		});
		defaultScale[obj] = [0,1];
	});
	
	decisionObjectivePCSVG.attr('height',(height+100)+20*Object.keys(defaultScale).length);
	
	//Storing the scales on the g DOM element, so we can use these values when drawing the lines.
	d3.select('#'+div+'G').data['defaultScaleDecisionObjective'] = defaultScale;
	
	dimensions = Object.keys(defaultScale);
	
	var verticalAxesScales = {};
	
	for (i in dimensions) {
		var name = dimensions[i];
		var domain = defaultScale[name];
		verticalAxesScales[name] = d3.scaleLinear().domain(domain).range([height,0]);
	}

	//Build the X scale to equally position each Y axis
	horizontalScale = d3.scalePoint().range([0,width]).padding(1).domain(dimensions);

	//Draw the axis
	decisionObjectivePCG.selectAll('pcAxis')
		.data(dimensions).enter() //For each dimension of the dataset I add a 'g' element:
		.append('g')
		.attr('id',function(d,i){return 'pcAxis-'+d})
		.classed('pcAxis',true)
		.attr('transform',function(d){return 'translate('+horizontalScale(d)+',30)';}) //Translate element to its horizontal position
		.each(function(d){d3.select(this).call(d3.axisLeft().scale(verticalAxesScales[d]));}) //Call function to build vertical axis
		.append('text').style('text-anchor','middle').classed('axisLabel',true) //Axis title
		.attr('x',function(d,i){
			var text = 'Dim. '+(i+1);
			return -(text.length/2);
		 })
		.attr('y',-12)
		.text(function(d,i){return d;})
		
	decisionObjectivePCG.selectAll('.tick').selectAll('text').style('font-size',20);
	//The above code was done due to a bug on showing negative values on the tick axis.
	decisionObjectivePCG.selectAll('.tick').selectAll('text').each(function(d){
																		if ((+d) < 0) {
																			var t = d3.select(this).text();
																			t = '-'+t.substring(3);
																			d3.select(this).text(t);
																		}
																	});
	
	decisionObjectivePCG.selectAll('.pcAxis').call(brush);
	
}

//Only functions
function fillObjectiveVariabilityPC(decisionVariables,objectives,selectedMeasure,selectedSeries) {
	var parallelCoordSVG = d3.selectAll('#parallelCoordSVG');
	parallelCoordSVG.selectAll('.serieComponent').remove(); //removing all series
	if ((!selectedSeries)||(Object.keys(selectedSeries).length == 0)) return; //nothing to show!
	var dataSeries = [];
	// set the dimensions and margins
	var width = 400 - margin.left - margin.right;
	var height = 300 - margin.top - margin.bottom;
	
	var parallelCoordG = d3.select('#parallelCoordG');
	var defaultScale = parallelCoordG.data['defaultScaleVariability'];
	
	dimensions = Object.keys(defaultScale);
	
	//Build the X scale to equally position each Y axis
	horizontalScale = d3.scalePoint().range([0,width]).padding(1).domain(dimensions);
	
	var minValue = Number.MAX_VALUE;
	var maxValue = Number.MIN_VALUE;
	for (key of Object.keys(selectedSeries)) {
		var objDataSerie = {};
		//Calculating objective function variability
		objectives.forEach(function(obj){
			var values = Object.values(selectedSeries[key].filteredValues).map(function(d){return d[obj];});
			var fVariability = standardDeviation(values)/mean(values);
			objDataSerie[obj+' Variability'] = fVariability;
			minValue = Math.min(minValue,fVariability);
			maxValue = Math.max(maxValue,fVariability);
		});
		
		var solId = {};
		solId['solutionId'] = key;
		solId[decisionVariables[0]] = selectedSeries[key][decisionVariables[0]];
		solId[decisionVariables[1]] = selectedSeries[key][decisionVariables[1]];
		objDataSerie['id'] = solId;
		dataSeries.push(objDataSerie);
	}
	
	minValue -= (minValue*0.3);
	maxValue += (maxValue*0.3);
	objectives.forEach(function(obj){
		if (minValue < defaultScale[obj+' Variability'][0]) defaultScale[obj+' Variability'][0] = minValue;
		if (maxValue > defaultScale[obj+' Variability'][1]) defaultScale[obj+' Variability'][1] = maxValue;
	});
	
	//For each dimension, build a linear scale. All the scales are stored in y object
	var verticalAxesScales = {};
	for (i in dimensions) {
		var name = dimensions[i];
		var domain = defaultScale[name];
		verticalAxesScales[name] = d3.scaleLinear().domain(domain).range([height,0]);
	}
	
	//Update axes in case any scale changed
	parallelCoordG.selectAll('.pcAxis')
		.each(function(d,i){d3.select(this).call(d3.axisLeft().scale(verticalAxesScales[dimensions[i]]));}) //Call function to build vertical axis		
	
	function path(d) {
		return d3.line()(dimensions.map(function(p,i){
					return [horizontalScale(p),verticalAxesScales[p](d[p])+30];
				}));
	}
	
	//Draw the lines
	parallelCoordG.selectAll('pcPaths').data(dataSeries).enter()
					.append('g')
						.classed('serieComponent',true)
						.attr('id',function(d){return 'serieComponent-'+d['id']['solutionId'];})
						.attr('solutionId',function(d){return d['id']['solutionId'];})
					.append('path')
					.classed('serie',true)
					.classed('selected',true)
					.attr('id',function(d){return 'serie-'+d['id']['solutionId'];})
					.attr('d',path)
					.style('fill','none')
					.style('stroke',function(d,i){return seriesColors[d['id']['solutionId']];})
					.attr('color',function(d,i){return seriesColors[d['id']['solutionId']];})
					.style('stroke-width','2.5px')
					.on('mouseover',function(ev,d) {
						var textToShowList = Object.entries(d).filter(function(d){return d[0] != 'id';}).map(function(d){
							var range = (defaultScale[d[0]][1] - defaultScale[d[0]][0]);
							if (range == 0) range = 1;
							var proportionalValue = (d[1] - defaultScale[d[0]][0])/range;
							return '<strong>'+d[0]+'</strong>: '+proportionalValue.toFixed(3)+' ('+d[1].toFixed(3)+')';
							
						});
						var largerText = d3.max(textToShowList.map(function(d){return d.length;}));
						textToShow = textToShowList.join();
						var tooltipInfo = {
							msg: '<strong>'+d['id']['solutionId']+' ('+d['id'][decisionVariables[0]]+','+d['id'][decisionVariables[1]]+')</strong><br>'+textToShow.replace(/,/g,'<br>'),
							width: largerText*4.5,
							height: 14*Object.entries(d).length
						};
						overSerie(null,ev,d['id']['solutionId'],tooltipInfo,true);
					})
					.on('mouseout',function(ev,d) {
						overSerie(null,ev,d['id']['solutionId'],null,false);
					})
					
	parallelCoordG.selectAll('.serieComponent').selectAll('.vertex').data(function(d){return Object.entries(d).filter(function(d){return d[0] != 'id';});}).enter()
					.append('circle')
						.classed('vertex',true)
						.classed('selected',true)
						.attr('id',function(d,i){return 'axis-'+d3.select(this.parentNode).attr('solutionId')+'-'+i;})
						.attr('cx',function(d){return horizontalScale(d[0]);})
						.attr('cy',function(d){
								return verticalAxesScales[d[0]](d[1])+30;
							})
						.attr('r',2)
						.attr('stroke',function(d) {return d3.select(this.parentNode).select('#serie-'+d3.select(this.parentNode).attr('solutionId')).attr('color');})
						.attr('fill',function(d) {return d3.select(this.parentNode).select('#serie-'+d3.select(this.parentNode).attr('solutionId')).attr('color');})
						.attr('color',function(d) {return d3.select(this.parentNode).select('#serie-'+d3.select(this.parentNode).attr('solutionId')).attr('color');})
						.on('mouseover',function(ev,d) {
							var range = (defaultScale[d[0]][1] - defaultScale[d[0]][0]);
							if (range == 0) range = 1;
							var proportionalValue = (d[1] - defaultScale[d[0]][0])/range;
							var tooltipInfo = {
								msg: '<strong>'+d[0]+'</strong><br>'+proportionalValue.toFixed(3)+' ('+(+d[1]).toFixed(3)+')',
								width: 6.3*d[0].length,
								height: 30
							};
							overPoint(d3.select(this.parentNode),ev,d3.select(this).attr('id'),tooltipInfo,true);
						})
						.on('mouseout',function(ev) {
							overPoint(d3.select(this.parentNode),ev,d3.select(this).attr('id'),null,false);
						})
}

//Decision + Function (1 per timestamp)
function fillDecisionObjectivePC(decisionVariables,objectives,selectedMeasure,selectedSeries) {
	var decisionObjectivePCSVG = d3.selectAll('#decisionObjectivePCSVG');
	decisionObjectivePCSVG.selectAll('.serieComponent').remove(); //removing all series
	if ((!selectedSeries)||(Object.keys(selectedSeries).length == 0)) return; //nothing to show!
	var dataSeries = [];
	// set the dimensions and margins
	var width = 400 - margin.left - margin.right;
	var height = 300 - margin.top - margin.bottom;
	
	var decisionObjectivePCG = d3.select('#decisionObjectivePCG');
	var defaultScale = decisionObjectivePCG.data['defaultScaleDecisionObjective'];
	
	dimensions = Object.keys(defaultScale);
	
	//Build the X scale to equally position each Y axis
	horizontalScale = d3.scalePoint().range([0,width]).padding(1).domain(dimensions);
	
	var objDataSerie = {};
	var minValue = Number.MAX_VALUE;
	var maxValue = Number.MIN_VALUE;
	for (key of Object.keys(selectedSeries)) {
		var solId = {};
		solId['solutionId'] = key;	
		for (ts of Object.keys(selectedSeries[key].filteredValues)) {
			objDataSerie = {};
			objectives.forEach(function(obj){
				objDataSerie[obj] = selectedSeries[key].filteredValues[ts][obj];
				minValue = Math.min(minValue,objDataSerie[obj]);
				maxValue = Math.max(maxValue,objDataSerie[obj]);
			})
			objDataSerie['id'] = solId;
			objDataSerie[decisionVariables[0]] = selectedSeries[key][decisionVariables[0]];
			objDataSerie[decisionVariables[1]] = selectedSeries[key][decisionVariables[1]];
			objDataSerie['ts'] = ts;
			dataSeries.push(objDataSerie);
			
		}
	}
	minValue -= (minValue*0.3);
	maxValue += (maxValue*0.3);
	objectives.forEach(function(obj){
		if (minValue < defaultScale[obj][0]) defaultScale[obj][0] = minValue - (minValue*0.3);
		if (maxValue > defaultScale[obj][1]) defaultScale[obj][1] = maxValue + (maxValue*0.3);
	});
	
	//For each dimension, build a linear scale. All the scales are stored in y object
	var verticalAxesScales = {};
	for (i in dimensions) {
		var name = dimensions[i];
		var domain = defaultScale[name];
		verticalAxesScales[name] = d3.scaleLinear().domain(domain).range([height,0]);
	}
	
	function path(d) {
		return d3.line()(dimensions.map(function(p,i){
					return [horizontalScale(p),verticalAxesScales[p](d[p])+30];
				}));
	}

	//Draw the lines
	decisionObjectivePCG.selectAll('pcPaths').data(dataSeries).enter()
					.append('g')
						.classed('serieComponent',true)
						.attr('id',function(d){return 'serieComponent-'+d['id']['solutionId']+'-'+d['ts'];})
						.attr('solutionId',function(d){return d['id']['solutionId'];})
					.append('path')
					.classed('serie',true)
					.classed('selected',true)
					.attr('id',function(d){return 'serie-'+d['id']['solutionId']+'-'+d['ts'];})
					.attr('d',path)
					.style('fill','none')
					.style('stroke',function(d,i){return seriesColors[d['id']['solutionId']];})
					.attr('color',function(d,i){return seriesColors[d['id']['solutionId']];})
					.style('stroke-width','2.5px')
					.on('mouseover',function(ev,d) {
						var textToShowList = Object.entries(d).filter(function(d){return ((d[0] != 'id')&&(d[0] != 'ts'));}).map(function(d){
							var range = (defaultScale[d[0]][1] - defaultScale[d[0]][0]);
							if (range == 0) range = 1;
							var proportionalValue = (d[1] - defaultScale[d[0]][0])/range;
							try {
								var str = '<strong>'+d[0]+'</strong>: '+proportionalValue.toFixed(3)+' ('+d[1].toFixed(3)+')';
								return str;
							} catch(err) {
								console.log(err);
								return '<strong>'+d[0]+'</strong>: '+proportionalValue+' ('+d[1]+')';
							}
						});
						var largerText = d3.max(textToShowList.map(function(d){return d.length;}));
						textToShow = textToShowList.join();
						var tooltipInfo = {
							msg: '<strong>'+d['id']['solutionId']+' ('+d[decisionVariables[0]]+','+d[decisionVariables[1]]+' - '+d['ts']+')</strong><br>'+textToShow.replace(/,/g,'<br>'),
							width: largerText*4.5,
							height: 14*Object.entries(d).length
						};
						overSerie(null,ev,d['id']['solutionId'],tooltipInfo,true);
					})
					.on('mouseout',function(ev,d) {
						overSerie(null,ev,d['id']['solutionId'],null,false);
					})
	
}

var radarChartHeight = 300;
var radarChartWidth = 300;
var numBands = 4;
var maxRadius = 100;

function fillObjectiveFunctionsRadarChart(decisionVariables,objectives,selectedSeries) {
	var radarChartDiv = d3.select('#ObjectivesRadarChart');
	radarChartDiv.selectAll('div').remove(); //removing all charts
	if ((!selectedSeries)||(Object.keys(selectedSeries).length == 0)) return; //nothing to show!
	
	if (radarChartDiv.select('#scaleSelect').empty()) {
		var scales = [{text:'Individual Scales',value:'i'},{text:'Same Scale',value:'s'}];
		radarChartDiv.append('label').attr('for','scaleSelect').classed('labelWidget',true).text('Objective Scale: ');
		var scaleSelect = radarChartDiv.append('select').attr('id','scaleSelect');
		scaleSelect.selectAll('option').data(scales).enter()
					.append('option').text(function(d){return d.text;})
					.attr('value',function(d){return d.value;})
		scaleSelect.on('change',function(d){
			var scale = d3.select(this).node().value;
			updateObjectiveFunctionsRadarChart(scale,objectives,selectedSeries);
		});
		radarChartDiv.append('br');
	}
	
	var width = radarChartWidth;
	var height = radarChartHeight;
	var timeStampsInfo = Object.values(selectedSeries)[0].filteredValues;
	var axis = Object.keys(timeStampsInfo);
	var objectiveExtents = {};
	
	objectives.forEach(function(obj) {
		objectiveExtents[obj] = [Number.MAX_SAFE_INTEGER,Number.MIN_SAFE_INTEGER];
	});
	
	objectives.forEach(function(d) {
		var radarChartFDiv = radarChartDiv.append('div').attr('id','radarChart-'+d+'Div').attr('class','box')
		radarChartFDiv.append('text').classed('title',true).text(d);
		radarChartFDiv.append('br');
		var radarChartSVG = radarChartFDiv.append('svg').attr('id','radarChart-'+d+'SVG')
													.attr('height',height)
	});
	
	//iterate over all series to rescale axis and build the lines on these updated values.
	Object.keys(selectedSeries).forEach(function(key,ind) {
		var values = selectedSeries[key].filteredValues;
		objectives.forEach(function(obj) {
			var fValues = Object.values(values).map(function(dd){return dd[obj];});
			objectiveExtents[obj][0] = Math.min(objectiveExtents[obj][0],d3.min(fValues));
			objectiveExtents[obj][1] = Math.max(objectiveExtents[obj][1],d3.max(fValues));
		});
	})
	var scale = d3.select('#scaleSelect').node().value;
	if (scale == 's') {
		//Assign the same extent to all objectives extents, so we can use the same scale for all the objectives
		var globalExtents = d3.extent(Object.values(objectiveExtents).flat());
		objectives.forEach(function(obj) {
			objectiveExtents[obj] = globalExtents;
		});
	}
	var radialScale;
	
	var angleToCoordinateLine = function(angle,value){
		var x = Math.cos(angle) * (radialScale(value));
		var y = Math.sin(angle) * (radialScale(value));
		var ret = {'x': width / 2 + x, 'y': height / 2 - y}
		return ret;
	}
	
	var angleToCoordinateLabel = function(angle,value){
		var x = Math.cos(angle) * (radialScale(value)+20);
		var y = Math.sin(angle) * (radialScale(value)+15);
		var ret = {'x': width / 2 + x, 'y': height / 2 - y}
		return ret;
	}
	
	//Drawing circles, axes and labels
	objectives.forEach(function(d) {
		//circles
		radialScale = d3.scaleLinear().domain([0,Math.ceil(objectiveExtents[d][1])]).range([0,maxRadius]);
		var ticks = generateValues2(0.0,Math.ceil(objectiveExtents[d][1]),Math.ceil(Math.ceil(objectiveExtents[d][1])/(numBands)));
		radarChartSVG = d3.select('#radarChart-'+d+'SVG');
		radarChartSVG.selectAll('circle')
			.data(ticks)
			.join(
				enter => enter.append('circle')
					.attr('id',function(d,i){return 'tickCircle'+i;})
					.classed('tickCircle',true)
					.attr('cx',width/2)
					.attr('cy',height/2)
					.attr('fill','none')
					.attr('stroke','gray')
					.attr('r',function(d) {return radialScale(d);})
			);
		//Axis lines	
		var featureDataLine = axis.map(function(d,i) {
			var angle = (Math.PI/2) + (2*Math.PI*i/axis.length);
			return {
				'id': d,
				'angle': angle,
				'line_coord': angleToCoordinateLine(angle,d3.max(ticks))
			};
		});
		radarChartSVG.selectAll('line')
			.data(featureDataLine)
			.join(
				enter => enter.append('line')
					.attr('x1', width / 2)
					.attr('y1', height / 2)
					.attr('x2',function(d){return d.line_coord.x;})
					.attr('y2',function(d){return d.line_coord.y;})
					.attr('stroke','black')
			);
		//Axis label	
		var featureDataLabel = axis.map(function(d,i) {
			var angle = (Math.PI/2) + (2*Math.PI*i/axis.length);
			return {
				'id': d,
				'angle': angle,
				'label_coord': angleToCoordinateLabel(angle,d3.max(ticks))
			};
		});
		radarChartSVG.selectAll('.axislabel')
			.data(featureDataLabel)
			.join(
				enter => enter.append('text')
					.classed('axisLabel',true)
					.attr('x',function(d){return d.label_coord.x;})
					.attr('y',function(d){return d.label_coord.y+5;})
					.text(function(d){return d.id;})
			);
	});
	
	Object.keys(selectedSeries).forEach(function(key,ind) {
		var values = selectedSeries[key].filteredValues;
		objectives.forEach(function(d) {
			radarChartSVG = d3.select('#radarChart-'+d+'SVG');
			var fValues = Object.values(values).map(function(dd){return dd[d];}); //adding the first value to the last position, to close the shape.
			fValues.push(fValues[0]);
			var serieG = radarChartSVG.append('g')
				.classed('serieComponent',true)
				.attr('id',function(d){return 'serieComponent-'+key;})
				.attr('solutionId',function(d){return key;});
				
			radialScaleObj = d3.scaleLinear().domain([0,Math.ceil(objectiveExtents[d][1])]).range([0,maxRadius]);
			var angleToCoordinateObj = function(angle,value){
				var x = Math.cos(angle) * radialScaleObj(value);
				var y = Math.sin(angle) * radialScaleObj(value);
				var ret = {'x': width / 2 + x, 'y': height / 2 - y}
				return ret;
			}
			var lineObj = d3.line()
				.x(function(d,i){
					var angle = (Math.PI / 2) + (2 * Math.PI * i / axis.length);
					return width/2 + Math.cos(angle) * radialScaleObj(d);
				})
				.y(function(d,i){
					var angle = (Math.PI / 2) + (2 * Math.PI * i / axis.length);
					return height/2 - Math.sin(angle) * radialScaleObj(d);
				});
			serieG.append('path')
				.attr('id',function(d){return 'serie-'+key;})
				.datum(fValues)
				.attr('d',lineObj) //uses the info from datum to feed the line function
				.classed('serie',true)
				.classed('selected',true)
				.attr('stroke',function(d){return seriesColors[key];})
				.attr('stroke-width',2.0)
				.attr('stroke-opacity',1)
				.attr('fill',function(d){return seriesColors[key];})
				.style('fill-opacity',0.0)
				.attr('color',function(d){return seriesColors[key];})
				.attr('originalOpacity',0.0)
				.on('mouseover',function(ev,d) {
					var textToShow = Object.entries(values).map(function(e,i){
						var text = e[0]+': '+(+d[i]).toFixed(3);
						if ((e[1][measureConsidered]) == 1)
							text = '<font color="yellow">'+text+'</font>';
						return text;
					}).join();
					var title = '<strong>'+key+' ('+selectedSeries[key][decisionVariables[0]]+','+selectedSeries[key][decisionVariables[1]]+')</strong>';
					var tooltipInfo = {
						msg: title+'<br>'+textToShow.replace(/,/g,'<br>'),
						width: 4.2*title.length,
						height: 14*(d.length+1)
					};					
					overSerie(null,ev,key,tooltipInfo,true);
				})
				.on('mouseout',function(ev) {
					overSerie(null,ev,key,null,false);
				})
			//As we already draw the closed line, I can exclude the extra value from the array.
			fValues.splice(-1);
			serieG.selectAll('.vertex').data(Object.entries(values)).enter()
				.append('circle')
				.classed('vertex',true)
				.classed('selected',true)
				.attr('id',function(d,i){return 'vertex-'+key+'-'+i;})
				.attr('cx',function(dd,i){
							var angle = (Math.PI / 2) + (2 * Math.PI * i / axis.length);
							var r = angleToCoordinateObj(angle,dd[1][d]);
							return r.x;
					})
				.attr('cy',function(dd,i){
							var angle = (Math.PI / 2) + (2 * Math.PI * i / axis.length);
							var r = angleToCoordinateObj(angle,dd[1][d]);
							return r.y;
					})
				.attr('fill',function(d){return d3.select(this.parentNode).select('#serie-'+d3.select(this.parentNode).attr('solutionId')).attr('color');})
				.attr('r',function(dd) {
					if (dd[1][measureConsidered] == 1) return sizeVertex*3;
					else return sizeVertex;
				})
				.attr('stroke',function(dd) {
					if (dd[1][measureConsidered] == 1) return 'yellow';
					else return d3.select(this.parentNode).select('#serie-'+d3.select(this.parentNode).attr('solutionId')).attr('color');
				})
				.attr('stroke-width',function(d) {
						if (d[1][measureConsidered] == 1) {
							return 4;
						}
						else return 1;
					})
				.attr('color',function(d){return d3.select(this.parentNode).select('#serie-'+d3.select(this.parentNode).attr('solutionId')).attr('color');})
				.on('mouseover',function(ev,dd) {
					var text = dd[0]+': '+dd[1][d].toFixed(3);
					var textLength = text.length;
					if (dd[1][measureConsidered] == 1) text = '<font color="yellow">'+text+'</font>';
					var tooltipInfo = {
						msg: text,
						width: 6.2*textLength,
						height: 15
					};
					overPoint(null,ev,d3.select(this).attr('id'),tooltipInfo,true,ev);
				})
				.on('mouseout',function(ev) {
					overPoint(null,ev,d3.select(this).attr('id'),null,false);
				})
		});
	});
}

function updateObjectiveFunctionsRadarChart(scale,objectives,selectedSeries) {
	
	var timeStampsInfo = Object.values(selectedSeries)[0].filteredValues;
	var axis = Object.keys(timeStampsInfo);
	var objectiveExtents = {};
	
	objectives.forEach(function(obj) {
		objectiveExtents[obj] = [Number.MAX_SAFE_INTEGER,Number.MIN_SAFE_INTEGER];
	});
	
	var angleToCoordinate = function(angle,value){
		var x = Math.cos(angle) * radialScale(value);
		var y = Math.sin(angle) * radialScale(value);
		var ret = {'x': radarChartWidth / 2 + x, 'y': radarChartHeight / 2 - y}
		return ret;
	}
	
	//iterate over all series to rescale axis and build the lines on these updated values.
	Object.keys(selectedSeries).forEach(function(key,ind) {
		var values = selectedSeries[key].filteredValues;
		objectives.forEach(function(obj) {
			var fValues = Object.values(values).map(function(dd){return dd[obj];});
			objectiveExtents[obj][0] = Math.min(objectiveExtents[obj][0],d3.min(fValues));
			objectiveExtents[obj][1] = Math.max(objectiveExtents[obj][1],d3.max(fValues));
		});
	})
	
	if (scale == 's') {
		//Assign the same extent to all objectives extents, so we can use the same scale for all the objectives
		var globalExtents = d3.extent(Object.values(objectiveExtents).flat());
		objectives.forEach(function(obj) {
			objectiveExtents[obj] = globalExtents;
		});
	}
	var radialScale;
	
	//redrawing circles, axes and labels
	objectives.forEach(function(d) {
		var radarChartSVG = d3.select('#radarChart-'+d+'SVG');
		radarChartSVG.selectAll('.tickCircle').remove();
		radialScale = d3.scaleLinear().domain([0,Math.ceil(objectiveExtents[d][1])]).range([0,maxRadius]);
		var ticks = generateValues2(0.0,Math.ceil(objectiveExtents[d][1]),Math.ceil(Math.ceil(objectiveExtents[d][1])/(numBands)));
		radarChartSVG.selectAll('.tickCircle')
			.data(ticks)
			.join(
				enter => enter.append('circle')
					.attr('id',function(d,i){return 'tickCircle'+i;})
					.classed('tickCircle',true)
					.attr('cx',radarChartWidth/2)
					.attr('cy',radarChartHeight/2)
					.attr('fill','none')
					.attr('stroke','gray')
					.attr('r',function(d) {return radialScale(d);})
			);
		var featureData = axis.map(function(d,i) {
			var angle = (Math.PI/2) + (2*Math.PI*i/axis.length);
			return {
				'id': d,
				'angle': angle,
				'line_coord': angleToCoordinate(angle,d3.max(ticks)),
				'label_coord': angleToCoordinate(angle,d3.max(ticks)+0.1)
			};
		});
	});
	
	Object.keys(selectedSeries).forEach(function(key,ind) {
		var values = selectedSeries[key].filteredValues;
		objectives.forEach(function(d) {
			radarChartSVG = d3.select('#radarChart-'+d+'SVG');
			var serieG = radarChartSVG.select('#serieComponent-'+key);
			var fValues = Object.values(values).map(function(dd){return dd[d];});
			radialScaleObj = d3.scaleLinear().domain([0,Math.ceil(objectiveExtents[d][1])]).range([0,maxRadius]);
			var angleToCoordinateObj = function(angle,value){
				var x = Math.cos(angle) * radialScaleObj(value);
				var y = Math.sin(angle) * radialScaleObj(value);
				var ret = {'x': radarChartWidth / 2 + x, 'y': radarChartHeight / 2 - y}
				return ret;
			}
			fValues.push(fValues[0]); //adding the first value to the last position, to close the shape.
			var lineObj = d3.line()
				.x(function(d,i){
					var angle = (Math.PI / 2) + (2 * Math.PI * i / axis.length);
					return radarChartWidth/2 + Math.cos(angle) * radialScaleObj(d);
				})
				.y(function(d,i){
					var angle = (Math.PI / 2) + (2 * Math.PI * i / axis.length);
					return radarChartHeight/2 - Math.sin(angle) * radialScaleObj(d);
				});
			
			Object.keys(values).forEach(function(v,ind){
				var path = serieG.select('#serie-'+key);
				path.attr('d',lineObj);
				path.datum(fValues);
				var vertex = serieG.select('#vertex-'+key+'-'+ind);
				vertex.attr('cx',function(dd,i){
							var angle = (Math.PI / 2) + (2 * Math.PI * ind / axis.length);
							var r = angleToCoordinateObj(angle,dd[1][d]);
							return r.x;
					});
				vertex.attr('cy',function(dd,i){
							var angle = (Math.PI / 2) + (2 * Math.PI * ind / axis.length);
							var r = angleToCoordinateObj(angle,dd[1][d]);
							return r.y;
					});
			});
		});
	});
}

function overSerie(parentDOM,ev,id,tooltipInfo,entering) {
	var selectedSerieComponents = null;
	if (parentDOM == null)
		selectedSerieComponents = d3.selectAll('#serieComponent-'+id);
	else
		selectedSerieComponents = parentDOM.selectAll('#serieComponent-'+id);
	selectedSerieComponents = selectedSerieComponents.selectAll('*');
	var div3d;
	if (render3DChart) { //TO DO: improve this 'if' structure!
		div3d = 'Variability3DChart';
		var myPlot = document.getElementById(div3d);
		var idValues = myPlot.data[1].ids;
		var markerData = myPlot.data[1].marker;
		var toolTipData = myPlot.layout.hoverlabel;
	}
	if (entering) {
		//highlighting square in variability 2d
		var clickedRects = d3.selectAll('#'+id);
		clickedRects.attr('fill',selectionColor).attr('stroke',selectionColor);
		//highlighting option on selected list
		var selectedOption = d3.select('#hm-'+id).attr('visibility','visible')
		
		selectedSerieComponents.style('stroke','black');
		selectedSerieComponents.style('fill-opacity',0.8);
		selectedSerieComponents.each(function(d){
			var el = d3.select(this);
			if (el.classed('vertex')) el.style('fill','black');
		});
		if (tooltipInfo) {
			toolTip.style('opacity', .9).style('top',(ev.y-15)+'px');
			var endTooltip = ev.x+5+tooltipInfo.width;
			if (endTooltip >= (document.documentElement.clientWidth - 10)) //This extra 10 is just to have a safe zone to change the position of the tooltip.
				toolTip.style('left',(ev.x-tooltipInfo.width-5)+'px');
			else
				toolTip.style('left',(ev.x+5)+'px');
			
			toolTip.style('width',tooltipInfo.width+'px').style('height',tooltipInfo.height+'px');
			toolTip.html(tooltipInfo.msg);
		}
		if (render3DChart) { //TO DO: improve this 'if' structure!
			var idSelected = idValues.indexOf(id);
			if (idSelected != -1) {
				markerData.color[idSelected] = selectionColor;
				markerData.line.color[idSelected] = selectionColor;
			}
			toolTipData.bgcolor = 'red';
		}
	}else {
		toolTip.style('opacity',0).style('left','0px').style('top','0px');
		var clickedRects = d3.selectAll('#'+id);
		if (id in selectedSeries)
			clickedRects.attr('fill','red').attr('stroke','red');
		var selectedOptionList = d3.select('#leg-'+id);
		var selectedOption = d3.select('#hm-'+id).attr('visibility','hidden');
		selectedSerieComponents.each(function(d){
			var el = d3.select(this);
			var valueColor = el.attr('color');
			el.style('stroke',valueColor);
			if (el.classed('vertex')) {
				if ((d[1][measureConsidered] != null)&&(d[1][measureConsidered] == 1)) {
					el.attr('r',sizeVertex*3);
					el.style('stroke','#FFC90E'); //if (d[1][measureConsidered] == 1) return '#FFC90E';//return 'yellow';
					el.style('stroke-width',4);
					el.style('fill',valueColor);
				}else {
					el.style('stroke-width',1);
					el.style('fill',valueColor);
				}
			}
			var valueOpacity = el.attr('originalOpacity');
			if ((valueOpacity != null)||(valueOpacity != ''))
				el.style('fill-opacity',valueOpacity);
		});
		if (render3DChart) { //TO DO: improve this 'if' structure!
			var idSelected = idValues.indexOf(id);
			if (idSelected != -1) {
				markerData.color[idSelected] = 'red';
				markerData.line.color[idSelected] = 'red';
			}
			toolTipData.bgcolor = '#444444';
		}
	}

	if (render3DChart) {
		var updateMarker = {
			marker: markerData
		};
		var updateColor = {
			hoverlabel: toolTipData
		};
		setTimeout(() => {
					Plotly.restyle(div3d,updateMarker,[1]);
					Plotly.relayout(div3d,updateColor);
				},200);
	}
}

function overPoint(parentDOM,ev,id,tooltipInfo,entering) {
	var selectedVertex = null;
	if (parentDOM == null) selectedVertex = d3.selectAll('#'+id);
	else selectedVertex = parentDOM.selectAll('#'+id);
	if (entering) {
		selectedVertex.style('stroke',selectionColor);
		selectedVertex.style('fill',selectionColor);
		selectedVertex.attr('r',sizeVertex*2.5);
		if (tooltipInfo) {
			toolTip.style('opacity', .9).style('top',(ev.y-15)+'px');
			var endTooltip = ev.x+5+tooltipInfo.width;
			if (endTooltip >= (document.documentElement.clientWidth - 10)) //This extra 10 is just to have a safe zone to change the position of the tooltip.
				toolTip.style('left',(ev.x-tooltipInfo.width-5)+'px');
			else
				toolTip.style('left',(ev.x+5)+'px');
			toolTip.style('width',tooltipInfo.width+'px')
			.style('height',tooltipInfo.height+'px');
			toolTip.html(tooltipInfo.msg);
		}
		var clickedRect = d3.select('#variationChartG').select('#'+id);
		clickedRect.attr('fill',selectionColor).attr('stroke',selectionColor);
	}else {
		toolTip.style('opacity',0).style('left','0px').style('top','0px');
		var clickedRect = d3.select('#variationChartG').select('#'+id);
		clickedRect.attr('fill','red').attr('stroke','red');
		selectedVertex.attr('r',sizeVertex);
		var valueColor = selectedVertex.attr('color');		
		if ((selectedVertex.classed('vertex'))&&(selectedVertex.data()[0][1][measureConsidered] == 1)) {
			selectedVertex.style('fill',valueColor);
			selectedVertex.style('stroke','#FFC90E');
			selectedVertex.attr('r',sizeVertex*2.5);
		}else {
			selectedVertex.style('fill',valueColor);
			selectedVertex.style('stroke',valueColor);
		}
	}
}