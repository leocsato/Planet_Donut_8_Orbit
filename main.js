var scene, camera, renderer;//elementos basicos para criar o cenario

//para filtros de pos-processamento
var composer;
var BloomAtivar = new THREE.BloomPass( 1.5, 25, 4, 256 );//controla o efeito de Bloom(intensidade, distancia, largura, resolução )
var luz1,luz2;
//var Luz1Camera = null;
//var Luz2Camera = null;
//

//Grupo que vai conter o planeta donut, as suas nuvens, a sua atmosfera
var group = new THREE.Group();
var group2 = new THREE.Group();//esse vai conter a lua/
//

//para a navegação no espaço criado via MOUSE
var orbitControls;
//

//variavel t para a trajetória da orbita do planeta donut por cada sol e t2 para a da lua
var t = 0;
var t2 = 0;
//

//variaveis para cada Sol
var Sun1, Sun2, movSun;
var clock = new THREE.Clock();//Para o movimento da superficie do Sol.
//

//variaveis de configuração
var params = {
    RotationEarth: 0.007,
    RotationSol1: -0.007,
    RotationSol2: -0.007,
    RotationMoon: 0.007,
    DistanceSuns: 1400,
    DistanceMoon: 27,
    OrbitMoon: false,
    VelocMoon: 1,
    OrbitPlanet: false,
    VelocPlanet: 1,
    Bloom: 1.5,
    IntensityLight: 2,
    //InfoTorusPlanet: "Nothing yet",
    //InfoOrbit8: "Nothing yet",
    InfoHelp: "Aperte H"
};
//

var WIDTH  = window.innerWidth;
var HEIGHT = window.innerHeight;

function init() {

    initMenu();
    initScene();
    initCamera();
    initLights();
    initModel();
    initRenderer();

    document.body.appendChild(renderer.domElement);
}

//PARA O MENU DE OPÇÕES
function initMenu(){
    var gui = new dat.GUI();

    //Tipos de Variaveis de configuracoes
    var RotationGui = gui.addFolder('Rotações');
    var DistanceGui = gui.addFolder('Distâncias');
    var OrbitMovementGui = gui.addFolder('Movimentos de órbita');
    var EfeitosGui = gui.addFolder('Efeitos');
    var InfosGui = gui.addFolder('Ajuda');

    RotationGui.add( params, 'RotationEarth', -0.1, 0.1 ).name("Rotação da Terra");
    RotationGui.add( params, 'RotationSol1', -0.1, 0.1 ).name("Rotação do Sol Direito");
    RotationGui.add( params, 'RotationSol2', -0.1, 0.1 ).name("Rotação do Sol Esquerdo");
    RotationGui.add( params, 'RotationMoon', -0.1, 0.1 ).name("Rotação da Lua");
    DistanceGui.add(params,'DistanceSuns', 600,1400).name("Sóis");
    DistanceGui.add(params,'DistanceMoon', -27,27).name("Lua eixo Y");
    OrbitMovementGui.add(params,'OrbitMoon').name("Lua");
    OrbitMovementGui.add(params,'VelocMoon', 0, 9).name("Velocidade Lua");
    OrbitMovementGui.add(params,'OrbitPlanet').name("Planeta");
    OrbitMovementGui.add(params,'VelocPlanet', 0, 9).name("Velocidade Planeta");
    EfeitosGui.add(params,'Bloom',0,5).name("Bloom");
    EfeitosGui.add(params,'IntensityLight',0,10).name("Luz Solar");
    //InfosGui.add(params,'InfoTorusPlanet').name("Planetas Toróides");
    //InfosGui.add(params,'InfoOrbit8').name("Órbitas tipo 8");
    InfosGui.add(params,'InfoHelp').name("Esconder Menu");
    //
}

//

