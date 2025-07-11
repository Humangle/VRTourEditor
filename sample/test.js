import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {VRButton} from 'three/addons/webxr/VRButton.js';

let ready = false;
let applelog = "ready just set to false";

let main = (view) => {
	
	applelog += "\n inside main function";
	//set up the canvas for THREE.js
	const canvas = document.getElementById("c");
	
	//set the camera up
	const fov = 45;
	const aspect = window.innerWidth/window.innerHeight;
	const near = 0.1;
	const far = 128;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(0, 1.6, 0);
	
	//orbital camera controls
	const controls = new OrbitControls(camera, canvas);
	controls.rotateSpeed *= -0.2;
	controls.autoRotate = false;
	controls.enableDamping = false;
	controls.enableZoom = false;
	controls.maxPolarAngle = 2;
	controls.minPolarAngle = 0.86;
	controls.update();
	
	applelog += "\n camera controls done, scene next";
	
	//here we go!
	const scene = new THREE.Scene();
	
	const pickableObjs = new THREE.Object3D();
	let viewTextures = {};
	
	//setting the view
	let newView;
	
	//button template
	const makeButton = (buttonName) => {
		//button linking to PIC
		const buttonMaterial = new THREE.MeshPhongMaterial({emissive: 0xFFFFFF, opacity: 0.4, transparent: true});
		const buttonGeometry = new THREE.SphereGeometry(2, 64, 16);
		const buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
		buttonMesh.name = buttonName;
		applelog += "\n made a button";
		return buttonMesh;
	}
	
	//make buttons for each view with button template
	for (const a in view){
		pickableObjs.add(makeButton(a));
	}
	
	scene.add(pickableObjs);
	
	applelog += "\n pickableObjs added";
	
	//THE SPHERE
	const radius = 100;
	const widthSegments = 64;
	const heightSegments = 32;
	const sphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
	sphereGeometry.scale(-1, 1, 1);
	
	applelog += "\n sphere settings";
	
	//loading textures
	const loadingElem = document.querySelector('#loading');
	const progressBarElem = loadingElem.querySelector('.progressbar');
	const loadManager = new THREE.LoadingManager();
	const loader = new THREE.TextureLoader(loadManager);
	//loader.setOptions( { imageOrientation: 'flipY' } );
	
	applelog += "\n loadmanager loader";
	
	const sphereTexture = loader.load("./no-image.jpg");
	//const sphereTexture = new THREE.CanvasTexture(sT);
	sphereTexture.colorSpace = THREE.SRGBColorSpace;
	//sphereTexture.flipY = false;
	
	applelog += "\n noimage loaded?";
	
	const sphereMaterial = new THREE.MeshBasicMaterial({map: sphereTexture});
	sphereMaterial.needsUpdate = true;
	let sphereMesh;
	//renderer.initTexture(sphereTexture);
	
	//load textures for links in a view
	const loadTextures = (viewname) => {
		applelog += "\n inside loadTextures";
		document.body.style.cursor = "wait";
		if (viewTextures[viewname] != undefined){
			sphereMaterial.map = viewTextures[viewname];
			sphereMaterial.needsUpdate = true;
			console.log("already in memory: using that to save resources");
			applelog += "\n already in memory: using that to save resources";
		}
		for (const b in view[viewname]){
			if (b!="img" && viewTextures[b] == undefined){
				const sphereTextureX = loader.load(view[b].img);
				//const sphereTextureX = new THREE.CanvasTexture(sTX);
				sphereTextureX.colorSpace = THREE.SRGBColorSpace;
				//sphereTextureX.flipY = false;
				viewTextures[b] = sphereTextureX;
				//renderer.initTexture(viewTextures[b]);
				applelog += "\n texture loaded:" + b + ", link: " + viewTextures[b];
				if (b == viewname && viewTextures[b] != undefined){
					sphereMaterial.map = viewTextures[b];
					sphereMaterial.needsUpdate = true;
					applelog += "\n texture used as spherical map";
				}
			}
		}
	}
	
	loadingElem.style.display = 'none';
	sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
	sphereMesh.name = "sphere";
	sphereMesh.position.set(0,1.6,0);
	scene.add(sphereMesh);
	
	const renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	canvas.appendChild(renderer.domElement);
	console.log("WebGL2Renderer: " + renderer.capabilities.isWebGL2);
	applelog += "\n renderer set";
	
	ready = true;
	
	applelog += "\n sphere added";
	
	loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
		const progress = itemsLoaded / itemsTotal;
		applelog += "\n load progress: "+progress; 
		progressBarElem.style.transform = `scaleX(${progress})`;
	};
	
	loadManager.onLoad = () => {
		document.body.style.cursor = "auto";
		applelog += "\n loadmanager onload"; 
	}
	
	document.body.appendChild(VRButton.createButton(renderer, {
		requiredFeatures: ['local'],
		optionalFeatures: ['light-estimation']
	}));
	
	applelog += "\n defining teleport";
	//switch to the view of the button selected
	const teleport = (viewname) => {
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
				if (this.selectedObject) { 
					this.dispatchEvent({type: event.type, object: this.selectedObject});
				}
				document.getElementById("c").style.cursor = "grab";
			}
			
			const onPointerDown = (event) => {
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
	
	//On Desktop click
	const DesktopPicker = new MousePickHelper(scene);
	DesktopPicker.addEventListener('pointerup', (event) => {
		//switch to the view of the button selected
		teleport(event.object.name);
	});
	
	//On VR click
	const VRPicker = new ControllerPickHelper(scene);
	VRPicker.addEventListener('select', (event) => {
		//switch to the view of the button selected
		teleport(event.object.name);
	});
	
	const onPointerMove = (event) => {
		//calculate pointer position in normalized device coordinates
		//(-1 to +1) for both components
		DesktopPicker.pointer.x = (event.clientX/canvas.clientWidth) * 2 - 1;
		DesktopPicker.pointer.y = - (event.clientY/canvas.clientHeight) * 2 + 1;
	}
	
	const onWindowResize = () => {
		camera.aspect = window.innerWidth/window.innerHeight;
		camera.updateProjectionMatrix();
		
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	}
	
	let render = (time) => {
		time *= 0.001; //milliseconds to seconds
		
		if (ready){
			for (const d in pickableObjs.children){
				let btnMesh = pickableObjs.children[d];
				btnMesh.material.opacity = 0.4;
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
				if (camera.fov != 90){
					camera.fov = 90;
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

applelog+= "\n main has been defined";

//texture view/link properties
const links = {
	"header": {
		"version": 0.2,
		"stereo": false,
		"index": "PIC_1"
	},
	"lite": {
		"PIC_1": {
			"img": "https://raw.githubusercontent.com/Humangle/VRTourEditor/refs/heads/main/assets/legacy/PIC_1-ity.jpg",
			"PIC_1": {"s": 0, "x": 0, "y": -1.6, "z": 0},
			"PIC_2": {"s": 4, "x": 16.55099055399931, "y": -74.61338152995376, "z": 47.527970799803576},
			"PIC_3": {"s": 2, "x": -7.500365624785212, "y": -44.45476799258078, "z": 77.894275259613}
		},
		"PIC_2": {
			"img": "../assets/legacy/PIC_2-ity.jpg",
			"PIC_1": {"s": 4, "x": -3.337599303613126, "y": -72.62642809294218, "z": -53.04962180213184},
			"PIC_2": {"s": 0, "x": 0, "y": -1.6, "z": 0},
			"PIC_3": {"s": 4, "x": -38.36253246210393, "y": -60.22175457229724, "z": 54.78737426933343}
		},
		"PIC_3": {
			"img": "../assets/legacy/PIC_3-ity.jpg",
			"PIC_1": {"s": 2, "x": -32.01658952848355, "y": -43.63286582217034, "z": -71.91043745597072},
			"PIC_2": {"s": 4, "x": -7.067563684490447, "y": -59.4001501164843, "z": -67.2433766976704},
			"PIC_3": {"s": 0, "x": 0, "y": -1.6, "z": 0}
		}
	},
	"full": {
		"PIC_1": {
			"img": "https://raw.githubusercontent.com/Humangle/VRTourEditor/refs/heads/main/assets/legacy/PIC_1.jpg",
			"PIC_1": {"s": 0, "x": 0, "y": -1.6, "z": 0},
			"PIC_2": {"s": 4, "x": 16.55099055399931, "y": -74.61338152995376, "z": 47.527970799803576},
			"PIC_3": {"s": 2, "x": -7.500365624785212, "y": -44.45476799258078, "z": 77.894275259613}
		},
		"PIC_2": {
			"img": "../assets/legacy/PIC_2.jpg",
			"PIC_1": {"s": 4, "x": -3.337599303613126, "y": -72.62642809294218, "z": -53.04962180213184},
			"PIC_2": {"s": 0, "x": 0, "y": -1.6, "z": 0},
			"PIC_3": {"s": 4, "x": -38.36253246210393, "y": -60.22175457229724, "z": 54.78737426933343}
		},
		"PIC_3": {
			"img": "../assets/legacy/PIC_3.jpg",
			"PIC_1": {"s": 2, "x": -32.01658952848355, "y": -43.63286582217034, "z": -71.91043745597072},
			"PIC_2": {"s": 4, "x": -7.067563684490447, "y": -59.4001501164843, "z": -67.2433766976704},
			"PIC_3": {"s": 0, "x": 0, "y": -1.6, "z": 0}
		}
	}
};

applelog+= "\n links have been defined";

let version = links.full;

applelog += "\n version set to links.full" + links.full;

navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
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

applelog += "\n setTimeout is being set next";

setTimeout(()=>{
	const link = document.createElement("a");
	const file = new Blob([applelog], { type: 'text/plain' });
	link.href = URL.createObjectURL(file);
	link.download = "hvrapplelog_"+Date.now()+".txt";
	link.click();
	URL.revokeObjectURL(link.href);
}, "20000");