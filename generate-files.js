const GenerateFiles = (links) => {
	const html = `<!DOCTYPE html>
<html>
	<head>
		<script  type="importmap">
			{
				"imports": {
					"three": "https://threejs.org/build/three.module.js",
					"three/addons/" : "https://threejs.org/examples/jsm/"
				}
			}
		</script>
		<script type="module" src="./index.js"></script>
		<link rel="stylesheet" href="./main.css" />
		<meta charset="utf-8" />
		<meta name="keywords" content="${links.header.project}, VR, Tour, 360, HumAngle VR Tour Editor" />
		<meta
			name="viewport"
			content="width=device-width, initial-scale=1, shrink-to-fit=no"
		/>

		<meta property="og:title" content="${links.header.project}" />
		<meta property="og:type" content="website" />
		<meta
			property="og:description"
			content="${links.header.project}, created with HumAngle VR Tour Editor"
		/>
		<meta
			property="og:image"
			content="${links.header.image}"
		/>
		<meta property="og:url" content="https://humangle.github.io/VRTourEditor/sample" />
		<meta name="twitter:card" content="summary_large_image" />
		<title>${links.header.project}</title>
		<link rel="icon" href="${links.header.icon}" sizes="32x32">
		<link rel="icon" href="${links.header.icon}" sizes="32x32">
	</head>
	<body>
		<div id="loading_${links.header.project.replaceAll(" ","_")}">
			<div class="progress"><img src="https://humanglemedia.com/wp-content/uploads/2020/03/cropped-android-chrome-512x512-1-32x32.png"/><div class="progressbar"></div></div>
		</div>
		<canvas id="c_${links.header.project.replaceAll(" ","_")}">
		</canvas>
		<div id="launchVR_${links.header.project.replaceAll(" ","_")}">
			<svg xmlns="http://www.w3.org/2000/svg" width="3vh" height="3vh" fill="currentColor" class="bi bi-headset-vr" viewBox="0 0 16 16">
				<path d="M12 12a4 4 0 0 1-2.786-1.13l-.002-.002a1.6 1.6 0 0 0-.276-.167A2.2 2.2 0 0 0 8 10.5c-.414 0-.729.103-.935.201a1.6 1.6 0 0 0-.277.167l-.002.002A4 4 0 1 1 4 4h8a4 4 0 0 1 0 8"/>
			</svg>
		</div>
		<div id="launchFS_${links.header.project.replaceAll(" ","_")}">
			<svg xmlns="http://www.w3.org/2000/svg" width="3vh" height="3vh" fill="currentColor" class="bi bi-fullscreen" viewBox="0 0 16 16">
				<path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5"/>
			</svg>
		</div>
	</body>
</html>`;
	
	const js = `import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

let ready = false;

let main = async (view) => {
	
	//set up the canvas for THREE.js
	const canvas = document.getElementById("c_${links.header.project.replaceAll(" ","_")}");
	const renderer = new THREE.WebGLRenderer({canvas, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance'});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.xr.enabled = true;
	renderer.xr.setReferenceSpaceType('local');
	renderer.xr.setFoveation(1.0);
	
	//set the camera up
	const fov = 45;
	const aspect = canvas.clientWidth/canvas.clientHeight;
	const near = 0.1;
	const far = 128;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(0, 1.6, 0);
	
	//orbital camera controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.rotateSpeed *= -0.4;
	controls.autoRotate = false;
	controls.enableDamping = false;
	controls.enableZoom = false;
	controls.maxPolarAngle = 2;
	controls.minPolarAngle = 0.86;
	controls.update();
	
	//here we go!
	const scene = new THREE.Scene();
	
	const pickableObjs = new THREE.Object3D();
	let viewTextures = {};
	
	//setting the view
	let newView;
	
	//button template
	const makeButton = (buttonName) => {
		//button linking to PIC
		const buttonMaterial = new THREE.MeshPhongMaterial({emissive: 0xFFFFFF, opacity: 0.3, transparent: true});
		const buttonGeometry = new THREE.SphereGeometry(2, 64, 16);
		const buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
		buttonMesh.name = buttonName;
		return buttonMesh;
	}
	
	//make buttons for each view with button template
	for (const a in view){
		if (!pickableObjs.getObjectByName(a)) {
			pickableObjs.add(makeButton(a));
		}
	}
	
	scene.add(pickableObjs);
	
	//THE SPHERE
	const radius = 100;
	const widthSegments = 64;
	const heightSegments = 32;
	const sphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
	sphereGeometry.scale(-1, 1, 1);
	
	//loading textures
	const loadingElem = document.querySelector('#loading_${links.header.project.replaceAll(" ","_")}');
	const progressBarElem = loadingElem.querySelector('.progressbar');
	const loadManager = new THREE.LoadingManager();
	const loader = new THREE.ImageBitmapLoader(loadManager);
	loader.setOptions( { imageOrientation: 'flipY' } );
	
	const sT = await loader.loadAsync("./no-image.jpg");
	const sphereTexture = new THREE.CanvasTexture(sT);
	sphereTexture.colorSpace = THREE.SRGBColorSpace;
	sphereTexture.flipY = false;
	
	const sphereMaterial = new THREE.MeshBasicMaterial({side: THREE.FrontSide, color: 0xFFFFFF, map: sphereTexture});
	let sphereMesh;
	renderer.initTexture(sphereTexture);
	
	//load textures for links in a view
	const loadTextures = async (viewname) => {
		document.body.style.cursor = "wait";
		if (viewTextures[viewname] != undefined){
			sphereMaterial.map = viewTextures[viewname];
			console.log("already in memory: using that to save resources");
		}
		for (const b in view[viewname]){
			if (b!="img" && viewTextures[b] == undefined){
				const sTX = await loader.loadAsync(view[b].img);
				const sphereTextureX = new THREE.CanvasTexture(sTX);
				sphereTextureX.colorSpace = THREE.SRGBColorSpace;
				sphereTextureX.flipY = false;
				viewTextures[b] = sphereTextureX;
				renderer.initTexture(viewTextures[b]);
				if (b == viewname && viewTextures[b] != undefined){
					sphereMaterial.map = viewTextures[b];
				}
			}
		}
	}
	
	loadingElem.style.display = 'none';
	sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
	sphereMesh.name = "sphere";
	sphereMesh.position.set(0,1.6,0);
	scene.add(sphereMesh);
	ready = true;
	
	loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
		const progress = itemsLoaded / itemsTotal;
		progressBarElem.style.transform = "scaleX("+progress+")";
	};
	
	loadManager.onLoad = () => {
		document.body.style.cursor = "auto";
	}
	
	//switch to the view of the button selected
	const teleport = async (viewname) => {
		if (view[viewname] != undefined){
			loadTextures(viewname);
			
			newView = view[viewname];
			
			for (const c in pickableObjs.children){
				let btnMesh = pickableObjs.children[c];
				let ln = pickableObjs.children[c].name;
				if (ln!="img" && newView[ln] != undefined && newView[ln].s != 0) {
					console.log(ln + "is a link under " + viewname + " view");
					//viable link
					btnMesh.position.set(newView[ln].x, newView[ln].y, newView[ln].z);
					btnMesh.scale.set(newView[ln].s, newView[ln].s/2, newView[ln].s);
					btnMesh.visible = true;
				} else if (ln!="img" && newView[ln] != undefined && newView[ln].s == 0) {
					//link to self
					btnMesh.position.set(newView[ln].x, newView[ln].y, newView[ln].z);
					btnMesh.scale.set(0, 0, 0);
					btnMesh.visible = false;
				} else if (ln!="img" && newView[ln] == undefined){
					//no link
					btnMesh.position.set(0, -1.6, 0);
					btnMesh.scale.set(0, 0, 0);
					btnMesh.visible = false;
				}
			}
		}
	}
	
	//desktop raycaster
	class MousePickHelper extends THREE.EventDispatcher {
		constructor(scene) {
			super();
			this.raycaster = new THREE.Raycaster();
			this.selectedObject = new THREE.Object3D();
			this.pointer = new THREE.Vector2();
			
			const onPointerUp = (event) => {
				
				document.getElementById("c_${links.header.project.replaceAll(" ","_")}").style.cursor = "grab";
			}
			
			const onPointerDown = (event) => {
				if (this.selectedObject.name != "") { 
					this.dispatchEvent({type: event.type, object: this.selectedObject});
				}
				document.getElementById("c_${links.header.project.replaceAll(" ","_")}").style.cursor = "grabbing";
			}
			
			window.addEventListener('pointerdown', onPointerDown);
			window.addEventListener('pointerup', onPointerUp);
		}
		reset(){
			this.selectedObject = new THREE.Object3D;
		}
		update(pickablesParent, time){
			this.reset();
			
			this.raycaster.setFromCamera(this.pointer, camera);
			
			//objects intersecting the Desktop Raycaster
			const intersections = this.raycaster.intersectObjects(pickablesParent.children);
			
			for ( let i = 0; i < intersections.length; i++ ) {
				if (intersections[i].object.name != "sphere"){
					document.getElementById("c_${links.header.project.replaceAll(" ","_")}").style.cursor = "pointer";
					this.selectedObject = intersections[i].object;
					intersections[i].object.material.opacity = 1;
				}
			}
			if ((intersections.length == 0) && (document.getElementById("c_${links.header.project.replaceAll(" ","_")}").style.cursor == "pointer")){
				document.getElementById("c_${links.header.project.replaceAll(" ","_")}").style.cursor = "grab";
			}
		}
	}
	
	//vr raycaster
	class ControllerPickHelper extends THREE.EventDispatcher {
		constructor(scene) {
			super();
			this.raycaster = new THREE.Raycaster();
			this.controllerToObjectMap = new Map();
			this.tempMatrix = new THREE.Matrix4();
			
			const pointerGeometry = new THREE.BufferGeometry().setFromPoints([
				new THREE.Vector3(0, 0, 0),
				new THREE.Vector3(0, 0, -1),
			]);
			
			this.controllers = [];
			
			const selectListener = (event) => {
				const controller = event.target;
				const selectedObject = this.controllerToObjectMap.get(event.target);
				if (selectedObject) {
					this.dispatchEvent({type: event.type, controller, object: selectedObject});
				}
			};
			
			for ( let i = 0; i < 2; ++ i ) {
				const controller = renderer.xr.getController( i );
				controller.addEventListener('select', selectListener);
				//controller.addEventListener('selectstart', startListener);
				//controller.addEventListener('selectend', endListener);
				scene.add(controller);
				
				const line = new THREE.Line(pointerGeometry);
				line.scale.z = 100;
				controller.add(line);
				this.controllers.push({ controller, line });
				
			}
		}
		reset() {
			this.controllerToObjectMap.clear();
		}
		update(pickablesParent, time) {
			this.reset();
			
			for (const {controller, line} of this.controllers) {
				//cast a ray through the from the controller
				this.tempMatrix.identity().extractRotation(controller.matrixWorld);
				this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
				this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);
				//objects intersecting the VR Raycaster
				const vrintersections = this.raycaster.intersectObjects(pickablesParent.children);
				
				for ( let i = 0; i < vrintersections.length; i++) {
					if (vrintersections[i].object.name != "sphere"){
						this.controllerToObjectMap.set(controller, vrintersections[i].object);
						vrintersections[i].object.material.opacity = 1;
					}
				}
			}
		}
	}
	
	//On Desktop click
	const DesktopPicker = new MousePickHelper(scene);
	DesktopPicker.addEventListener('pointerdown', (event) => {
		//switch to the view of the button selected
		if (event.object.name && event.object.visible){
			teleport(event.object.name);
		}
	});
	
	//On VR click
	const VRPicker = new ControllerPickHelper(scene);
	VRPicker.addEventListener('select', (event) => {
		//switch to the view of the button selected
		if (event.object.name){
			teleport(event.object.name);
		}
	});
	
	const onPointerMove = (event) => {
		//calculate pointer position in normalized device coordinates
		//(-1 to +1) for both components
		DesktopPicker.pointer.x = (event.clientX/canvas.clientWidth) * 2 - 1;
		DesktopPicker.pointer.y = - (event.clientY/canvas.clientHeight) * 2 + 1;
	}
	
	const onWindowResize = () => {
		camera.aspect = canvas.clientWidth/canvas.clientHeight;
		camera.updateProjectionMatrix();
		
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	}
	
	createXR(renderer, {
		requiredFeatures: ['local'],
 		optionalFeatures: ['light-estimation']
	});
	
	let render = (time) => {
		time *= 0.001; //milliseconds to seconds
		
		if (ready){
			for (const d in pickableObjs.children){
				let btnMesh = pickableObjs.children[d];
				btnMesh.material.opacity = 0.3;
			}
			
			//update the vr raycaster and calculate objects intersecting it
			VRPicker.update(pickableObjs, time);
			
			//update the desktop raycaster and calculate the objects intersecting it
			DesktopPicker.update(pickableObjs, time);
		}
		
		if (renderer.xr.isPresenting){
			if (camera.fov != 45){
				camera.fov = 45;
				camera.updateProjectionMatrix();
			}
		} else {
			if (window.innerHeight > window.innerWidth+(window.innerWidth/2)) {
				if (camera.fov != 75){
					camera.fov = 75;
					camera.updateProjectionMatrix();
				}
			} else {
				if (camera.fov != 45){
					camera.fov = 45;
					camera.updateProjectionMatrix();
				}
			}
		}
		
		renderer.render(scene, camera);
		
	}
	
	renderer.setAnimationLoop(render);
	window.addEventListener('pointermove', onPointerMove);
	window.addEventListener('resize', onWindowResize);
	teleport(links.header.index); //teleport to the root
}

document.getElementById('launchFS_${links.header.project.replaceAll(" ","_")}').addEventListener('click', (event) => {
    var cel = document.getElementById('c_${links.header.project.replaceAll(" ","_")}');

    if(cel.requestFullscreen) { /* Chrome */
        cel.requestFullscreen();
    } else if (cel.mozRequestFullScreen) { /* Mozilla */
        cel.mozRequestFullScreen();
    } else if (cel.msRequestFullscreen) { /* IE11 */
		cel.msRequestFullscreen();
	} else if (cel.webkitRequestFullscreen) { /* Safari */
		cel.webkitRequestFullscreen();
	} else {
		cel.exitFullscreen();
	}
});

document.getElementById('c_${links.header.project.replaceAll(" ","_")}').addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    // Exited fullscreen — reset canvas size
    const canvas = document.getElementById('c_${links.header.project.replaceAll(" ","_")}');
    if (canvas) {
      // You can restore to original dimensions or make it responsive
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
    }
  }
});

const createXR = (renderer, sessionInit = {}) => {

	if ('xr' in navigator) {
		navigator.xr.isSessionSupported('immersive-ar').then(function(supported) {
			if (supported) {

				let currentSession = null;
				document.getElementById('launchVR_${links.header.project.replaceAll(" ","_")}').style.display = "block";
				async function onSessionStarted( session ) {
					session.addEventListener( 'end', onSessionEnded );
					renderer.xr.setReferenceSpaceType( 'local' );
					await renderer.xr.setSession( session );
					document.getElementById('launchVR_${links.header.project.replaceAll(" ","_")}').style.display = "none";
					currentSession = session;
				}
					
				function onSessionEnded( /*event*/ ) {
					currentSession.removeEventListener( 'end', onSessionEnded );
					document.getElementById('launchVR_${links.header.project.replaceAll(" ","_")}').style.display = "block";
					currentSession = null;
				}

				document.getElementById('launchVR_${links.header.project.replaceAll(" ","_")}').addEventListener('click', (event) => {
					if (currentSession === null) {
						navigator.xr.requestSession('immersive-ar', sessionInit).then(onSessionStarted);
					} else {
						currentSession.end();
						
						if ( navigator.xr.offerSession !== undefined ) {
							navigator.xr.offerSession('immersive-ar', sessionInit).then(onSessionStarted).catch((err) => {
								console.warn(err);
							} );
						}
					}
				});

				if (navigator.xr.offerSession !== undefined) {
					navigator.xr.offerSession('immersive-ar', sessionInit).then(onSessionStarted).catch((err) => {
						console.warn(err);
					});
				}
				
			} else {
				document.getElementById('launchVR_${links.header.project.replaceAll(" ","_")}').style.display = "none";
				console.log("XR NOT SUPPORTED");
			}
		}).catch((err) => {
			document.getElementById('launchVR_${links.header.project.replaceAll(" ","_")}').style.display = "none";
			console.log("XR NOT ALLOWED: " + err);
		});
	} else {
		if ( window.isSecureContext === false ) {
			console.log("WEBXR NEEDS HTTPS");
		} else {
			console.log("WEBXR NOT AVAILABLE");
		}
	}
}


let links;
fetch('./${links.header.project}.hvrj').then(response => response.json()).then(hvrj => {
	links = hvrj;
	let version = links.full;
	navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
		if (!supported){
			version = links.lite;
		} else {
			version = links.full;
		}
	}).finally(() => {
		if (window.innerHeight > window.innerWidth+(window.innerWidth/2)) {
			version = links.lite;
		}
		main(version);
	});
});
`;
	
	const css = `body {
	margin: 0px;
	background: #000000;
}
#c_${links.header.project.replaceAll(" ","_")} {
	display: block;
	height: 100vh;
	width: 100vw;
	margin: 0px;
	padding: 0px;
	background: none;
}
#loading_${links.header.project.replaceAll(" ","_")} {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
#loading_${links.header.project.replaceAll(" ","_")} .progress {
    margin: 1.5em;
    border: 1px solid white;
	border: none;
	padding-left: 42%;
    width: 50vw;
}
#loading_${links.header.project.replaceAll(" ","_")} .progressbar {
    margin: 2px;
    background: white;
    height: 1em;
    transform-origin: top left;
    transform: scaleX(0);
}
#launchVR_${links.header.project.replaceAll(" ","_")} {
	margin: 0px;
	position: fixed;
	bottom: 0px;
	left: 0px;
	z-index: 999999999;
	background: #00000044;
	color: #FFFFFFBB;
	padding: 1vh;
	border-top-right-radius: 5px;
	cursor: pointer;
	display: none;
}
#launchVR_${links.header.project.replaceAll(" ","_")}:hover {
	background: #00000088;
	color: #FFFFFFFF;
}
#launchFS_${links.header.project.replaceAll(" ","_")} {
	margin: 0px;
	position: fixed;
	bottom: 0px;
	right: 0px;
	z-index: 999999999;
	background: #00000044;
	color: #FFFFFFBB;
	padding: 1vh;
	border-top-left-radius: 5px;
	cursor: pointer;
}
#launchFS_${links.header.project.replaceAll(" ","_")}:hover {
	background: #00000088;
	color: #FFFFFFFF;
}`;
	
	const manifest = `{
  "name": "${links.header.project}",
  "short_name": "${links.header.project}",
  "description": "Created with HumAngle VR Tour Editor",
  "display": "standalone",
  "lang": "en",
  "orientation": "landscape",
  "theme_color": "#22b2d7",
  "background_color": "#FFFFFF",
  "icons": [
	{
		"src": "${links.header.image}",
		"sizes": "512x512",
		"type": "image/png",
		"purpose": "any"
	},
    {
      "src": "${links.header.icon}",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}`;
	
	let template = {
		html,
		js,
		css,
		manifest
	}
	return template;
}