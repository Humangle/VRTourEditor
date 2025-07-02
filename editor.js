import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

//version 170
let ready = false;
screen.orientation.lock("landscape-primary");

let main = async (view) => {
	
	//set up the canvas for THREE.js
	const canvas = document.getElementById("c");
	const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
	renderer.setPixelRatio(window.devicePixelRatio);
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
	scene.background = new THREE.Color(0x010101);
	
	const pickableObjs = new THREE.Object3D();
	let viewTextures = {};
	
	//setting the view
	let newView;
	
	//button template
	let makeButton = (buttonName) => {
		//button linking to PIC
		const buttonMaterial = new THREE.MeshPhongMaterial({emissive: 0xFFFFFF, opacity: 0.3, transparent: true});
		const buttonGeometry = new THREE.SphereGeometry(2, 64, 16);
		let buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
		buttonMesh.name = buttonName;
		return buttonMesh;
	}
	
	//make buttons to each 360 image
	for (const a in links.full){
		if (!pickableObjs.getObjectByName(a)) {
			pickableObjs.add(makeButton(a));
		}
	}
	
	//position link placer
	let clinkplink = false;
	let plinkplacer = new THREE.Object3D();
	plinkplacer.position.copy(camera.position);
	scene.add(plinkplacer);
	let gizmoMaterial = new THREE.MeshPhongMaterial({emissive: 0x22b2d7, opacity:0.2, transparent: true});
	const gizmoGeometry = new THREE.SphereGeometry(1, 64, 16);
	let plinkgizmo = new THREE.Mesh(gizmoGeometry, gizmoMaterial);
	plinkgizmo.visible = false;
	plinkplacer.add(plinkgizmo);
	plinkgizmo.scale.set(1, 1, 1);
	plinkgizmo.position.z = 80;
	
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
	const loader = new THREE.ImageBitmapLoader(loadManager);
	loader.setOptions( { imageOrientation: 'flipY' } );
	
	const sT = await loader.loadAsync("./assets/no-image.jpg");
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
		for (const b in links.full[viewname]){
			if (b!="img" && viewTextures[b] == undefined){
				const sTX = await loader.loadAsync(links.full[b].img);
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
		document.body.style.cursor = "default";
	}
	
	//switch to the view of the button selected
	const teleport = async (viewname) => {
		if (links.full[viewname] != undefined){
			loadTextures(viewname);
			
			newView = links.full[viewname];
			
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
				
				document.getElementById("c").style.cursor = "grab";
			}
			
			const onPointerDown = (event) => {
				console.log(this.selectedObject.name + " " + clinkplink + " " + event.target.id);
				if ((this.selectedObject.name != "") && (clinkplink == false)) {
					console.log("thisSelectedObject");
					console.log(this.selectedObject);
					this.dispatchEvent({type: event.type, object: this.selectedObject});
				}
				if (clinkplink && event.target.id == "c"){
					//set plinkplacer rotation to raycaster rotation
					plinkplacer.lookAt(this.raycaster.ray.direction.normalize().multiplyScalar(80));
					//update the new link position in the link object
					let ldname = document.getElementById("linkdataname").value;
					let worldposition = new THREE.Vector3();
					plinkgizmo.getWorldPosition(worldposition);
					pickableObjs.getObjectByName(clinkplink).position.set(worldposition.x, worldposition.y, worldposition.z);
					
					if (pickableObjs.getObjectByName(clinkplink).name == clinkplink){
						//if link exists
						console.log(event.target.id);
						console.log("POSITION UPDATED!! Check here why it doesn't update the button");
					}
					links.full[ldname][clinkplink]["x"] = worldposition.x;
					links.full[ldname][clinkplink]["y"] = worldposition.y;
					links.full[ldname][clinkplink]["z"] = worldposition.z;
					const sl = links.full[ldname][clinkplink]["s"];
					pickableObjs.getObjectByName(clinkplink).scale.set(sl, sl/2, sl);
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
			
			if (clinkplink){
				const ldname = document.getElementById("linkdataname").value;
				const clpl = links.full[ldname][clinkplink];
				//set position gizmo to clinkplink's position
				plinkplacer.position.copy(camera.position);
				plinkplacer.lookAt(clpl["x"], clpl["y"], clpl["z"]);
				const scale = clpl["s"];
				plinkgizmo.scale.set(scale, scale, scale);
			
				document.getElementById("c").style.cursor = "move";
			} else {
				
				//links are still functional when not editing them
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
			console.log("Desktop Click");
			switchTabs(event.object.name);
		}
	});
	
	//On VR click
	const VRPicker = new ControllerPickHelper(scene);
	VRPicker.addEventListener('select', (event) => {
		//switch to the view of the button selected
		if (event.object.name){
			console.log("VR Click");
			switchTabs(event.object.name);
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
		
		renderer.render(scene, camera);
		
	}
	
	renderer.setAnimationLoop(render);
	window.addEventListener('pointermove', onPointerMove);
	window.addEventListener('resize', onWindowResize);
	
	const switchTabs = (name) => {
		console.log("switchTabs: "+name);
		document.getElementById("intro").style.display = "none";
		//teleport to view
		teleport(name);
		
		//set tabheader to white
		const tabname = "tab_" + name;
		for (const x in links.full){
			//every other tab back to blue
			const tabid = "tab_" + x;
			document.getElementById(tabid).style.background = "#22b2d7";
			document.getElementById(tabid).style.color = "#FFFFFF";
			if (pickableObjs.getObjectByName(x)){
				pickableObjs.getObjectByName(x).material.emissive = new THREE.Color(0xFFFFFF);
			}
		}
		document.getElementById(tabname).style.background = "#FFFFFF";
		document.getElementById(tabname).style.color = "#22b2d7";
		document.getElementById(tabname).scrollIntoView({ behavior: "smooth"});
		
		//fill tab contents
		document.getElementById("linkdataname").value = name;
		document.getElementById("linkdatalink").value = links.full[name].img;
		document.getElementById("positions").innerHTML = "";
		clinkplink = false;
		for (const plink in links.full[name]){
			if ((plink != name) && (plink != "img")){
				//adding positions from links
				let plob = links.full[name][plink];
				if (pickableObjs.getObjectByName(plink) && (plob.s!=0) && ((plob.x+plob.z)!=0)){
					pickableObjs.getObjectByName(plink).position.set(plob.x, plob.y, plob.z);
					pickableObjs.getObjectByName(plink).scale.set(plob.s, plob.s/2, plob.s);
				} else if (pickableObjs.getObjectByName(plink) && (plob.s!=0) && ((plob.x+plob.z)==0)) {
					pickableObjs.getObjectByName(plink).position.set(0, 78.4, 0);
					pickableObjs.getObjectByName(plink).scale.set(plob.s, plob.s/2, plob.s);
				}
				console.log("Did Button Reset?")
				let positionlink = document.createElement("div");
				positionlink.setAttribute("class", "plink");
				let sedit = '<details name="conns"><summary class="pl_edit" id="pl_'+plink+'"> Edit Connection to '+plink+'</summary><div class="pld">Scale: <input id="pls_'+plink+'" type="number" step="0.1" value="'+plob.s+'" placeholder="'+plob.s+'"/>';
				positionlink.innerHTML = sedit + '<span class="dpl" id="dpl_'+plink+'"> 🗑️ </span></div></details>';
				document.getElementById("positions").append(positionlink);
				let plid = "pl_"+plink;
				let scaleid = "pls_"+plink;
				let dplid = "dpl_"+plink;
				document.getElementById(plid).addEventListener("click", function(e) {
					const viewname = document.getElementById("linkdataname").value;
					const idplink = e.target.id;
					const plinkTo = e.target.id.substring(3);
					//turn every other link toggle off and close the detail
					for (const z in links.full[viewname]){
						if ((z != viewname) && (z != "img")){
							const zid = "pl_"+z;
							document.getElementById(zid).style.background = "white";
							if (pickableObjs.getObjectByName(z)){
								pickableObjs.getObjectByName(z).material.emissive = new THREE.Color(0xFFFFFF);
							}
						}
					}
					//toggle link placer visibility
					if (clinkplink == plinkTo){
						clinkplink = false;
						document.getElementById(idplink).style.background = "#FFFFFF";
						pickableObjs.getObjectByName(plinkTo).material.emissive = new THREE.Color(0xFFFFFF);
					} else {
						clinkplink = plinkTo;
						document.getElementById(idplink).style.background = "#22b2d7";
						pickableObjs.getObjectByName(plinkTo).material.emissive = new THREE.Color(0x22b2d7);
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
					console.log("dplid");
					switchTabs(viewname);
				});
				document.getElementById(scaleid).addEventListener("input", function(e) {
					const viewname = document.getElementById("linkdataname").value;
					const plinkTo = e.target.id.substring(4);
					//update position link scale
					const sl = parseFloat(e.target.value);
					links.full[viewname][plinkTo]["s"] = parseFloat(e.target.value);
					pickableObjs.getObjectByName(plinkTo).scale.set(sl, sl/2, sl);
				});
			} else if (plink == name && pickableObjs.getObjectByName(plink)) {
				//making link to self invisible
				let plob = links.full[name][plink];
				pickableObjs.getObjectByName(plink).position.set(plob.x, plob.y, plob.z);
				pickableObjs.getObjectByName(plink).scale.set(plob.s, plob.s, plob.s);
				pickableObjs.getObjectByName(plink).visible = false;
			}
		}
		
		//update settings
		document.getElementById("projectname").value = links.header.project;
		let viewlist = document.getElementById("projectindex");
		viewlist.innerHTML = "";
		for (const x in links.full){
			let linkoptions = document.createElement("option");
			linkoptions.value = x;
			linkoptions.innerHTML = x;
			viewlist.append(linkoptions);
		}
		document.getElementById("projectindex").value = links.header.index;
		document.getElementById("pan").value = links.header.pan;
		//document.getElementById("projectstereo").value = "unchecked"; comment since stereo isn't ready
		
		if (links.header?.pan > 0){
			sphereMesh.rotation.y = (links.header.pan/180)*Math.PI;
			pickableObjs.rotation.y = (links.header.pan/180)*Math.PI;
		}
		
		//autosave
		let recentlyedited = "recent::"+links.header.project.replaceAll(" ", "_");
		localStorage.setItem(recentlyedited, JSON.stringify(links));
	}
	
	document.getElementById("create").addEventListener('click', (event) => {
		document.getElementById("linkname").value = "";
		document.getElementById("linklink").value = "";
		document.getElementById("newlink").style.display = "block";
		document.getElementById("create").style.display = "none";
		document.getElementById("errora").innerText = "";
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
		document.getElementById("errorb").innerText = "";
		document.getElementById("cimgn").innerText = "‟"+tabname+"”";
	});
	document.getElementById("closepl").addEventListener('click', (event) => {
		document.getElementById("newplink").style.display = "none";
		document.getElementById("createposition").style.display = "block";
	});
	let linkname, linklink;
	document.getElementById("imageupload").addEventListener('submit', (event) => {
		event.preventDefault();
		linkname = document.getElementById("linkname").value;
		linklink = document.getElementById("linklink").value;
		if ((linklink.length > 5) && (linkname.length > 3) && (!links.full[linkname])){
			links.full[linkname] = {
				"img": linklink,
				[linkname]: {"s": 0, "x": 0, "y": -1.6, "z": 0}
			}
			document.getElementById("newlink").style.display = "none";
			document.getElementById("create").style.display = "block";
			teleport(linkname);
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
				console.log("tabid");
				switchTabs(e.target.innerText);
			});
			console.log("image uploaded");
			switchTabs(linkname);
		} else {
			console.log("name or link not long enough or name already exists");
			document.getElementById("errora").innerText = "Error: ‟"+linkname+"” already exists.";
		}
	});
	
	document.getElementById("connection").addEventListener('submit', (event) => {
		event.preventDefault();
		const linkname = document.getElementById("linkdataname").value;
		const plinkname = document.getElementById("picklink").value;
		
		if (!links.full[linkname][plinkname]){
			//make button for the new link position
			if (!pickableObjs.getObjectByName(plinkname)){
				pickableObjs.add(makeButton(plinkname));
			}
			
			//add plink to links object
			links.full[linkname][plinkname] = {
				"s" : 1.0,
				"x" : 0.0,
				"y" : -1.6,
				"z" : 0.0
			}
			
			document.getElementById("newplink").style.display = "none";
			document.getElementById("createposition").style.display = "block";
			console.log("connection created");
			switchTabs(linkname);
		} else {
			console.log("connection already exists");
			document.getElementById("errorb").innerText = "Error: ‟"+linkname+"” is already connected to ‟"+plinkname+"”.";
		}
	});
	
	//project settings input
	document.getElementById("projectname").addEventListener('input', (event) => {
		links.header.project = document.getElementById("projectname").value;
		//autosave
		let recentlyedited = "recent::"+links.header.project.replaceAll(" ", "_");
		localStorage.setItem(recentlyedited, JSON.stringify(links));
	});
	document.getElementById("projectindex").addEventListener('input', (event) => {
		if (links.full[document.getElementById("projectindex").value]){
			links.header.index = document.getElementById("projectindex").value;
		}
		//autosave
		let recentlyedited = "recent::"+links.header.project.replaceAll(" ", "_");
		localStorage.setItem(recentlyedited, JSON.stringify(links));
	});
	document.getElementById("pan").addEventListener('input', (event) => {
		if (document.getElementById("projectindex").value < 0){
			links.header.pan = 360 + document.getElementById("pan").value;
			sphereMesh.rotation.y = (links.header.pan/180)*Math.PI;
			pickableObjs.rotation.y = (links.header.pan/180)*Math.PI;
		} else {
			links.header.pan = document.getElementById("pan").value;
			sphereMesh.rotation.y = (links.header.pan/180)*Math.PI;
			pickableObjs.rotation.y = (links.header.pan/180)*Math.PI;
		}
		//autosave
		let recentlyedited = "recent::"+links.header.project.replaceAll(" ", "_");
		localStorage.setItem(recentlyedited, JSON.stringify(links));
	});
	
	document.getElementById("msbtn").addEventListener('click', (event) => {
		document.getElementById("moresettings").style.display = "block";
		document.getElementById("errora").innerText = "";
	});
	document.getElementById("closems").addEventListener('click', (event) => {
		document.getElementById("moresettings").style.display = "none";
		//autosave
		let recentlyedited = "recent::"+links.header.project.replaceAll(" ", "_");
		localStorage.setItem(recentlyedited, JSON.stringify(links));
	});
	
	//export zip, save and load .hvrj (humangle vr json)
	
	async function GenerateZip(template) {
		const zip = new JSZip();
		const zipname = links.header.project.replaceAll(" ", "_");
		
		//HVRJ
		const hvrjfile = new Blob([JSON.stringify(links)], { type: 'application/json' });
		zip.file(links["header"]["project"]+".hvrj", hvrjfile);
		
		//Default No Image
		const noimagefile = await fetch("./assets/no-image.jpg").then(r => r.blob());
		zip.file("no-image.jpg", noimagefile); // adds the image file to the zip file
		
		//Embed Example
		const embedfile = await fetch("./sample/how-to-embed.html").then(r => r.blob());
		zip.file("How-To.html", embedfile);
		
		//HTML, JS, CSS and Manifest Templates
		
		const htmlfile = new Blob([template.html], { type: 'text/plain;charset=utf-8' });
		zip.file("index.html", htmlfile);
		
		const jsfile = new Blob([template.js], { type: 'text/javascript' });
		zip.file("index.js", jsfile);
		
		const cssfile = new Blob([template.css], { type: 'text/css' });
		zip.file("main.css", cssfile);
		
		const manifestfile = new Blob([template.manifest], { type: 'application/json' });
		zip.file("manifest.json", manifestfile);
		
		const zipData = await zip.generateAsync({
			type: "blob",
			streamFiles: true
		})
		
		//autosave
		let recentlyedited = "recent::"+links.header.project.replaceAll(" ", "_");
		localStorage.setItem(recentlyedited, JSON.stringify(links));
		//downloadzip
		const link = document.createElement('a');
		link.href = window.URL.createObjectURL(zipData);
		link.download = links.header.project.replaceAll(" ", "_")+".zip";
		link.click();
	}
	
	document.getElementById("export").addEventListener('click', (event) => {
		links.lite = links.full;
		GenerateZip(GenerateFiles(links));
	});

	document.getElementById("save").addEventListener('click', (event) => {
		//autosave
		let recentlyedited = "recent::"+links.header.project.replaceAll(" ", "_");
		localStorage.setItem(recentlyedited, JSON.stringify(links));
		//downloadsave
		const link = document.createElement("a");
		const file = new Blob([JSON.stringify(links)], { type: 'application/json' });
		link.href = URL.createObjectURL(file);
		link.download = links["header"]["project"]+".hvrj";
		link.click();
		URL.revokeObjectURL(link.href);
	});
	
	document.getElementById("newfile").style.display = "block";
	document.getElementById("menu").style.display = "none";
	document.getElementById("load").addEventListener('click', (event) => {
		console.log("load");
		if (document.getElementById("newfile").style.display == "none"){
			document.getElementById("newfile").style.display = "block";
			document.getElementById("menu").style.display = "none";
			showrecentprojects();
		} else {
			document.getElementById("newfile").style.display = "none";
			document.getElementById("menu").style.display = "block";
		}
	});
	
	const loadHVRJ = (hvrj) => {
		links = hvrj;
		document.getElementById("newfile").style.display = "none";
		document.getElementById("menu").style.display = "block";
		teleport(links.header.index);
		//clear tab data
		document.getElementById("tabheader").innerHTML = "";
		document.getElementById("linkdata").style.display = "block";
		document.getElementById("createposition").style.display = "block";
		pickableObjs.clear();
		
		//make tabs and buttons to each 360 image
		for (const a in links.full){
			if (!pickableObjs.getObjectByName(a)) {
				pickableObjs.add(makeButton(a));
			}
			
			let tabhead = document.createElement("div");
			tabhead.setAttribute("class", "tabhead");
			tabhead.innerText = a;
			tabhead.setAttribute("title", a);
			const tabid = "tab_" + a;
			tabhead.setAttribute("id", tabid);
			document.getElementById("tabheader").append(tabhead);
			document.getElementById(tabid).addEventListener("click", function(e) {
				console.log("tabid");
				switchTabs(e.target.innerText);
			});
		}
		//settings
		document.getElementById("version").innerText = "v" + links.header.version;
			
		switchTabs(links.header.index);
	}
	
	document.getElementById('newbtemp').addEventListener('click', (event) => {
		if (document.getElementById("newproname").value == ""){
			document.getElementById("newproname").focus();
		} else {
			links = {
				"header": {
					"version": 1.2001,
					"project": "untitled",
					"icon": "https://humanglemedia.com/wp-content/uploads/2020/03/cropped-android-chrome-512x512-1-32x32.png",
					"image": "https://raw.githubusercontent.com/Humangle/VRTourEditor/refs/heads/main/assets/title-image.png",
					"stereo": false,
					"index": "",
					"pan": 0
				},
				"full": {},
				"lite":{}
			};
			document.getElementById("projectname").value = document.getElementById("newproname").value;
			links.header.project = document.getElementById("newproname").value;
			document.getElementById("newfile").style.display = "none";
			document.getElementById("menu").style.display = "block";
			//clear tab data
			document.getElementById("tabheader").innerHTML = "";
			document.getElementById("linkdata").style.display = "none";
			document.getElementById("createposition").style.display = "none";
			document.getElementById("intro").style.display = "block";
			sphereMaterial.map = sphereTexture;
			pickableObjs.clear();
			document.getElementById("projectindex").innerHTML = "";
			document.getElementById("pan").value = 0;
		}
	});
	
	document.getElementById('ottemp').addEventListener('click', (event) => {
		if (document.getElementById('newproname').value == ""){
			fetch('./sample/HumAngle VR Tour.hvrj').then(response => response.json()).then(template => {
				template.header.project = "HumAngle Office Tour";
				loadHVRJ(template);
			});
		} else {
			fetch('./sample/HumAngle VR Tour.hvrj').then(response => response.json()).then(template => {
				template.header.project = document.getElementById('newproname').value;
				loadHVRJ(template);
			});
		}
	});
	
	document.getElementById('contentfile').onchange = function(cevt) {
		try {
			let files = cevt.target.files;
			if (!files.length) {
				alert('No file selected!');
				return;
			}
			let file = files[0];
			let reader = new FileReader();
			const self = this;
			reader.onload = (revt) => {
				loadHVRJ(JSON.parse(revt.target.result));
			};
			reader.readAsText(file);
		} catch (err) {
			console.error(err);
		}
	}
	const showrecentprojects = () => {
		document.getElementById("recentfiles").innerHTML = "";
		let derpnametag = "";
		let derpname = "";
		for (const key in localStorage) {
			if (Object.hasOwnProperty.call(localStorage, key)) {
				const element = localStorage[key];
				if (key.startsWith('recent::')){
					derpnametag = key.replace('recent::','');
					derpname = ""+derpnametag.replaceAll('_', ' ');
					
					let rplitems = document.createElement("div");
					rplitems.setAttribute("class", "rplitems");
					let rplitem_t = document.createElement("div");
					rplitem_t.setAttribute("id", derpnametag);
					rplitem_t.setAttribute("style", "padding:10px;width:100%;");
					rplitem_t.innerText = derpname;
					rplitem_t.addEventListener('click', function(e){
						console.log("should load");
						loadHVRJ(JSON.parse(localStorage.getItem("recent::"+e.target.id)));
					});
					rplitems.append(rplitem_t);
					let rplitem_d = document.createElement("div");
					rplitem_d.setAttribute("id", "d_"+derpnametag);
					rplitem_d.setAttribute("class", "dbtn");
					let rplitem_di = document.createElement("i");
					rplitem_di.setAttribute("class", "fa fa-trash");
					rplitem_di.setAttribute("aria-hidden", "true");
					rplitem_d.append(rplitem_di);
					rplitem_d.addEventListener('click', function(e) {
						let proid = e.target.id;
						let proname = proid.replaceAll("_"," ");
						proname = proname.slice(2);         
						localStorage.removeItem("recent::"+proid.slice(2));
						showrecentprojects();
					});
					rplitems.append(rplitem_d);
					document.getElementById("recentfiles").append(rplitems);
				}
			}
		}
	}
	showrecentprojects();
}

//texture view/link properties
let links = {
	"header": {
		"version": 1.2001,
		"project": "untitled",
		"icon": "https://humanglemedia.com/wp-content/uploads/2020/03/cropped-android-chrome-512x512-1-32x32.png",
		"image": "https://raw.githubusercontent.com/Humangle/VRTourEditor/refs/heads/main/assets/title-image.png",
		"stereo": false,
		"index": "",
		"pan": 0
	},
	"full": {
		
	},
	"lite":{
		
	}
};

main();

const coordToPosition = (lat, lon, dep, cx, cy, cz) => {
	let latRad = lat * Math.PI / 180;
	let lonRad = lon * Math.PI / 180;
	
	let xPos= dep * Math.cos(latRad) * Math.cos(lonRad);
	let zPos = dep * Math.cos(latRad) * Math.sin(lonRad);
	let yPos = dep * Math.sin(latRad);
	
	let worldcoord = {"x": xPos+cx, "y": yPos, "z": zPos+cz};
	return worldcoord;
}

const latToScale = () => {
	
}

const distToScale = (size1maway, dist2move) => {
	//assuming the we know how it looks 1m away
}