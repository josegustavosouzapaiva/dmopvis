var widthTooltip = 100;
var heightTooltip = 40;

function buildFillStaticChart(plotData,decisionVariables,selectedMeasure,selectedTimestamp,swap,ignorePS) {
	//Building blocks div
	var x1Values = plotData.map(function(d){return +d[decisionVariables[0]];}).filter(function(v,i,a){return a.indexOf(v) === i;});
	var x2Values = plotData.map(function(d){return +d[decisionVariables[1]];}).filter(function(v,i,a){return a.indexOf(v) === i;});
	
	var chartWidth = x1Values.length;
	var chartHeight = x2Values.length;
	
	var staticChart2DDiv = d3.select('body').append('div').attr('id','staticChart2DDiv').attr('class','layout');
	staticChart2DDiv.append('text').classed('title',true).text('2D Landscape - Timestamp '+selectedTimestamp+' - '+selectedMeasure.split('-')[0]);
	
	var filtersDiv = staticChart2DDiv.append('div').attr('id','filtersDiv')
											 .attr('height',125)
											 .attr('width',60)
	
	var staticChart2DSVG = staticChart2DDiv.append('svg').attr('id','staticChart2DSVG')
											 .attr('height',chartHeight*hRect+50)
											 .attr('width',chartWidth*wRect+60);
											 
	var staticChart2DG = staticChart2DSVG.append('g').attr('id','staticChart2DG')
										 .attr('transform','translate(' + 30 + ',' + 10 + ')');
	
	var measureScale;
	if (selectedMeasure.endsWith('.csv')) {
		var rangeFirstGenerations = d3.extent(plotData.map(function(d){return +d['fs'];}).filter(function(d){return d != null}));
		var rangeLastGenerations = d3.extent(plotData.map(function(d){return +d['ls'];}).filter(function(d){return d != null}));
		var rangeGenerations = [Math.min(rangeFirstGenerations[0],rangeLastGenerations[0]),
								Math.max(rangeFirstGenerations[1],rangeLastGenerations[1])];
		staticChart2DDiv.data['rangeGenerations'] = rangeGenerations;
		staticChart2DDiv.data['selectedMeasure'] = selectedMeasure;
		
		filtersDiv.append('input').attr('id','showFirstInput').attr('type','checkbox')
			.on('change',function(d){
				var showFirst = d3.select(this).property('checked');
				var showLast = d3.select('#staticChart2DDiv').select('#showLastInput').property('checked');
				var rangeGenerations = staticChart2DDiv.data['rangeGenerations'];
				var selectedMeasure = staticChart2DDiv.data['selectedMeasure'].split('-')[0];
				staticChart2DG.selectAll('rect').each(function(r,i){
					if (r[selectedMeasure] != null) {
						var value = d3.select(this).attr('color');
						if ((showFirst)&&(r['gens'].includes(rangeGenerations[0]))) value = 'green';
						if ((showLast)&&(r['gens'].includes(rangeGenerations[1]))) value = 'red';
						d3.select(this).attr('fill',value);
						d3.select(this).attr('stroke',value);
					}
				});
			});
		filtersDiv.append('label').attr('for','showFirstInput').classed('labelWidget',true)
			.text('First Generation')
			
		filtersDiv.append('input').attr('id','showLastInput').attr('type','checkbox')
			.on('change',function(d){
				var showFirst = d3.select('#staticChart2DDiv').select('#showFirstInput').property('checked');
				var showLast = d3.select(this).property('checked');
				var rangeGenerations = staticChart2DDiv.data['rangeGenerations'];
				var selectedMeasure = staticChart2DDiv.data['selectedMeasure'].split('-')[0];
				staticChart2DG.selectAll('rect').each(function(r,i){
					if (r[selectedMeasure] != null) {
						var value = d3.select(this).attr('color');
						if ((showFirst)&&(r['gens'].includes(rangeGenerations[0]))) value = 'green';
						if ((showLast)&&(r['gens'].includes(rangeGenerations[1]))) value = 'red';
						d3.select(this).attr('fill',value);
						d3.select(this).attr('stroke',value);
					}
				});
			});
		filtersDiv.append('label').attr('for','showLastInput').classed('labelWidget',true)
			.text('Last Generation')	
		
		filtersDiv.append('br');
		
		//Scale legend
		var values = plotData.map(function(d){return +d[selectedMeasure.split('-')[0]];}).filter(function(d){return !isNaN(d);}).sort(function(a, b){return a - b});
		
		selectedMeasure = selectedMeasure.split('-')[0]; //Try to remove it in the future, not replace on variable
		var rangeColors = buildColors('#9ecae1','#08519c',5);
		measureScale = (swap.toLowerCase() === 'true') ? d3.scaleQuantile().domain(values).range(rangeColors.reverse()) : d3.scaleQuantile().domain(values).range(rangeColors);
		
		var dict = {};
		values.forEach(function(d){
			var v = measureScale(d);
			if (!(v in dict)) dict[v] = [];
			dict[v].push(d);
		});
		
		var fontSize = 160;
		
		var legendSVG = filtersDiv.append('svg')
										.attr('id','legendSVG')
										.attr('height',55)
										.attr('width',function(d){return 30+Object.keys(dict).length*fontSize});
		
		var legendG = legendSVG.append('g')
							  .attr('id','legend')
							  .attr('transform','translate(30,15)');
		
		legendG.selectAll('rect').data(Object.keys(dict)).enter()
												.append('rect')
												.attr('id',function(d){return 'legend-'+d.substring(1);})
												.attr('x',function(d,i){return i*fontSize;})
												.attr('y',0)
												.attr('height',15)
												.attr('width',fontSize)
												.attr('stroke','black')
												.attr('fill',function(d,i){return d;})
												.on('click',function(d){
													if (d3.select(this).data['clicked'] == null)
														d3.select(this).data['clicked'] = false;
													if (!d3.select(this).data['clicked']) {
														d3.select(this).attr('stroke','red');
														staticChart2DG.selectAll('rect')
																		.attr('stroke-opacity',0.2)
																		.style('fill-opacity',0.2)
														var color = d3.select(this).attr('fill');
														staticChart2DG.selectAll('.c'+color.substring(1))
																		.attr('stroke-opacity',1.0)
																		.style('fill-opacity',1.0)
														d3.select(this).data['clicked'] = true;		
													}else {
														d3.select(this).attr('stroke','black');
														staticChart2DG.selectAll('rect')
																		.attr('stroke-opacity',1.0)
																		.style('fill-opacity',1.0)
														d3.select(this).data['clicked'] = false;
													}
												});
												
		legendG.selectAll('text').data(Object.values(dict)).enter()
												.append('text')
												.classed('axisLabel',true)
												.attr('x',function(d,i){return 63+(i*fontSize);})
												.attr('y',35)
												.text(function(d){
														return d3.min(d)+' - '+d3.max(d);
												});
	}else {
		var range = d3.extent(plotData,function(d){return +d[selectedMeasure.split('-')[0]];});
		var colorInterpolator = (swap.toLowerCase() === 'true') ? d3.interpolate('blue','white') : d3.interpolate('white','blue');
		measureScale = d3.scaleSequential().domain(d3.extent(range)).interpolator(colorInterpolator);
		//Show range for scale purposes:
		console.log('Timestamp '+selectedTimestamp+': '+d3.extent(range));
	}
	
	//Rects
	var numberInstancesPS = 0;
	staticChart2DG.selectAll('rect').data(plotData).enter()
			.append('rect')
			.attr('id',function(d,i){return d.id;})
			.attr('x',function(d,i){return Math.trunc(i/chartHeight)*wRect;})
			.attr('y',function(d,i){return (i%chartHeight)*hRect;})
			.attr('width',wRect)
			.attr('height',hRect)
			.attr('fill',function(d,i){
				var value = 'white';
				if (d[selectedMeasure] != null) {
					value = measureScale(+d[selectedMeasure]);
				}
				if (+d['dl'] == 1) {
					value = 'black';
					if (d.hasOwnProperty('ngens')) {
						numberInstancesPS++;
					}
				}
				return value;
			})
			.attr('class',function(d){
				var value = 'white';
				if (d[selectedMeasure] != null)
					value = measureScale(+d[selectedMeasure]);ss
				return 'c'+value.substring(1);
			})
			.attr('stroke',function(d){
				var value = 'white';
				if (d[selectedMeasure] != null)
					value = measureScale(+d[selectedMeasure]);
				if (+d['dl'] == 1) value = 'black';
				return value;
			})
			.attr('color',function(d){
				var value = 'white';
				if (d[selectedMeasure] != null)
					value = measureScale(+d[selectedMeasure]);
				if (+d['dl'] == 1) value = 'black';
				return value;
			})
			.on('mouseover',function(ev,d) {
				toolTip.style('opacity', .9).style('top',(ev.y-15)+'px');
				var endTooltip = ev.x + 5 + widthTooltip;
				if (endTooltip >= (document.documentElement.clientWidth - 10)) //This extra 10 is just to have a safe zone to change the position of the tooltip.
					toolTip.style('left',(ev.x-widthTooltip)+'px');
				else
					toolTip.style('left',(ev.x+5)+'px');
				toolTip.style('width',widthTooltip).style('height',heightTooltip);
				var textTooltip = decisionVariables[0]+': '+(+d[decisionVariables[0]]).toFixed(3);
				textTooltip += '<br>'+decisionVariables[1]+': '+(+d[decisionVariables[1]]).toFixed(3);
				if (d[selectedMeasure] != null) {
					if (Number.isInteger(+d[selectedMeasure]))
						textTooltip += '<br>Value: '+(+d[selectedMeasure]);
					else
						textTooltip += '<br>Value: '+(+d[selectedMeasure]).toFixed(3);
				}else
					textTooltip += '<br>Value: Never choosen';
				toolTip.html(textTooltip);				
			})
			.on('mouseout',function(d){
				toolTip.style('opacity',0).style('left','0px').style('top','0px');
			})
			
	console.log('Number of instanes in PS - Timestamp '+selectedTimestamp+': '+numberInstancesPS);
	//Axis
	var x1Extent = d3.extent(plotData,function(d){return +d[decisionVariables[0]];});
	var x1set = Array.from(new Set(plotData.map(function(d){return +d[decisionVariables[1]];})));
	var xScale = d3.scaleLinear().domain(x1Extent).range([0,chartWidth*wRect]).nice();
	var xAxis = d3.axisBottom().scale(xScale).tickValues(x1set.filter(function(d) {return Number.isInteger(d);}));
	var xAxisG = staticChart2DG.append('g').attr('id','xAxis');
	xAxisG.attr('transform','translate('+30+','+(chartHeight*hRect)+')')
	xAxisG.append('text').classed('axisLabel',true).attr('transform','translate('+(chartWidth*wRect/2)+','+30+')').text(decisionVariables[0]);
	
	var x2Extent = d3.extent(plotData,function(d){return +d[decisionVariables[1]];});
	var x2set = Array.from(new Set(plotData.map(function(d){return +d[decisionVariables[1]];})));
	var yScale = d3.scaleLinear().domain(x2Extent).range([0,chartHeight*hRect]);
	var yAxis = d3.axisLeft().scale(yScale).tickValues(x2set.filter(function(d){return Number.isInteger(d);}));
	var yAxisG = staticChart2DG.append('g').attr('id','yAxis')
	yAxisG.attr('transform','translate('+(-5)+','+10+')');
	yAxisG.append('text').classed('axisLabel',true).attr('transform','translate('+0+','+(chartHeight*hRect/2)+'),rotate(-90)').text(decisionVariables[1]);
	
}