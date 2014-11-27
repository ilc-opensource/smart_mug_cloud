var drawingUtil = null;
$(function() {
	String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
	var theCanvas = document.getElementById("theCanvas");
	drawingUtil = new DrawingUtil(theCanvas);
	
	theCanvas.width = window.innerWidth;
	theCanvas.height = window.innerHeight;
	
	$( "#weightSlider" ).bind( "change", function(event, ui) {
	   var theNewVal = $(this).val();
	   drawingUtil.setStrokeWeight(theNewVal);
    });
	
});

function DrawingUtil(aCanvas) {
	var canvas = aCanvas;
	var context = canvas.getContext("2d");
	var isDrawing = false;
	var headerHeight = $("#theHeader").height();
	init();
	
	function start(event) {
		isDrawing = true;
		context.beginPath();
		context.moveTo(getX(event),getY(event));
		event.preventDefault();
	}
	
	function draw(event) {
		if(isDrawing) {
			context.lineTo(getX(event),getY(event));
			context.stroke();
		}
		event.preventDefault();
	}
	
	function stop(event) {
		if(isDrawing) {
			context.stroke();
			context.closePath();
			isDrawing = false;
		}
		event.preventDefault();
	}
	
	function getX(event) {
		if(event.type.contains("touch")) {
			return event.targetTouches[0].pageX;
		}
		else {
			return event.layerX;
		}
	}
	
	function getY(event) {
		if(event.type.contains("touch")) {
			return event.targetTouches[0].pageY-headerHeight;
		}
		else {
			return event.layerY;
		}
	}
	
	this.clear = function() {
		context.clearRect(0,0,canvas.width,canvas.height);
	}
	
	this.toImage = function() {
    	var imageData = canvas.toDataURL();
    	$("#thePopupImage").attr("src",imageData);
    	$.mobile.popup.prototype.options.initSelector = "#popupPhoto";
    	$('#popupPhoto').popup('open',0,0);
	}
	
	this.setStrokeWeight = function(weight) {
    	context.lineWidth = weight;
	}
	
	function init() {
		canvas.addEventListener("touchstart",start,false);
		canvas.addEventListener("touchmove",draw,false);
		canvas.addEventListener("touchend",stop,false);
		canvas.addEventListener("mousedown",start,false);
		canvas.addEventListener("mousemove",draw,false);
		canvas.addEventListener("mouseup",stop,false);
		canvas.addEventListener("mouseout",stop,false);
	}
}

function showWeightSlider() {
    $('#popupSlider').popup('open');
}
