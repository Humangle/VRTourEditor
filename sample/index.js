import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

let ready = false;

let main = async (view) => {
	
	//set up the canvas for THREE.js
	const canvas = document.getElementById("c");
	const renderer = new THREE.WebGLRenderer({canvas, alpha: true, premultipliedAlpha: false, precision: 'lowp', powerPreference: 'low-power'});
	renderer.setPixelRatio(1.0);
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.xr.enabled = true;
	renderer.xr.setReferenceSpaceType('local');
	renderer.xr.setFoveation(1.0);
	console.log("WebGL2Renderer: " + renderer.capabilities.isWebGL2);
	
	//set the camera up
	const fov = 60;
	const aspect = canvas.clientWidth/canvas.clientHeight;
	const near = 0.1;
	const far = 128;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(0, 1.6, 0);
	
	//orbital camera controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 1.6, 0);
	controls.rotateSpeed *= -0.4;
	controls.autoRotate = false;
	controls.enableDamping = false;
	controls.enableZoom = false;
	controls.maxPolarAngle = Math.PI-1;
	controls.minPolarAngle = 1;
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
	const loadingElem = document.querySelector('#loading');
	const progressBarElem = loadingElem.querySelector('.progressbar');
	const loadManager = new THREE.LoadingManager();
	const loader = new THREE.TextureLoader(loadManager);
	
	const sphereTexture = await loader.loadAsync("./no-image.jpg");
	sphereTexture.colorSpace = THREE.SRGBColorSpace;
	
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
				const sphereTextureX = await loader.loadAsync(view[b].img);
				sphereTextureX.colorSpace = THREE.SRGBColorSpace;
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
	if (links.header?.pan > 0){
		sphereMesh.rotation.y = (links.header.pan/180)*Math.PI;
		pickableObjs.rotation.y = (links.header.pan/180)*Math.PI;
	}
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
	
	//touchscreen raycaster
	class ThumbPickHelper extends THREE.EventDispatcher {
		constructor(scene) {
			super();
			this.raycaster = new THREE.Raycaster();
			this.selectedObject = new THREE.Object3D();
			this.pointer = new THREE.Vector2();
			
			const onTouchStart = (event) => {
				
				//document.getElementById("c").style.cursor = "grab";
			}
			
			const onTouchEnd = (event) => {
				
				//objects intersecting the Touchscreen Raycaster
				const intersections = this.raycaster.intersectObjects(pickableObjs.children);
				
				for ( let i = 0; i < intersections.length; i++ ) {
					console.log("touch intersection with: " + intersections[i].object.name);
					if (intersections[i].object.name != "sphere"){
						document.getElementById("c").style.cursor = "pointer";
						this.selectedObject = intersections[i].object;
						intersections[i].object.material.opacity = 1;
						teleport(intersections[i].object.name);
					}
				}
				if ((intersections.length == 0) && (document.getElementById("c").style.cursor == "pointer")){
					document.getElementById("c").style.cursor = "grab";
				}
			}
			
			window.addEventListener('touchend', onTouchEnd);
			//window.addEventListener('touchstart', onTouchStart);
		}
		reset(){
			this.selectedObject = new THREE.Object3D;
		}
		update(pickablesParent, time){
			this.reset();
   
			this.raycaster.setFromCamera(this.pointer, camera);
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
				
				document.getElementById("c").style.cursor = "grab";
			}
			
			const onPointerDown = (event) => {
				if (this.selectedObject.name != "") { 
					this.dispatchEvent({type: event.type, object: this.selectedObject});
				}
				document.getElementById("c").style.cursor = "grabbing";
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
					document.getElementById("c").style.cursor = "pointer";
					this.selectedObject = intersections[i].object;
					intersections[i].object.material.opacity = 1;
				}
			}
			if ((intersections.length == 0) && (document.getElementById("c").style.cursor == "pointer")){
				document.getElementById("c").style.cursor = "grab";
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
	
	//On Screen Tap
	const ScreenPicker = new ThumbPickHelper(scene);
	ScreenPicker.addEventListener('touchend'), (event) => {
		//switch to the view of the button selected
		if (event.object.name && event.object.visible){
			teleport(event.object.name);
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
		if (event.object.name && event.object.visible){
			teleport(event.object.name);
		}
	});
	
	const onPointerMove = (event) => {
		//calculate pointer position in normalized device coordinates
		//(-1 to +1) for both components
		DesktopPicker.pointer.x = (event.clientX/canvas.clientWidth) * 2 - 1;
		DesktopPicker.pointer.y = - (event.clientY/canvas.clientHeight) * 2 + 1;
	}
	
	const onTouchMove = (event) => {
		event = event.touches?.[0] || event; 
		const rect = renderer.domElement.getBoundingClientRect();
		ScreenPicker.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		ScreenPicker.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
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
			
			//update the desktop raycaster and calculate the objects intersecting it
			ScreenPicker.update(pickableObjs, time);
		}
		
		if (renderer.xr.isPresenting){
			if (camera.fov != 45){
				camera.fov = 45;
				camera.updateProjectionMatrix();
			}
		} else {
			if (window.innerHeight > window.innerWidth+(window.innerWidth/2)) {
				if (camera.fov != 90){
					camera.fov = 90;
					camera.updateProjectionMatrix();
				}
			} else {
				if (camera.fov != 60){
					camera.fov = 60;
					camera.updateProjectionMatrix();
				}
			}
		}
		
		renderer.render(scene, camera);
		
	}
	
	renderer.setAnimationLoop(render);
	window.addEventListener('pointermove', onPointerMove);
	window.addEventListener('touchstart', onTouchMove);
	window.addEventListener('resize', onWindowResize);
	teleport(links.header.index); //teleport to the root
}

document.getElementById('launchFS').addEventListener('click', (event) => {
    var cel = document.getElementById('c');

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

document.getElementById('c').addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    // Exited fullscreen — reset canvas size
    const canvas = document.getElementById('c');
    if (canvas) {
		// You can restore to original dimensions or make it responsive
		canvas.style.width = '100vw';
		canvas.style.height = '100vh';
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.fov = 60;
		camera.updateProjectionMatrix();
    }
  }
});

const createXR = (renderer, sessionInit = {}) => {

	if ('xr' in navigator) {
		navigator.xr.isSessionSupported('immersive-ar').then(function(supported) {
			if (supported) {
				
				let currentSession = null;
				document.getElementById('launchVR').style.display = "block";
				async function onSessionStarted( session ) {
					session.addEventListener( 'end', onSessionEnded );
					renderer.xr.setReferenceSpaceType( 'local' );
					await renderer.xr.setSession( session );
					document.getElementById('launchVR').style.display = "none";
					currentSession = session;
				}
					
				function onSessionEnded( /*event*/ ) {
					currentSession.removeEventListener( 'end', onSessionEnded );
					document.getElementById('launchVR').style.display = "block";
					currentSession = null;
				}

				document.getElementById('launchVR').addEventListener('click', (event) => {
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
				document.getElementById('launchVR').style.display = "none";
				console.log("XR NOT SUPPORTED");
			}
		}).catch((err) => {
			document.getElementById('launchVR').style.display = "none";
			alert("XR NOT ALLOWED: " + err);
		});
	} else {
		if ( window.isSecureContext === false ) {
			alert("WEBXR NEEDS HTTPS");
		} else {
			alert("WEBXR NOT AVAILABLE");
		}
	}
}


let links;
fetch('./HumAngle VR Tour.hvrj').then(response => response.json()).then(hvrj => {
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
			version = links.full;//this was links.lite if the quality is better in VR set it back and look for a better way to check if mobile
		}
		main(version);
	});
});
