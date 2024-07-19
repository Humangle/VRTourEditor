import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {VRButton} from 'three/addons/webxr/VRButton.js';

let ready = false; //state of the software; do we have all textures/resources ready to render?

let main = async (view) => {
	
	//set up the canvas for THREE.js
	const canvas = document.getElementById("c");
	const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.xr.enabled = true;
	renderer.xr.setReferenceSpaceType('local');
	renderer.xr.setFoveation(1.0);
	document.body.appendChild(VRButton.createButton(renderer));
	
	//set the camera up
	const fov = 45;
	const aspect = canvas.clientWidth/canvas.clientHeight;
	const near = 0.1;
	const far = 128;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(0, 1.6, 0);
	
	//orbital camera controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.minDistance = 0.001;
	controls.maxDistance = 0.001;
	controls.maxPolarAngle = 2;
	controls.minPolarAngle = 0.86;
	controls.update();
	
	//here we go!
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x010101);
	
	const pickableObjs = new THREE.Object3D();
	
	//setting the view
	let newView;
	
	//button linking to PIC_1
	let button1Material = new THREE.MeshPhongMaterial({emissive: 0xFFFFFF, opacity: 0.4, transparent: true});
	const button1Geometry = new THREE.SphereGeometry(1, 64, 16);
	let button1Mesh = new THREE.Mesh(button1Geometry, button1Material);
	button1Mesh.name = "PIC_1";
	pickableObjs.add(button1Mesh);
	
	//position link placer
	let clinkplink = false;
	let plinkplacer = new THREE.Object3D();
	plinkplacer.position.set(0, 1.6, 0);
	scene.add(plinkplacer);
	let gizmoMaterial = new THREE.MeshPhongMaterial({emissive: 0xFFFFFF, opacity:1.0, transparent: true});
	const gizmoGeometry = new THREE.SphereGeometry(2, 64, 16);
	let plinkgizmo = new THREE.Mesh(gizmoGeometry, gizmoMaterial);
	plinkgizmo.position.z = 80;
	plinkgizmo.visible = false;
	plinkplacer.add(plinkgizmo);
	plinkgizmo.scale.set(2, 1, 2);
	
	scene.add(pickableObjs);
	
	//THE SPHERE
	const radius = 100;
	const widthSegments = 64;
	const heightSegments = 32;
	const sphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
	
	//loading textures
	const loadingElem = document.querySelector('#loading');
	const progressBarElem = loadingElem.querySelector('.progressbar');
	const loadManager = new THREE.LoadingManager();
	const loader = new THREE.ImageBitmapLoader(loadManager);
	loader.setOptions( { imageOrientation: 'flipY' } );
	
	const sT = await loader.loadAsync("../no-image.jpg");
	const sphereTexture = new THREE.CanvasTexture(sT);
	sphereTexture.colorSpace = THREE.SRGBColorSpace;
	
	const sphereMaterial = new THREE.MeshBasicMaterial({side: THREE.BackSide, color: 0xFFFFFF, map: sphereTexture});
	let sphereMesh;
	renderer.initTexture(sphereTexture);
	loadingElem.style.display = 'none';
	sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
	sphereMesh.name = "sphere";
	sphereMesh.position.set(0,1.6,0);
	sphereMesh.scale.x = -1;//flipping the material back because THREE.Backside means we're looking from behind which means it's flipped
	scene.add(sphereMesh);
	ready = true;
	
	loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
		const progress = itemsLoaded / itemsTotal;
		progressBarElem.style.transform = `scaleX(${progress})`;
	};
	
	loadManager.onLoad = () => {
		document.body.style.cursor = "auto";
	}
	
	//switch to the view of the button selected
	const teleport = async (imglink) => {
		//if pic1 link was clicked on
		document.body.style.cursor = "wait";
		const sT0 = await loader.loadAsync(imglink);
		const sphereTexture0 = new THREE.CanvasTexture(sT0);
		sphereTexture0.colorSpace = THREE.SRGBColorSpace;
		renderer.initTexture(sphereTexture0);
		sphereMaterial.map = sphereTexture0;
		//newView = view.PIC_1;
		//button1Mesh.position.set(newView.PIC_1.x, newView.PIC_1.y, newView.PIC_1.z);
		//button1Mesh.scale.set(newView.PIC_1.s, newView.PIC_1.s/2, newView.PIC_1.s);
		//button1Mesh.visible = false;
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
				if (clinkplink && (event.target.id == "c")){
					//set plinkplacer rotation to raycaster rotation
					plinkplacer.position.copy(camera.position);
					plinkplacer.lookAt(this.raycaster.ray.direction);
					//update the new link position in the link object
					let ldname = document.getElementById("linkdataname").value;
					let worldposition = new THREE.Vector3();
					plinkgizmo.getWorldPosition(worldposition);
					links.full[ldname][clinkplink]["x"] = worldposition.x;
					links.full[ldname][clinkplink]["y"] = worldposition.y;
					links.full[ldname][clinkplink]["z"] = worldposition.z;
					console.log(JSON.stringify(links.full[ldname][clinkplink]));
				}					
			}
			
			//window.addEventListener('pointerdown', onPointerDown);
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
			
			if (clinkplink){
				const ldname = document.getElementById("linkdataname").value;
				const clpl = links.full[ldname][clinkplink];
				//set position gizmo to clinkplink's position
				plinkplacer.position.copy(camera.position);
				plinkplacer.lookAt(clpl["x"], clpl["y"], clpl["z"]);
				const scale = clpl["s"];
				plinkgizmo.scale.set(scale, scale/2, scale);
				
				//toggle link position gizmo on to see its link position
				plinkgizmo.visible = true;
			} else {
				plinkgizmo.visible = false;
				
				//links are still functional when not editing them
				for ( let i = 0; i < intersections.length; i++ ) {
					switch (intersections[ i ].object.name){
						case 'PIC_1':
							this.selectedObject = intersections[i].object;
							intersections[i].object.material.opacity = 1;
							break;
					}
				}
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
					switch (vrintersections[i].object.name){
						case 'PIC_1':
							this.controllerToObjectMap.set(controller, vrintersections[i].object);
							vrintersections[i].object.material.opacity = 1;
							break;
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
		camera.aspect = canvas.clientWidth/canvas.clientHeight;
		camera.updateProjectionMatrix();
		
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	}
	
	let render = (time) => {
		time *= 0.001; //milliseconds to seconds
		
		if (ready){
			button1Mesh.material.opacity = 0.4;
			
			//update the vr raycaster and calculate objects intersecting it
			VRPicker.update(pickableObjs, time);
			
			//update the desktop raycaster and calculate the objects intersecting it
			DesktopPicker.update(pickableObjs, time);
		}
		
		renderer.render(scene, camera);
		
	}
	
	renderer.setAnimationLoop(render);
	window.addEventListener('pointermove', onPointerMove);
	window.addEventListener('resize', onWindowResize);
	
	const switchTabs = (name) => {
		//teleport to view
		teleport(links.full[name].img);
		
		//set tabheader to white
		const tabname = "tab_" + name;
		for (const x in links.full){
			//every other tab back to blue
			const tabid = "tab_" + x;
			document.getElementById(tabid).style.background = "blue";
		}
		document.getElementById(tabname).style.background = "white";
		
		//fill tab contents
		document.getElementById("linkdataname").value = name;
		document.getElementById("linkdatalink").value = links.full[name].img;
		document.getElementById("positions").innerHTML = "";
		clinkplink = false;
		for (const plink in links.full[name]){
			if ((plink != name) && (plink != "img") && (plink != "stereo")){
				//adding positions from links
				let plob = links.full[name][plink];
				let positionlink = document.createElement("div");
				positionlink.setAttribute("class", "plink");
				let sedit = '<div><span class="pl_edit" id="pl_'+plink+'">📝</span><b> '+plink+': </b> Scale: <input id="pls_'+plink+'" type="number" placeholder="'+plob.s+'"/></div>';
				positionlink.innerHTML = sedit + '<div class="dpl" id="dpl_'+plink+'"> 🗑️ </div>';
				document.getElementById("positions").append(positionlink);
				let plid = "pl_"+plink;
				let scaleid = "pls_"+plink;
				let dplid = "dpl_"+plink;
				document.getElementById(plid).addEventListener("click", function(e) {
					const viewname = document.getElementById("linkdataname").value;
					const idplink = e.target.id;
					const plinkTo = e.target.id.substring(3);
					//turn every other link toggle off
					for (const z in links.full[viewname]){
						if ((z != viewname) && (z != "img") && (z != "stereo")){
							const zid = "pl_"+z;
							document.getElementById(zid).style.background = "white";
						}
					}
					//toggle link placer visibility
					if (clinkplink == plinkTo){
						clinkplink = false;
						document.getElementById(idplink).style.background = "white";
					} else {
						clinkplink = plinkTo;
						document.getElementById(idplink).style.background = "blue";
					}
				});
				document.getElementById(dplid).addEventListener("click", function(e) {
					const viewname = document.getElementById("linkdataname").value;
					const plinkTo = e.target.id.substring(4);
					//delete position link
					for (const j in links.full[viewname][plinkTo]) {
						delete links.full[viewname][plinkTo][j];
					}
					delete links.full[viewname][plinkTo];
					switchTabs(viewname);
				});
				document.getElementById(scaleid).addEventListener("input", function(e) {
					const viewname = document.getElementById("linkdataname").value;
					const plinkTo = e.target.id.substring(4);
					//update position link scale
					links.full[viewname][plinkTo]["s"] = parseFloat(e.target.value);
				});
			}
		}
	}
	
	document.getElementById("create").addEventListener('click', (event) => {
		document.getElementById("newlink").style.display = "block";
		document.getElementById("create").style.display = "none";
	});
	document.getElementById("close").addEventListener('click', (event) => {
		document.getElementById("newlink").style.display = "none";
		document.getElementById("create").style.display = "block";
	});
	document.getElementById("createposition").addEventListener('click', (event) => {
		document.getElementById("newplink").style.display = "block";
		document.getElementById("createposition").style.display = "none";
		let tabname = document.getElementById("linkdataname").value;
		let viewlist = document.getElementById("picklink");
		viewlist.innerHTML = "";
		for (const x in links.full){
			if (x != tabname){
				let linkoptions = document.createElement("option");
				linkoptions.value = x;
				linkoptions.innerHTML = x;
				viewlist.append(linkoptions);
			}
		}
	});
	document.getElementById("closepl").addEventListener('click', (event) => {
		document.getElementById("newplink").style.display = "none";
		document.getElementById("createposition").style.display = "block";
	});
	let linkname, linklink;
	document.getElementById("newlinkbtn").addEventListener('click', (event) => {
		linkname = document.getElementById("linkname").value;
		linklink = document.getElementById("linklink").value;
		if ((linklink.length > 5) && (linkname.length > 3)){
			links.full[linkname] = {
				"img": linklink,
				"stereo": false,
				[linkname]: {"s": 0, "x": 0, "y": -1.6, "z": 0}
			}
			document.getElementById("newlink").style.display = "none";
			document.getElementById("create").style.display = "block";
			console.log(JSON.stringify(links.full));
			teleport(links.full[linkname].img);
			//clear tab data
			document.getElementById("linkdata").style.display = "block";
			document.getElementById("createposition").style.display = "block";
			//add new tab
			let tabhead = document.createElement("div");
			tabhead.setAttribute("class", "tabhead");
			tabhead.innerText = linkname;
			tabhead.setAttribute("title", linkname);
			const tabid = "tab_" + linkname;
			tabhead.setAttribute("id", tabid);
			document.getElementById("tabheader").append(tabhead);
			document.getElementById(tabid).addEventListener("click", function(e) {
				switchTabs(e.target.innerText);
			});
			switchTabs(linkname);
		} else {
			console.log("empty!");
		}
	});
	
	document.getElementById("newplinkbtn").addEventListener('click', (event) => {
		//add plink to links object
		const linkname = document.getElementById("linkdataname").value;
		const plinkname = document.getElementById("picklink").value;
		links.full[linkname][plinkname] = {
			"s" : 1.0,
			"x" : 0.0,
			"y" : -1.6,
			"z" : 0.0
		}
		console.log(JSON.stringify(links.full));
		const plink = links.full[linkname][plinkname];
		switchTabs(linkname);
		document.getElementById("newplink").style.display = "none";
		document.getElementById("createposition").style.display = "block";
	});
}

//texture view/link properties
let links = {
	"header": {
		"version": 0.1
	},
	"full": {
		
	},
	"lite":{
		
	}
};

//export html, save and load .hvrj (humangle vr json)
//before that make sure the pointers are appropriate for its actions, panning, pointing to links,
//make sure the gizmo is blue and render the buttons for the links;

main();

const CoordToPosition = (lat, lon, dep, cx, cy, cz) => {
	let latRad = lat * Math.PI / 180;
	let lonRad = lon * Math.PI / 180;
	
	let xPos= dep * Math.cos(latRad) * Math.cos(lonRad);
	let zPos = dep * Math.cos(latRad) * Math.sin(lonRad);
	let yPos = dep * Math.sin(latRad);
	
	let worldcoord = {"x": xPos+cx, "y": yPos, "z": zPos+cz};
	return worldcoord;
}