function initScene(){
  scene = new THREE.Scene();
  var ambient = new THREE.AmbientLight( 0x101030, 0.5 );//(controla cor da luz ambiente do cenario, controla a intensidade)
  scene.add( ambient );

  /////CUBO QUE VAI SER O SKYBOX DO CENARIO CRIADO
  				var r = "textures/cube/MilkyWay/";
  				var urls = [ r + "dark-s_px.jpg", r + "dark-s_nx.jpg",
  							 r + "dark-s_py.jpg", r + "dark-s_ny.jpg",
  							 r + "dark-s_pz.jpg", r + "dark-s_nz.jpg" ];

  				var textureCube = new THREE.CubeTextureLoader().load( urls );
  				textureCube.format = THREE.RGBFormat;
  				var skyboxShader = THREE.ShaderLib[ "cube" ];
  				skyboxShader.uniforms[ "tCube" ].value = textureCube;

  				var skyboxMaterial = new THREE.ShaderMaterial( {

  					fragmentShader: skyboxShader.fragmentShader,
  					vertexShader: skyboxShader.vertexShader,
  					uniforms: skyboxShader.uniforms,
  					depthWrite: false,
  					side: THREE.DoubleSide//fazer aparecer no cubo que serve de cenário tanto para dentro como para fora as imagens do espaço
  				} ),
  				skybox = new THREE.Mesh( new THREE.BoxGeometry( 200, 200, 200 ), skyboxMaterial );
          skybox.applyMatrix( new THREE.Matrix4().makeScale( 50, 50, - 50 ) );//aumentar o tamanho do cubo que serve de cenário
  				scene.add( skybox );
  ///
}

function initCamera() {
    camera = new THREE.PerspectiveCamera(70, WIDTH / HEIGHT, 1, 30000);//(,,controla a visão de proximidade,controla a visão de distância)
    camera.position.set(0, 3.5, 200);
    camera.lookAt(scene.position);

////PARA CONTROLES DE CAMERA COM O MOUSE
    orbitControls = new THREE.OrbitControls( camera, renderer );
    orbitControls.autoRotate = true;
    orbitControls.autoRotateSpeed = 1;
//
}

//Cria dois tipos diferentes de modelos do Sol, usando imagens diferentes para o Shader
function SunModel(cont){

      var uniforms,material,Sun;
      var textureLoader = new THREE.TextureLoader();

      //para carregar as diferentes texturas usando o cont como argumento
      var url1 = "textures/lava/cloud" + cont + ".png";
      var url2 = "textures/lava/lavatile" + cont + ".jpg";
      //

      uniforms = {

        fogDensity: { value: 0 },//controla como o sol vai aparecer de longe, quanto maior o valor mais dificil vai ser ver o sol de longe
        fogColor:   { value: new THREE.Vector3( 0, 0, 0 ) },
        time:       { value: 5.0 },
        resolution: { value: new THREE.Vector2() },
        uvScale:    { value: new THREE.Vector2( 3, 3 ) },
          texture1:   { value: textureLoader.load( url1 ) },
          texture2:   { value: textureLoader.load( url2 ) }
      };

      uniforms.texture1.value.wrapS = uniforms.texture1.value.wrapT = THREE.RepeatWrapping;
      uniforms.texture2.value.wrapS = uniforms.texture2.value.wrapT = THREE.RepeatWrapping;

      var size = 100;

      material = new THREE.ShaderMaterial( {

        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent

      } );

      movSun = uniforms;

      Sun = new THREE.Mesh( new THREE.SphereGeometry(size, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2), material );
      Sun.rotation.x = 0.3;
      return Sun;

}

function initRenderer() {
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( 0xffffff );//controla a cor de fundo do cenário, branco nesse caso
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(WIDTH, HEIGHT);
    renderer.autoClear = false;

    renderer.gammaInput = true;
    renderer.gammaOutput = false;

    //PARA AS sombras(PARAR AQUI SE VOLTAR)
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;// para fazer antialiasing das sombras
    //

    composer = new THREE.EffectComposer( renderer );//Criação de um composer para adicionar diferentes tipos de filtros

    var renderModel = new THREE.RenderPass( scene, camera );

    //////escolha um dos trôes como verdadeiro para definir a renderização da tela
    var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
    effectCopy.renderToScreen = true;//o resultado vai sair como deveria usando esse

    var effectFilm = new THREE.FilmPass(0.35, 0.95, 2048, false );
    effectFilm.renderToScreen = false;//controla um efeito de filme na renderização da tela.

    var gammaCorrectionPass = new THREE.ShaderPass( THREE.GammaCorrectionShader );
    gammaCorrectionPass.renderToScreen = false;//controla um efeito de correção de gamma na renderização da tela
    ////////

    ///adicionar os filtros ao composer que vai ser renderizado
    composer.addPass( renderModel );
    composer.addPass( BloomAtivar );
    composer.addPass(effectCopy);
    composer.addPass(effectFilm );
    composer.addPass(gammaCorrectionPass);
    ////

}

