var difficulty=30
window.onload = () => {
    // document.body.innerHTML=''
    // '<button id=\'start\'><img src="start_button.svg" height ="80" width="100" /></button>'+
    // '<br>'+
    // '<div> Select Difficulty </div><input id="difficulty" type="range" min="15" max="45" value="20" step =1></input><br>'
   
    document.getElementById('start').onclick = function(){ difficulty = document.getElementById('selectDifficultySlider').value;startGame()};
};

function startGame(){
    document.body.innerHTML=
    '<div id="info">'+
        '<div id="title">Superman</div>'+
        '<div class="divider"></div>'+
        '<div id="score">Score: </div>'+
        '<div id="distance">Distance: </div>'+
        '<div> Health: </div><input id="health" type="range" min="0" max="100" value="100" disabled></input><br>'+
    '</div>'+
    '<div id="controls">'+
        '<div id="title">Commands</div>'+
        '<div>left/right arrows move superman </div>'+
        '<div>up/down arrows change moon distance </div>'+
        '<div>l/r move arms </div>'+
        '<div>p to pause the game</div>'+
        '<div>m speed up moon rotation</div>'+
    '</div>'
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    document.body.appendChild(renderer.domElement);
    //3d scene
    const game = new Game(scene, camera, difficulty);
    //__________
    //animate loop
    function animate() {
        requestAnimationFrame( animate );
        game.update();
        renderer.render( scene, camera );
    }
    animate()
    //_________
}