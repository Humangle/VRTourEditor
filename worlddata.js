import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ARButton} from 'three/addons/webxr/ARButton.js';
import {XREstimatedLight} from 'three/addons/webxr/XREstimatedLight.js';

let ready = false; //state of the software textures

let sptexture = 0; //texture on display
let spreset = true;
const setstate = (i) => {
	if (sptexture != i) {
		spreset = true;
	} else {
		spreset = false;
	}
	sptexture = i;
}

const CoordToPosition = (lat, lon, crad, cx, cy, cz) => {
	let latRad = lat * Math.PI / 180;
	let lonRad = lon * Math.PI / 180;
	
	let xPos= crad * Math.cos(latRad) * Math.cos(lonRad);
	let zPos = crad * Math.cos(latRad) * Math.sin(lonRad);
	let yPos = crad * Math.sin(latRad);
	
	let worldcoord = {"x": xPos+cx, "y": yPos, "z": zPos+cz};
	return worldcoord;
}

const loadFile = async (url) => {
	const res = await fetch(url);
	return res.text();
}

const parseData = (text) => {
	
	const data = [];
	const settings = {data};
	let max;
	let min;
	
	// split into lines
	text.split('\n').forEach((line) => {
		
		// split the line by whitespace
		const parts = line.trim().split(/\s+/);
		
		if (parts.length === 2) {
			
			// only 2 parts, must be a key/value pair
			settings[parts[0]] = parseFloat(parts[1]);
			
		} else if (parts.length > 2) {
			
			// more than 2 parts, must be data
			const values = parts.map((v) => {
				const value = parseFloat(v);
				if (value === settings.NODATA_value) {
					return undefined;
				}
				max = Math.max(max === undefined ? value : max, value);
				min = Math.min(min === undefined ? value : min, value);
				return value;
			});
			
			data.push(values);
		}
	});
	
	return Object.assign(settings, {min, max});
}