//PARA CRIAR MODELOS DE NUVENS DO planeta_donut utilizando a função Torus Geometry
function nuvemModelo(obj,color,opacity,blending,transparent,depthTest,radiusTorus,tubeTorus){
    var textureLoader = new THREE.TextureLoader();
    var earthCloudsMat = new THREE.MeshLambertMaterial( {
      color: color,
      opacity: opacity,
      blending: blending,
      transparent: transparent,
      depthWrite: depthTest
    } );

    var earthClouds = textureLoader.load( 'textures/planeta_donut/2_clouds_2480x1200.png', function( tex ) {
      earthCloudsMat.map = tex;
      earthCloudsMat.needsUpdate = true;
    } );

    //use (15.5,7.5,30,30) para uma nuvem que cobre completamente o planeta donut
    var sphereCloudsMesh = new THREE.Mesh( new THREE.TorusGeometry( radiusTorus, tubeTorus, 50, 50 ), earthCloudsMat );
    //sphereCloudsMesh.position.x = object.position.x + 6;
    //sphereCloudsMesh.position.y = object.position.y + 10;

    sphereCloudsMesh.position.z = obj.position.z;
    sphereCloudsMesh.rotation.x = 1.57079;
    sphereCloudsMesh.rotation.y = 0;
    sphereCloudsMesh.rotation.z = 0;

    return sphereCloudsMesh;

}
//
var planeta = new THREE.Mesh();
function initModel() {

      //controle de erros
      var manager = new THREE.LoadingManager();
      manager.onProgress = function ( item, loaded, total ) {

        console.log( item, loaded, total );

      };
      var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
          var percentComplete = xhr.loaded / xhr.total * 100;
          console.log( Math.round(percentComplete, 2) + '% downloaded' );
        }
      };
      var onError = function ( xhr ) {
      };
      //

    //variaveis para texturas
    var texture = new THREE.Texture();
    var texture_s = new THREE.Texture();
    var texture_b = new THREE.Texture();
    //texura do planeta
      var loader = new THREE.ImageLoader( manager );
      loader.load( 'textures/planeta_donut/2_no_clouds_2480x1200.jpg', function ( image ) {
        texture.image = image;
        texture.needsUpdate = true;
      } );
    //textura para diferentes niveis de brilho no planeta
    var loader_s = new THREE.ImageLoader( manager );
    loader_s.load( 'textures/planeta_donut/2_no_clouds_2480x1200_specular.jpg', function ( image ) {
      texture_s.image = image;
      texture_s.needsUpdate = true;
    } );
    //textura para nivelamento de terreno por sombras
    var loader_b = new THREE.ImageLoader( manager );
    loader_b.load( 'textures/planeta_donut/2_no_clouds_2480x1200_bump.jpg', function ( image ) {
      texture_b.image = image;
      texture_b.needsUpdate = true;
    } );
    //

      // modelo do planeta donut
      var loader = new THREE.OBJLoader( manager );
      loader.load( 'planeta_donut.obj', function ( object ) {
        object.traverse( function ( child ) {
          if ( child instanceof THREE.Mesh ) {

            child.material.map = texture;
            child.castShadow = true;
            child.receiveShadow = true; //PARA FAZER SOMBRAS APARECEREM NO OBJETO
            child.material.specularMap = texture_s;//controla reflexão especular
            child.material.bumpMap = texture_b;//controla a altura das superficies atraves de sombras
            child.material.shining = 200;//o brilho do planeta quando sobre a luz
            child.material.bumpScale = 0.85;//mudar o quanto o mapa de Bump afeta a luz no planeta donut
          }
          planeta.material = child.material;
          planeta.geometry = child.geometry;
          planeta.needsUpdate = true;
        } );
      }, onProgress, onError );
      planeta.scale.x = planeta.scale.y = planeta.scale.z = 18;//aumentar ou diminuir o modelo do planeta_donut
      planeta.position.y = 0;//coloca modelo do planeta na posição Zero
      planeta.castShadow = true;
      planeta.receiveShadow = true;
      ///NUVENS
      var NuvemsModelo1 = nuvemModelo(planeta,0xffffff,1,THREE.NormalBlending,true,false,15.5,7.1);
      group.add( NuvemsModelo1 );
      //nuvemModelo(obj,color,opacity,blending,transparent,depthTest,radiusTorus,tubeTorus)
      //para dois meshs de nuvems que ficam perfeitos com o planeta
      /*
      var sphereCloudsMesh1 = new THREE.Mesh( new THREE.TorusGeometry( 18, 5, 30, 30 ), earthCloudsMat );
      var sphereCloudsMesh2 = new THREE.Mesh( new THREE.TorusGeometry( 14, 5, 30, 30 ), earthCloudsMat );
      */
      //

      /////ATMOSFERA
      var atmoShader = {
        side: THREE.BackSide,
        // blending: THREE.AdditiveBlending,
        transparent: true,
        lights: true,
        uniforms: THREE.UniformsUtils.merge( [

          THREE.UniformsLib[ "common" ],
          THREE.UniformsLib[ "lights" ]

        ] ),
        vertexShader: [
          "varying vec3 vViewPosition;",
          "varying vec3 vNormal;",
          "void main() {",
            THREE.ShaderChunk[ "beginnormal_vertex" ],
            THREE.ShaderChunk[ "defaultnormal_vertex" ],

            "	vNormal = normalize( transformedNormal );",
            "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
            "vViewPosition = -mvPosition.xyz;",
            "gl_Position = projectionMatrix * mvPosition;",
          "}"

        ].join("\n"),

        fragmentShader: [

          THREE.ShaderChunk[ "common" ],
          THREE.ShaderChunk[ "bsdfs" ],
          THREE.ShaderChunk[ "lights_pars" ],
          THREE.ShaderChunk[ "lights_phong_pars_fragment" ],

          "void main() {",
            "vec3 normal = normalize( -vNormal );",
            "vec3 viewPosition = normalize( vViewPosition );",
            "#if NUM_DIR_LIGHTS > 0",

              "vec3 dirDiffuse = vec3( 0.0 );",

              "for( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {",

                "vec4 lDirection = viewMatrix * vec4( directionalLights[i].direction, 0.0 );",
                "vec3 dirVector = normalize( lDirection.xyz );",
                "float dotProduct = dot( viewPosition, dirVector );",
                "dotProduct = 1.0 * max( dotProduct, 0.0 ) + (1.0 - max( -dot( normal, dirVector ), 0.0 ));",
                "dotProduct *= dotProduct;",
                "dirDiffuse += max( 0.5 * dotProduct, 0.0 ) * directionalLights[i].color;",
              "}",
            "#endif",

            //Fade out atmosphere at edge
            "float viewDot = abs(dot( normal, viewPosition ));",
            "viewDot = clamp( pow( viewDot + 0.6, 10.0 ), 0.0, 1.0);",

            "vec3 colour = vec3( 0.05, 0.09, 0.13 ) * dirDiffuse;",
            "gl_FragColor = vec4( colour, viewDot );",

          "}"

        ].join("\n"),
      };
      var earthAtmoMat = new THREE.ShaderMaterial( atmoShader );
      var sphereAtmoMesh = new THREE.Mesh( new THREE.TorusGeometry( 15.5, 7, 50, 50 ), earthAtmoMat );
      sphereAtmoMesh.position.z = planeta.position.z;
      sphereAtmoMesh.rotation.x = 1.57079;
      sphereAtmoMesh.rotation.y = 0;
      sphereAtmoMesh.rotation.z = 0;

      ///mudar a escala da atmosfera para ficar mais alinhada com o planeta, o mesmo pode ser feito com as nuvens tambem
      sphereAtmoMesh.scale.x = 1.05;
      sphereAtmoMesh.scale.y = 1.05;
      sphereAtmoMesh.scale.z = 0.85;
      ///sphereAtmoMesh.scale.set(1.05,1.05,0.85);
      ///
      group.add( sphereAtmoMesh );
      ///////

      //Arrumar a posição do planeta para ficar no centro do eixo y
      planeta.position.x = NuvemsModelo1.position.x - 6;
      planeta.position.y = NuvemsModelo1.position.y - 10;
      //

      group.add( planeta );

      ///PARA FAZER UMA lua
      radius = 15.5*0.18;
      var loader_lua = new THREE.TextureLoader();
      var LuaTextura = loader_lua.load( "textures/planeta_donut/moon_1024.jpg" );
      var materialLua = new THREE.MeshPhongMaterial( { color: 0xffffff, map: LuaTextura } );
      var geometria_lua = new THREE.SphereGeometry( radius, 100, 50 );

      meshLua = new THREE.Mesh( geometria_lua, materialLua );
      //meshLua.position.set( radius * 5, 0, 0 );
      //meshLua.scale.set( moonScale, moonScale, moonScale );
      //meshLua.position.y = 27;
      meshLua.receiveShadow = true;
      meshLua.castShadow = true;//para as sombras da lua
      group2.add( meshLua );
      scene.add(group2);
      ///

    //concentrar a animação no centro
      var geometry = new THREE.Geometry();
      group.translate = geometry.center(NuvemsModelo1);
    //

      scene.add( group );


    //PARA O SOL 1 e o SOL 2
    Sun1 = SunModel(1);
    Sun2 = SunModel(2);
    scene.add(Sun1);
    scene.add(Sun2);
    //
}

