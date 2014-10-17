var eightSound = new Audio('http://mychain.io/audio/8.mp3');

function eightMouseDown(){
  var button = $('#eight-button');
  button.css('background-color', '#e8e8e8');
  button.css('width', '84px');
  button.css('height', '84px');
  button.css('font-size', '60px');
  button.css('margin-top', '52px');
  $('.eight-display').css('color', '#d8d8d8');
  eightSound.play();
}

function eightMouseUp(){
  var button = $('#eight-button');
  button.css('background-color', '#f8f8f8');
  button.css('width', '88px');
  button.css('height', '88px');
  button.css('font-size', '62px');
  button.css('margin-top', '50px');
  $('.eight-display').css('color', '#080808');
}

function eightEnter(){
  var button = $('#eight-button');
  button.css('cursor', 'hand');
}

function eightLeave(){
  var button = $('#eight-button');
  button.css('cursor', 'pointer');
}

$('#eight-button').mousedown(eightMouseDown);
$('#eight-button').mouseup(eightMouseUp);
$('#eight-button').mouseenter(eightEnter).mouseleave(eightLeave);