//loadFile('https://threejs.org/manual/examples/resources/data/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014mt_2010_cntm_1_deg.asc').then(parseData).then(drawData);
let main = () => {
	//set up the canvas for THREE.js
	const canvas = document.getElementById("c");
	const renderer = new THREE.WebGLRenderer({canvas, alpha: true, premultipliedAlpha: false});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.xr.enabled = true;
	renderer.xr.setReferenceSpaceType('local');
	renderer.xr.setFoveation(1.0);
	
	//set the camera up
	const fov = 45;
	const aspect = canvas.clientWidth/canvas.clientHeight;
	const near = 0.1;
	const far = 100;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(0, 1.6, 0);
	
	//orbital camera controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.minDistance = 0.3;
	controls.maxDistance = 0.6;
	controls.maxPolarAngle = 2;
	controls.minPolarAngle = 1;
	controls.target.set(0, -0.1, -0.6);
	controls.update();
	
	//here we go!
	const scene = new THREE.Scene();
	
	//loading textures
	const loadingElem = document.querySelector('#loading');
	const progressBarElem = loadingElem.querySelector('.progressbar');
	const loadManager = new THREE.LoadingManager();
	const loader = new THREE.TextureLoader(loadManager);
	
	const radius = 0.2;
	const widthSegments = 32;
	const heightSegments = 24;
	const sphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
	
	const EarthDayTexture = loader.load('https://raw.githubusercontent.com/LearningMike/360images/main/8k_earth_daymap.jpg');
	const EarthNightTexture = loader.load('https://raw.githubusercontent.com/LearningMike/360images/main/8k_earth_nightmap.jpg');
	const EarthPopulationTexture = loader.load('https://raw.githubusercontent.com/LearningMike/360images/main/8k_popdensity.jpg');
	const EarthWaterTexture = loader.load('https://raw.githubusercontent.com/LearningMike/360images/main/8k_waterarea.jpg');
	const EarthSpecularTexture = loader.load('https://raw.githubusercontent.com/LearningMike/360images/main/2k_earth_specular_map.tif');
	renderer.initTexture(EarthDayTexture);
	renderer.initTexture(EarthNightTexture);
	renderer.initTexture(EarthPopulationTexture);
	renderer.initTexture(EarthWaterTexture);
	renderer.initTexture(EarthSpecularTexture);
	
	const sphereMaterialEarth = new THREE.MeshPhongMaterial({
		color: 0xFFFFFF,
		map: EarthDayTexture,
		emissive: 0xFFFFFF,
		emissiveMap: EarthPopulationTexture,
		emissiveIntensity: 0,
		specularMap: EarthSpecularTexture,
		toneMapped: false
	});
	
	let sphereMesh;
	
	loadManager.onLoad = () => {
		loadingElem.style.display = 'none';
		sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterialEarth);
		sphereMesh.position.set(0, -0.1, -0.6);
		scene.add(sphereMesh);
		ready = true;
	};
	
	loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
		const progress = itemsLoaded / itemsTotal;
		progressBarElem.style.transform = `scaleX(${progress})`;
	};
	
	const desktoplight = new THREE.DirectionalLight(0xFFFFFF, 2);
	desktoplight.position.set(0, 1.5, 4);
	camera.add(desktoplight);
	scene.add(camera);
	// Don't add the XREstimatedLight to the scene initially.
	// It doesn't have any estimated lighting values until an AR session starts.
	const xrLight = new XREstimatedLight(renderer);
	
	xrLight.addEventListener( 'estimationstart' , () => {
		camera.remove(desktoplight);
		scene.add(xrLight);
		
		if (xrLight.environment) {
			scene.environment = xrLight.environment;
		}	
	});
	
	xrLight.addEventListener( 'estimationend', () => {
		
		scene.remove(xrLight);
		scene.environment = null;
		
		camera.add(desktoplight);
		
	});
	
	document.body.appendChild(ARButton.createButton(renderer, {
		optionalFeatures: ['light-estimation']
	}));
	
	const onWindowResize = () => {
		camera.aspect = canvas.clientWidth/canvas.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	}
	
	const electricity = (show) => {
		if (show){
			if (spreset){
				sphereMaterialEarth.emissiveMap = EarthNightTexture;
				sphereMaterialEarth.emissiveIntensity = 0;
				desktoplight.intensity = 2;
				spreset = false;
			}
			if ((sphereMaterialEarth.emissiveIntensity + 0.01) < 1) {
				sphereMaterialEarth.emissiveIntensity += 0.01;
			}
			if ((desktoplight.intensity - 0.02) > 0.4) {
				desktoplight.intensity -= 0.02;
			}
			console.log("increasing electricity");
		} else {
			if ((sphereMaterialEarth.emissiveIntensity - 0.01) > 0) {
				sphereMaterialEarth.emissiveIntensity -= 0.01;
			}
			if ((desktoplight.intensity + 0.02) < 2) {
				desktoplight.intensity += 0.02;
			} else {
				spreset = true;
			}
			console.log("decreasing electricity");
		}
	}
	
	const population = (show) => {
		if (show){
			if (spreset){
				sphereMaterialEarth.emissiveMap = EarthPopulationTexture;
				sphereMaterialEarth.emissiveIntensity = 0;
				desktoplight.intensity = 2;
				spreset = false;
			}
			if ((sphereMaterialEarth.emissiveIntensity + 0.01) < 1) {
				sphereMaterialEarth.emissiveIntensity += 0.01;
			}
			if ((desktoplight.intensity - 0.02) > 0.4) {
				desktoplight.intensity -= 0.02;
			}
			console.log("increasing population");
		} else {
			if ((sphereMaterialEarth.emissiveIntensity - 0.01) > 0) {
				sphereMaterialEarth.emissiveIntensity -= 0.01;
			}
			if ((desktoplight.intensity + 0.02) < 2) {
				desktoplight.intensity += 0.02;
			} else {
				spreset = true;
			}
			console.log("decreasing population");
		}
	}
	
	const water = (show) => {
		if (show){
			if (spreset){
				sphereMaterialEarth.emissiveMap = EarthWaterTexture;
				sphereMaterialEarth.emissiveIntensity = 0;
				desktoplight.intensity = 2;
				spreset = false;
			}
			if ((sphereMaterialEarth.emissiveIntensity + 0.01) < 0.6) {
				sphereMaterialEarth.emissiveIntensity += 0.01;
			}
			if ((desktoplight.intensity - 0.02) > 1.4) {
				desktoplight.intensity -= 0.02;
			}
			console.log("increasing water");
		} else {
			if ((sphereMaterialEarth.emissiveIntensity - 0.01) > 0) {
				sphereMaterialEarth.emissiveIntensity -= 0.01;
			}
			if ((desktoplight.intensity + 0.02) < 2) {
				desktoplight.intensity += 0.02;
			} else {
				spreset = true;
			}
			console.log("decreasing water");
		}
	}
	
	let startime = 0;
	
	let render = (time) => {
		time *= 0.001; // convert time to seconds
		
		if (ready && renderer.xr.isPresenting){
			//sphereMesh.rotation.y = time/2;
			
			if (startime == 0) {
				startime = time;
			}
			
			let tim = time - startime;
			
			if (tim > 3 && tim < 6){
				electricity(true);
			} else if (tim > 13 && tim < 16){
				electricity(false);
			}
			
			if (tim > 23 && tim < 26){
				population(true);
			} else if (tim > 33 && tim < 36){
				population(false);
			}
			
			if (tim > 43 && tim < 46){
				water(true);
			} else if (tim > 53 && tim < 56){
				water(false);
			}
		} else if (ready){
			switch (sptexture) {
				case 0:
					//
					break;
				case 1:
					electricity(true);
					break;
				case 2:
					population(true);
					break;
				case 3:
					water(true);
					break;
			}
		}
		
		renderer.render(scene, camera);
	}
	
	renderer.setAnimationLoop(render);
	window.addEventListener('resize', onWindowResize);
	document.getElementById("electricity").addEventListener("click", () => setstate(1));
	document.getElementById("population").addEventListener("click", () => setstate(2));
	document.getElementById("water").addEventListener("click", () => setstate(3));
}
main();