function render() {
    //TWEEN.update();

    requestAnimationFrame(render);
    //para mover as luzes solares
    luz1.position.set( params.DistanceSuns/2, 0, 0 );
    luz2.position.set( -params.DistanceSuns/2, 0, 0 );
    //
    //para mostrar mudanças na camera
//    if ( Luz1Camera ) Luz1Camera.update();
//    if ( Luz2Camera ) Luz2Camera.update();
    //

    //Para os Efeitos do menu
    BloomAtivar.copyUniforms[ "opacity" ].value = params.Bloom;//de Bloom
    luz1.intensity = params.IntensityLight;
    luz2.intensity = params.IntensityLight;
    //

    camera.lookAt( scene.position );

    //para posicao da lua e dos sois
    group2.position.y = params.DistanceMoon;
    Sun1.position.x = params.DistanceSuns/2;
    Sun2.position.x = -params.DistanceSuns/2;
    //

    //Para a rotação do planeta_donut
    group.rotateY (params.RotationEarth);//valor 0.007 é uma escala apenas para visualização
    group2.rotateY(params.RotationMoon);
    //group2.rotateY(0.007);//e da lua, teoricamente seria 0.00008, mas esse valor nao gera rotação então será ignorado
    //Para a rotação de cada Sol
    var delta = 5 * clock.getDelta();
    Sun1.rotateY(params.RotationSol1);//na minha teoria seria rotação Y de 0.028 para 0.007 do planeta toroide
    Sun2.rotateY(params.RotationSol2);
    movSun.time.value += 0.2 * delta;//move a superficie de cada sol
    //

    //Make the planeta donut se mover em uma trajetória Lemniscate, para percorrer os dois sois
    //faz a lua orbitar o planeta tambem

    if(params.OrbitPlanet){
    t += params.VelocPlanet*0.005;//1000 para vezes esse t
    var a = (params.DistanceSuns)+400;
    var b = Math.cos(t);
    var c = Math.sin(t);
    NewX = (a*b)/(1+(c)*(c));
    NewY = (a*c*b)/(1+(c*c));
    group.position.x = NewX;
    group.position.z = NewY;
    group2.position.x = NewX;//para a lua se mover junto com o planeta
    group2.position.z = NewY;//para a lua se mover junto com o planeta
    }

    if(params.OrbitMoon){
    t2 += params.VelocMoon*0.005;
    group2.position.y = 27*Math.sin(t2);///100 para vezes esse t seria o natural
    }
    //

    renderer.clear();
    composer.render( delta );
}

function initLights(){
    //var light = new THREE.AmbientLight(0xffffff);
    //scene.add(light);


  //Usando directionalLight
  //luz do primeiro sol

  var directionalLight = new THREE.DirectionalLight( 0xffeedd,params.IntensityLight );//(hex controla a cor, e esse controla a intensidade)
  directionalLight.position.set( params.DistanceSuns/2, 0, 0 );//manda luz de uma direção especifica para todos os angulos, como um objeto distante de luz faria
  directionalLight.castShadow = true;//aviso, o uso dessas sombras vai gerar warnings no console do navegador do firefox
  //directionalLight.shadowDarkness = 0.5;
  //directionalLight.shadowCameraVisible = true; NÃO FUNCIONA MAIS, OBSOLETO
//  var helper = new THREE.CameraHelper( directionalLight.shadow.camera );
//  scene.add( helper ); Para ver as cameras das sombras
  //

  directionalLight.shadow.mapSize.width = WIDTH;
  directionalLight.shadow.mapSize.height = HEIGHT;
  //controlar o tamanho das luzes
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  //controlar o tamanho das luzes

  directionalLight.target = group;//para mirar no movimento do planeta


  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = (params.DistanceSuns)+400;

  //luz do segundo sol
  var directionalLight2 = new THREE.DirectionalLight( 0xffeedd,params.IntensityLight );
  directionalLight2.castShadow = true;
  directionalLight2.position.set( -params.DistanceSuns/2, 0, 0 );
  //directionalLight2.shadowDarkness = 0.5;
  //directionalLight2.shadowCameraVisible = true; CAMERA DE SOMBRAS
//  var helper2 = new THREE.CameraHelper( directionalLight2.shadow.camera );
  //scene.add( helper2 );Para ver as cameras das sombras
  //
  directionalLight2.shadow.mapSize.width = WIDTH;
  directionalLight2.shadow.mapSize.height = HEIGHT;

  directionalLight2.target = group;//para mirar no movimento do planeta

  directionalLight2.shadow.camera.near = 1;
  directionalLight2.shadow.camera.far = (params.DistanceSuns)+400;
  //controlar o tamanho das luzes
  directionalLight2.shadow.camera.left = -30;
  directionalLight2.shadow.camera.right = 30;
  directionalLight2.shadow.camera.top = 30;
  directionalLight2.shadow.camera.bottom = -30;
  //controlar o tamanho das luzes

  luz1 = directionalLight;
  luz2 = directionalLight2;

//  Luz1Camera = helper;
//  Luz2Camera = helper2;
  //


  /*
  //usando PointLights(esse nao coloquei sombras, iam ser muito custosas ao computador)
  //luz do primeiro sol
  var Sunlight = new THREE.PointLight( 0xffeedd, 3.5, 1000 );//(cor, intensidade, distância máxima de alcance da luz)
  Sunlight.position.set( 700, 0, 0 );
  scene.add( Sunlight );
  //luz do segundo sol
  var Sunlight = new THREE.PointLight( 0xffeedd, 3.5, 1000 );//(cor, intensidade, distância máxima de alcance da luz)
  Sunlight.position.set( -700, 0, 0 );
  scene.add( Sunlight );
  */

  //usando SpotLights(sombras muito custosas para o computador, fica muito lento)
  /*
  //luz do primeiro sol
  var sunLight = new THREE.SpotLight( 0xffeedd,10,2000);
  sunLight.position.set( params.DistanceSuns/2, 0, 0 );
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = WIDTH;
  sunLight.shadow.mapSize.height = HEIGHT;
  var helper = new THREE.CameraHelper( sunLight.shadow.camera );
  scene.add( helper );
  sunLight.target = group;
  scene.add(sunLight.target);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 2000;
  //sunLight.angle = Math.PI/2 - 0.1;
  //sunLight.penumbra = 0;
  //luz do segundo sol
  var sunLight2 = new THREE.SpotLight( 0xffeedd,10,2000);
  sunLight2.position.set( -params.DistanceSuns/2, 0, 0 );
  sunLight2.castShadow = true;
  sunLight2.shadow.mapSize.width = WIDTH;
  sunLight2.shadow.mapSize.height = HEIGHT;
  var helper2 = new THREE.CameraHelper( sunLight2.shadow.camera );
  scene.add( helper2 );
  sunLight2.target = group;
  scene.add(sunLight2.target);
  sunLight2.shadow.camera.near = 1;
  sunLight2.shadow.camera.far = 2000;
  //sunLight2.angle = Math.PI/2 - 0.1;
  //sunLight2.penumbra = 0;


  luz1 = sunLight;
  luz2 = sunLight2;
  */

  scene.add( luz1 );
  scene.add( luz2 );
}


init();
render();
